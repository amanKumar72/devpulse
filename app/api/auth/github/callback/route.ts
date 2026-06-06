import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { signToken, setAuthCookie } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/mailer'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/signin?error=GitHub auth code missing', request.url))
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'DevPulse-Next-App',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID || '',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '',
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL || '',
      }),
    })

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text()
      console.error('GitHub token exchange error status:', tokenRes.status, errorText)
      return NextResponse.redirect(new URL('/signin?error=GitHub token exchange failed', request.url))
    }

    const tokenText = await tokenRes.text()
    let tokenData: any
    try {
      tokenData = JSON.parse(tokenText)
    } catch (err) {
      console.error('Failed to parse GitHub token response as JSON. Response text:', tokenText.slice(0, 1000))
      return NextResponse.redirect(new URL('/signin?error=GitHub token exchange returned invalid format', request.url))
    }

    const { access_token } = tokenData

    if (!access_token) {
      console.error('GitHub token exchange did not return access_token. Response data:', tokenData)
      return NextResponse.redirect(new URL('/signin?error=Invalid GitHub token response', request.url))
    }

    // 2. Fetch GitHub user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'User-Agent': 'DevPulse-Next-App',
      },
    })

    if (!userRes.ok) {
      console.error('GitHub user profile fetch failed')
      return NextResponse.redirect(new URL('/signin?error=Failed to retrieve GitHub profile', request.url))
    }

    const profile = await userRes.json()
    const { login, id: githubId, avatar_url, bio } = profile
    let email = profile.email

    // 3. GitHub emails can be private, fetch explicitly if null
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'User-Agent': 'DevPulse-Next-App',
        },
      })
      if (emailRes.ok) {
        const emails = await emailRes.json()
        const primaryEmailObj = emails.find((e: any) => e.primary && e.verified) || emails[0]
        email = primaryEmailObj?.email
      }
    }

    if (!email) {
      return NextResponse.redirect(new URL('/signin?error=No email associated with GitHub account', request.url))
    }

    await dbConnect()

    // 4. Find or create user
    const stringGithubId = String(githubId)
    let user = await User.findOne({
      providers: {
        $elemMatch: {
          name: 'github',
          id: stringGithubId
        }
      }
    })

    if (!user) {
      // Check if email already registered
      user = await User.findOne({ email })

      if (user) {
        // Link GitHub to existing account
        user.providers.push({ name: 'github', id: stringGithubId })
        if (!user.avatar) user.avatar = avatar_url
        await user.save()
      } else {
        // Create new account
        let username = login.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
        const usernameExists = await User.findOne({ username })
        if (usernameExists) {
          username = `${username}${Math.floor(1000 + Math.random() * 9000)}`
        }

        user = await User.create({
          username,
          email,
          avatar: avatar_url || `https://robohash.org/${username}.png?set=set4`,
          providers: [{ name: 'github', id: stringGithubId }],
          bio: bio || 'DevPulse architect. Merging ideas, compiling success.',
        })

        // Send welcome email
        try {
          await sendWelcomeEmail(email, username)
        } catch (e) {
          console.error('Welcome email dispatch error:', e)
        }
      }
    }

    // 5. Issue JWT and set cookie
    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    })

    await setAuthCookie(token)

    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('GitHub OAuth callback handler error:', error)
    return NextResponse.redirect(new URL('/signin?error=Internal server error during GitHub login', request.url))
  }
}

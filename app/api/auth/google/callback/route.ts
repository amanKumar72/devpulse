import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { signToken, setAuthCookie } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/mailer'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/signin?error=Google auth code missing', request.url))
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text()
      console.error('Google token exchange error status:', tokenRes.status, errorText)
      return NextResponse.redirect(new URL('/signin?error=Token exchange failed', request.url))
    }

    const tokenText = await tokenRes.text()
    let tokenData: any
    try {
      tokenData = JSON.parse(tokenText)
    } catch (err) {
      console.error('Failed to parse Google token response as JSON. Response text:', tokenText.slice(0, 1000))
      return NextResponse.redirect(new URL('/signin?error=Token exchange returned invalid format', request.url))
    }

    const { access_token } = tokenData

    if (!access_token) {
      console.error('Google token exchange did not return access_token. Response data:', tokenData)
      return NextResponse.redirect(new URL('/signin?error=Invalid Google token response', request.url))
    }

    // 2. Fetch user profile info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userRes.ok) {
      console.error('Google userinfo fetch failed')
      return NextResponse.redirect(new URL('/signin?error=Failed to retrieve profile info', request.url))
    }

    const profile = await userRes.json()
    const { email, name, picture, id: googleId } = profile

    if (!email) {
      return NextResponse.redirect(new URL('/signin?error=No email provided by Google', request.url))
    }

    await dbConnect()

    // 3. Find or create user
    let user = await User.findOne({
      providers: {
        $elemMatch: {
          name: 'google',
          id: googleId
        }
      }
    })

    if (!user) {
      // Check if email already registered (credentials or other provider)
      user = await User.findOne({ email })

      if (user) {
        // Link Google provider to existing account
        user.providers.push({ name: 'google', id: googleId })
        if (!user.avatar) user.avatar = picture
        await user.save()
      } else {
        // Create new account
        let username = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        const usernameExists = await User.findOne({ username })
        if (usernameExists) {
          username = `${username}${Math.floor(1000 + Math.random() * 9000)}`
        }

        user = await User.create({
          username,
          email,
          avatar: picture || `https://robohash.org/${username}.png?set=set4`,
          providers: [{ name: 'google', id: googleId }],
          bio: 'Front-end voyager. Stacking components and resolving merges.',
        })

        // Send welcome email asynchronously
        try {
          await sendWelcomeEmail(email, username)
        } catch (e) {
          console.error('Welcome email dispatch error:', e)
        }
      }
    }

    // 4. Issue JWT and set secure cookie
    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    })

    await setAuthCookie(token)

    // Redirect user to homepage
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Google OAuth callback handler error:', error)
    return NextResponse.redirect(new URL('/signin?error=Internal server error during Google login', request.url))
  }
}

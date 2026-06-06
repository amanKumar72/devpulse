import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID
  const callbackUrl = process.env.GITHUB_CALLBACK_URL

  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: 'GitHub OAuth configuration missing' }, { status: 500 })
  }

  const scope = 'read:user user:email'
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(scope)}`

  return NextResponse.redirect(githubAuthUrl)
}

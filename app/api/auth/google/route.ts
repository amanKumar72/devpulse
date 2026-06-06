import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL

  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: 'Google OAuth configuration missing' }, { status: 500 })
  }

  const scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    callbackUrl
  )}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`

  return NextResponse.redirect(googleAuthUrl)
}

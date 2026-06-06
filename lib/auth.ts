import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'devpulse_fallback_secret_key'

export interface SessionUser {
  userId: string
  username: string
  email: string
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser
    return {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    }
  } catch (error) {
    return null
  }
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    { userId: user.userId, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
}

'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { signToken, setAuthCookie, clearAuthCookie } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/mailer'

export async function signUpAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const bio = formData.get('bio') as string
  const avatar = formData.get('avatar') as string

  if (!username || !email || !password) {
    return { error: 'Username, Email, and Password are required.' }
  }

  try {
    await dbConnect()

    const cleanUsername = username.toLowerCase().trim()
    const cleanEmail = email.toLowerCase().trim()

    // Verify uniqueness
    const existingUsername = await User.findOne({ username: cleanUsername })
    if (existingUsername) {
      return { error: 'Username is already taken.' }
    }

    const existingEmail = await User.findOne({ email: cleanEmail })
    if (existingEmail) {
      return { error: 'Email is already registered.' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      avatar: avatar || `https://robohash.org/${cleanUsername}.png?set=set4`,
      bio: bio || 'Frontend voyager. Compiling ideas.',
      providers: [{ name: 'credentials', id: cleanUsername }],
    })

    // Send welcome email
    sendWelcomeEmail(user.email, user.username).catch((e) =>
      console.error('Welcome email dispatch failed:', e)
    )

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    })

    await setAuthCookie(token)

    return { success: true }
  } catch (error: any) {
    console.error('Sign-up action error:', error)
    return { error: error.message || 'Something went wrong.' }
  }
}

export async function signInAction(prevState: any, formData: FormData) {
  const loginInput = formData.get('loginInput') as string
  const password = formData.get('password') as string

  if (!loginInput || !password) {
    return { error: 'Username/Email and Password are required.' }
  }

  try {
    await dbConnect()

    const cleanInput = loginInput.toLowerCase().trim()
    const user = await User.findOne({
      $or: [{ username: cleanInput }, { email: cleanInput }],
    })

    if (!user || !user.password) {
      return { error: 'Invalid username/email or password.' }
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return { error: 'Invalid username/email or password.' }
    }

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    })

    await setAuthCookie(token)

    return { success: true }
  } catch (error: any) {
    console.error('Sign-in action error:', error)
    return { error: error.message || 'Something went wrong.' }
  }
}

export async function signOutAction() {
  await clearAuthCookie()
  revalidatePath('/')
}

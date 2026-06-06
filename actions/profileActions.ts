'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { getCurrentUser, signToken, setAuthCookie } from '@/lib/auth'

export async function updateProfileAction(prevState: any, formData: FormData) {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) {
    return { error: 'Unauthorized. Please sign in again.' }
  }

  const usernameInput = formData.get('username') as string
  const emailInput = formData.get('email') as string
  const bio = formData.get('bio') as string
  const avatar = formData.get('avatar') as string
  const oldPassword = formData.get('oldPassword') as string
  const newPassword = formData.get('newPassword') as string

  if (!usernameInput || !emailInput) {
    return { error: 'Username and Email are required.' }
  }

  try {
    await dbConnect()

    const cleanUsername = usernameInput.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '')
    const cleanEmail = emailInput.toLowerCase().trim()

    if (!cleanUsername) {
      return { error: 'Username must contain alphanumeric characters.' }
    }

    // Retrieve user document
    const user = await User.findById(sessionUser.userId)
    if (!user) {
      return { error: 'User not found.' }
    }

    // Check username uniqueness
    if (cleanUsername !== user.username) {
      const existingUsername = await User.findOne({ username: cleanUsername })
      if (existingUsername) {
        return { error: 'Username is already taken.' }
      }
    }

    // Check email uniqueness
    if (cleanEmail !== user.email) {
      const existingEmail = await User.findOne({ email: cleanEmail })
      if (existingEmail) {
        return { error: 'Email is already registered.' }
      }
    }

    // Password Update Logic
    if (newPassword && newPassword.trim().length > 0) {
      const hasExistingPassword = !!user.password

      if (hasExistingPassword) {
        if (!oldPassword) {
          return { error: 'Current password is required to set a new password.' }
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password)
        if (!isMatch) {
          return { error: 'Current password is incorrect.' }
        }
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      user.password = hashedPassword

      // Link credentials provider if not already present (for OAuth users setting password)
      const hasCredentialsProvider = user.providers.some((p: any) => p.name === 'credentials')
      if (!hasCredentialsProvider) {
        user.providers.push({ name: 'credentials', id: cleanUsername })
      }
    }

    // Update basic details
    user.username = cleanUsername
    user.email = cleanEmail
    user.bio = bio || ''
    if (avatar) {
      user.avatar = avatar
    }

    // Sync provider IDs if credentials identifier is username and username changed
    user.providers.forEach((prov: any) => {
      if (prov.name === 'credentials') {
        prov.id = cleanUsername
      }
    })

    await user.save()

    // Re-sign JWT if credentials (username or email) have changed
    const usernameChanged = cleanUsername !== sessionUser.username
    const emailChanged = cleanEmail !== sessionUser.email

    if (usernameChanged || emailChanged) {
      const token = signToken({
        userId: user._id.toString(),
        username: cleanUsername,
        email: cleanEmail,
      })
      await setAuthCookie(token)
    }

    revalidatePath('/')
    revalidatePath('/profile')

    return { success: true }
  } catch (error: any) {
    console.error('Profile update server action error:', error)
    return { error: error.message || 'Something went wrong while updating profile.' }
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import dbConnect from '@/lib/db'
import Bookmark from '@/lib/models/Bookmark'
import { getCurrentUser } from '@/lib/auth'

export async function addBookmark(articleId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'You must be signed in to bookmark articles.' }
    }

    await dbConnect()

    // Create a bookmark, ignore if it already exists due to compound unique index
    await Bookmark.findOneAndUpdate(
      { userId: user.userId, articleId },
      { userId: user.userId, articleId },
      { upsert: true, new: true }
    )

    revalidatePath('/bookmarks')
    revalidatePath('/')
    revalidatePath(`/articles/${articleId}`)
    revalidatePath(`/tags/[tag]`, 'layout')

    return { success: true }
  } catch (error: any) {
    console.error('addBookmark error:', error)
    return { error: error.message || 'Failed to save bookmark.' }
  }
}

export async function removeBookmark(articleId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'You must be signed in.' }
    }

    await dbConnect()
    await Bookmark.findOneAndDelete({ userId: user.userId, articleId })

    revalidatePath('/bookmarks')
    revalidatePath('/')
    revalidatePath(`/articles/${articleId}`)
    revalidatePath(`/tags/[tag]`, 'layout')

    return { success: true }
  } catch (error: any) {
    console.error('removeBookmark error:', error)
    return { error: error.message || 'Failed to remove bookmark.' }
  }
}

export async function updateBookmarkNote(bookmarkId: string, note: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'You must be signed in.' }
    }

    await dbConnect()
    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: bookmarkId, userId: user.userId },
      { note },
      { new: true }
    )

    if (!bookmark) {
      return { error: 'Bookmark not found or unauthorized.' }
    }

    revalidatePath('/bookmarks')
    return { success: true }
  } catch (error: any) {
    console.error('updateBookmarkNote error:', error)
    return { error: error.message || 'Failed to update note.' }
  }
}

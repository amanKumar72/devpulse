'use server'

import { revalidatePath } from 'next/cache'
import dbConnect from '@/lib/db'
import Article from '@/lib/models/Article'
import { getCurrentUser } from '@/lib/auth'

export async function upvoteArticle(articleId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'You must be signed in to upvote.' }
    }

    await dbConnect()
    const article = await Article.findByIdAndUpdate(
      articleId,
      { $inc: { upvotes: 1 } },
      { new: true }
    )

    revalidatePath('/')
    revalidatePath(`/articles/${articleId}`)
    revalidatePath(`/tags/[tag]`, 'layout')

    return { success: true, upvotes: article?.upvotes || 0 }
  } catch (error: any) {
    console.error('upvoteArticle error:', error)
    return { error: error.message || 'Failed to register upvote.' }
  }
}

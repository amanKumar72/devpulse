'use server'

import { revalidatePath } from 'next/cache'
import dbConnect from '@/lib/db'
import Comment from '@/lib/models/Comment'
import Article from '@/lib/models/Article'
import User from '@/lib/models/User'
import { getCurrentUser } from '@/lib/auth'
import { sendCommentAlert } from '@/lib/mailer'

export async function addComment(articleId: string, content: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'You must be signed in to comment.' }
    }

    const cleanContent = content?.trim()
    if (!cleanContent) {
      return { error: 'Comment content cannot be empty.' }
    }

    await dbConnect()

    // Create comment
    await Comment.create({
      articleId,
      userId: user.userId,
      content: cleanContent,
    })

    // Increment count on article
    const article = await Article.findByIdAndUpdate(
      articleId,
      { $inc: { commentsCount: 1 } },
      { new: true }
    )

    // Notify author via email if applicable
    if (article && article.userId) {
      const author = await User.findById(article.userId)
      if (author && author.email && author.email !== user.email) {
        sendCommentAlert(author.email, article.title, user.username, cleanContent)
          .catch((err) => console.error('Failed to send comment notification email:', err))
      }
    }

    revalidatePath(`/articles/${articleId}`)
    revalidatePath('/')
    revalidatePath(`/tags/[tag]`, 'layout')

    return { success: true }
  } catch (error: any) {
    console.error('addComment Action error:', error)
    return { error: error.message || 'Failed to submit comment.' }
  }
}

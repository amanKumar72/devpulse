import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Comment from '@/lib/models/Comment'
import Article from '@/lib/models/Article'
import User from '@/lib/models/User'
import { getCurrentUser } from '@/lib/auth'
import { sendCommentAlert } from '@/lib/mailer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params
    await dbConnect()

    const comments = await Comment.find({ articleId })
      .populate('userId', 'username avatar email')
      .sort({ createdAt: 1 })

    return NextResponse.json(comments)
  } catch (error: any) {
    console.error('GET /api/articles/[id]/comments error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 })
    }

    await dbConnect()

    // Create comment
    const comment = await Comment.create({
      articleId,
      userId: user.userId,
      content: content.trim(),
    })

    // Increment article's comment count
    const article = await Article.findByIdAndUpdate(
      articleId,
      { $inc: { commentsCount: 1 } },
      { new: true }
    )

    // Send email alert to the article creator if creator email exists
    if (article && article.userId) {
      const creator = await User.findById(article.userId)
      if (creator && creator.email && creator.email !== user.email) {
        sendCommentAlert(creator.email, article.title, user.username, content.trim())
          .catch((err) => console.error('Error sending comment alert email:', err))
      }
    }

    // Populate user info for returned comment
    await comment.populate('userId', 'username avatar email')

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/articles/[id]/comments error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

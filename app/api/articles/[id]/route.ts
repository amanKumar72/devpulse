import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Article from '@/lib/models/Article'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await dbConnect()
    const article = await Article.findById(id)
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    return NextResponse.json(article)
  } catch (error: any) {
    console.error('GET /api/articles/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    await dbConnect()

    const article = await Article.findById(id)
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Upvote action (any authenticated user can upvote)
    if (body.action === 'upvote') {
      article.upvotes = (article.upvotes || 0) + 1
      await article.save()
      return NextResponse.json(article)
    }

    // Edit action - check authorship
    if (article.userId && article.userId.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden: You are not the author' }, { status: 403 })
    }

    const { title, url, tag, description, coverImage } = body
    if (title) article.title = title
    if (url) article.url = url
    if (tag) article.tag = tag.toLowerCase()
    if (description !== undefined) article.description = description
    if (coverImage !== undefined) article.coverImage = coverImage

    await article.save()
    return NextResponse.json(article)
  } catch (error: any) {
    console.error('PUT /api/articles/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const article = await Article.findById(id)
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check authorship
    if (article.userId && article.userId.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden: You are not the author' }, { status: 403 })
    }

    await Article.findByIdAndDelete(id)
    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error: any) {
    console.error('DELETE /api/articles/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

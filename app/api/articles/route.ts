import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Article from '@/lib/models/Article'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    const filter = tag ? { tag: tag.toLowerCase() } : {}
    const articles = await Article.find(filter).sort({ publishedAt: -1 })

    return NextResponse.json(articles)
  } catch (error: any) {
    console.error('GET /api/articles error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, url, tag, description, coverImage } = body

    if (!title || !url || !tag) {
      return NextResponse.json({ error: 'Title, URL, and Tag are required' }, { status: 400 })
    }

    await dbConnect()
    const article = await Article.create({
      title,
      url,
      tag: tag.toLowerCase(),
      description,
      coverImage,
      author: user.username,
      userId: user.userId,
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/articles error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

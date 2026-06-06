import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Bookmark from '@/lib/models/Bookmark'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    // Find bookmarks for the current user and populate the referenced Article document
    const bookmarks = await Bookmark.find({ userId: user.userId })
      .populate('articleId')
      .sort({ createdAt: -1 })

    return NextResponse.json(bookmarks)
  } catch (error: any) {
    console.error('GET /api/bookmarks error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

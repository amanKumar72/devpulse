import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Article from '@/lib/models/Article'

export const dynamic = 'force-dynamic'

async function fetchHackerNews() {
  try {
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { cache: 'no-store' })
    if (!topStoriesRes.ok) throw new Error('HN top stories fetch failed')

    const storyIds = await topStoriesRes.json()
    const top10Ids = storyIds.slice(0, 10)

    const stories = []
    for (const id of top10Ids) {
      try {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { cache: 'no-store' })
        const story = await storyRes.json()
        if (story && story.url && story.title) {
          stories.push({
            title: story.title,
            url: story.url,
            tag: 'hackernews',
            description: `Hacker News top story by ${story.by}. Score: ${story.score || 0}.`,
            author: story.by || 'hn_user',
            upvotes: story.score || 0,
            commentsCount: (story.kids && story.kids.length) || 0,
            externalId: `hn-${story.id}`,
            publishedAt: new Date(story.time * 1000),
          })
        }
      } catch (itemErr) {
        console.error(`Error fetching HN item ${id}:`, itemErr)
      }
    }
    return stories
  } catch (error) {
    console.error('Error fetching HackerNews:', error)
    return []
  }
}

async function fetchDevTo() {
  try {
    const res = await fetch('https://dev.to/api/articles?per_page=15', {
      headers: {
        'User-Agent': 'DevPulse-Next-App',
      },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('Dev.to articles fetch failed')

    const devToArticles = await res.json()
    return devToArticles.map((art: any) => ({
      title: art.title,
      url: art.url,
      tag: (art.tag_list && art.tag_list[0]) || 'webdev',
      description: art.description || '',
      coverImage: art.cover_image || art.social_image || '',
      author: art.user?.username || 'devto_creator',
      upvotes: art.public_reactions_count || 0,
      commentsCount: art.comments_count || 0,
      externalId: `devto-${art.id}`,
      publishedAt: new Date(art.published_at || Date.now()),
    }))
  } catch (error) {
    console.error('Error fetching Dev.to:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  // CRON Protection check
  const authHeader = request.headers.get('Authorization')
  const { searchParams } = new URL(request.url)
  const secretParam = searchParams.get('secret')

  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret) {
    const isAuthorized =
      authHeader === `Bearer ${expectedSecret}` || secretParam === expectedSecret
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    await dbConnect()

    const hnStories = await fetchHackerNews()
    const devToArticles = await fetchDevTo()

    const allArticles = [...hnStories, ...devToArticles]
    let newInserted = 0
    let updatedCount = 0

    for (const item of allArticles) {
      try {
        const existing = await Article.findOne({ externalId: item.externalId })
        if (existing) {
          await Article.updateOne({ _id: existing._id }, { $set: item })
          updatedCount++
        } else {
          await Article.create(item)
          newInserted++
        }
      } catch (e) {
        console.error(`Error saving article ${item.title}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'News sync executed successfully.',
      inserted: newInserted,
      updated: updatedCount,
    })
  } catch (err: any) {
    console.error('Cron job news sync error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

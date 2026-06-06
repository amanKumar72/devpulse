import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import Article from '../lib/models/Article'

dotenv.config()

const MONGODB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/devpulse'

async function fetchHackerNews() {
  console.log('Fetching top stories from HackerNews...')
  try {
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
    if (!topStoriesRes.ok) throw new Error('HN top stories fetch failed')

    const storyIds = await topStoriesRes.json()
    const top10Ids = storyIds.slice(0, 10)

    const stories = []
    for (const id of top10Ids) {
      try {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
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
    console.log(`Fetched ${stories.length} stories from HackerNews.`)
    return stories
  } catch (error) {
    console.error('Error fetching HackerNews:', error)
    return []
  }
}

async function fetchDevTo() {
  console.log('Fetching trending stories from Dev.to...')
  try {
    const res = await fetch('https://dev.to/api/articles?per_page=15', {
      headers: {
        'User-Agent': 'DevPulse-Next-App',
      },
    })
    if (!res.ok) throw new Error('Dev.to articles fetch failed')

    const devToArticles = await res.json()
    const mapped = devToArticles.map((art: any) => ({
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
    console.log(`Fetched ${mapped.length} articles from Dev.to.`)
    return mapped
  } catch (error) {
    console.error('Error fetching Dev.to:', error)
    return []
  }
}

async function runSync() {
  console.log('--- STARTING NEWS SYNC ---')
  console.log('Connecting to database...')
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB.')

    const hnStories = await fetchHackerNews()
    const devToArticles = await fetchDevTo()

    const allArticles = [...hnStories, ...devToArticles]
    console.log(`Processing total of ${allArticles.length} articles...`)

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

    console.log(`Sync complete. Inserted: ${newInserted}, Updated: ${updatedCount}`)
  } catch (err) {
    console.error('Connection or general error during sync:', err)
  } finally {
    await mongoose.disconnect()
    console.log('--- SYNC TERMINATED ---')
    process.exit(0)
  }
}

runSync()

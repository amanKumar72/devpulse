import dbConnect from '@/lib/db'
import Article from '@/lib/models/Article'
import Bookmark from '@/lib/models/Bookmark'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import UpvoteButton from '@/components/UpvoteButton'
import BookmarkButton from '@/components/BookmarkButton'

export const dynamic = 'force-dynamic'

async function syncArticles() {
  try {
    const res = await fetch('https://dev.to/api/articles?per_page=30', {
      headers: {
        'User-Agent': 'DevPulse-Next-App',
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      console.error('Failed to fetch from dev.to', await res.text())
      return
    }

    const devToArticles = await res.json()
    const articlesToInsert = devToArticles.map((art: any) => ({
      title: art.title,
      url: art.url,
      tag: (art.tag_list && art.tag_list[0]) || 'webdev',
      description: art.description,
      coverImage: art.cover_image || art.social_image,
      author: art.user?.username || 'devto_creator',
      upvotes: art.public_reactions_count || Math.floor(Math.random() * 20),
      commentsCount: art.comments_count || 0,
      externalId: String(art.id),
      publishedAt: new Date(art.published_at || Date.now()),
    }))

    for (const item of articlesToInsert) {
      await Article.findOneAndUpdate(
        { externalId: item.externalId },
        { $setOnInsert: item },
        { upsert: true }
      )
    }
  } catch (error) {
    console.error('Error syncing articles from Dev.to:', error)
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>
}) {
  const queryParams = await searchParams
  const search = queryParams.search || ''
  const sort = queryParams.sort || 'trending'

  await dbConnect()

  // Auto-sync if database has few articles
  const count = await Article.countDocuments()
  if (count < 10) {
    await syncArticles()
  }

  // Filter query
  const query: any = {}
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tag: { $regex: search, $options: 'i' } },
    ]
  }

  // Sort option
  const sortOption: any = {}
  if (sort === 'latest') {
    sortOption.publishedAt = -1
  } else {
    sortOption.upvotes = -1
    sortOption.publishedAt = -1
  }

  const articles = await Article.find(query).sort(sortOption).limit(40)

  const user = await getCurrentUser()
  let bookmarkedArticleIds = new Set<string>()

  if (user) {
    const bookmarks = await Bookmark.find({ userId: user.userId })
    bookmarkedArticleIds = new Set(bookmarks.map((b) => b.articleId.toString()))
  }

  const popularTags = ['react', 'nodejs', 'css', 'javascript', 'nextjs', 'typescript', 'webdev', 'database']

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Monospace banner */}
      <div className="mb-10 border-4 border-foreground bg-primary p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-primary-foreground">
        <span className="font-mono text-xs font-black uppercase tracking-widest">[NODE: ONLINE] [SYS_LOAD: NORMAL]</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-black uppercase tracking-tight mt-2 mb-1">
          CURATED DEV INTELLIGENCE
        </h1>
        <p className="font-mono text-sm max-w-2xl">
          DevPulse aggregates global developer news, tutorials, and articles. Bookmark resources, log personal notes, and comment on trending stories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Filters Bar */}
          <div className="border-4 border-foreground bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold">
              <span className="text-muted-foreground">SORT:</span>
              <Link
                href={`/?sort=trending${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-muted ${
                  sort === 'trending' ? 'bg-secondary text-secondary-foreground font-black' : 'bg-background'
                }`}
              >
                TRENDING
              </Link>
              <Link
                href={`/?sort=latest${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-muted ${
                  sort === 'latest' ? 'bg-secondary text-secondary-foreground font-black' : 'bg-background'
                }`}
              >
                LATEST
              </Link>
            </div>

            {/* Search Input */}
            <form method="GET" className="flex items-center gap-2 w-full sm:w-auto">
              <input type="hidden" name="sort" value={sort} />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search logs..."
                className="border-2 border-foreground bg-background px-3 py-1.5 font-mono text-xs w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="cursor-pointer border-2 border-foreground bg-foreground text-background px-4 py-1.5 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-foreground/95"
              >
                RUN
              </button>
            </form>
          </div>

          {/* Articles Feed */}
          {articles.length === 0 ? (
            <div className="border-4 border-foreground bg-card p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono">
              <p className="text-destructive font-bold mb-2">[WARNING] NO RECORDS RETURNED</p>
              <p className="text-xs text-muted-foreground">Adjust your search parameters or query another database index.</p>
            </div>
          ) : (
            articles.map((article) => {
              const isBookmarked = bookmarkedArticleIds.has(article._id.toString())
              return (
                <article
                  key={article._id.toString()}
                  className="group relative border-4 border-foreground bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_#10b981] transition-all flex flex-col sm:flex-row"
                >
                  {/* Article Thumbnail */}
                  {article.coverImage && (
                    <div className="w-full sm:w-48 h-32 sm:h-auto relative border-b-4 sm:border-b-0 sm:border-r-4 border-foreground overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Article Text Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Tag pill */}
                      <Link
                        href={`/tags/${article.tag}`}
                        className="inline-block border-2 border-foreground bg-secondary px-2 py-0.5 font-mono text-[10px] font-black text-secondary-foreground uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] mb-3 hover:bg-secondary/80"
                      >
                        #{article.tag}
                      </Link>

                      {/* Title */}
                      <h3 className="font-mono text-lg font-black leading-tight text-foreground hover:text-primary mb-2">
                        <Link href={`/articles/${article._id.toString()}`}>
                          {article.title}
                        </Link>
                      </h3>

                      {/* Description snippet */}
                      <p className="font-mono text-xs text-muted-foreground line-clamp-2 mb-4 pr-4">
                        {article.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Metadata & Actions Footer */}
                    <div className="flex items-center justify-between gap-4 mt-auto pt-3 border-t-2 border-border">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        BY @{article.author} • {new Date(article.publishedAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Upvote */}
                        <UpvoteButton
                          articleId={article._id.toString()}
                          upvotes={article.upvotes || 0}
                          isAuthenticated={!!user}
                        />

                        {/* Comment Count Link */}
                        <Link
                          href={`/articles/${article._id.toString()}#comments`}
                          className="border-2 border-foreground bg-background px-2 py-1 text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1 hover:bg-muted"
                        >
                          💬 <span className="font-mono text-xs">{article.commentsCount || 0}</span>
                        </Link>

                        {/* Bookmark */}
                        <BookmarkButton
                          articleId={article._id.toString()}
                          isBookmarked={isBookmarked}
                          isAuthenticated={!!user}
                        />

                        {/* External Link */}
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-2 border-foreground bg-background p-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          title="Open original website"
                        >
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Submit Button card */}
          <div className="border-4 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-mono text-lg font-black uppercase mb-2">&gt; SUBMIT_LOG.SH</h3>
            <p className="font-mono text-xs text-muted-foreground mb-4">
              Found a cool dev-related link? Publish it to the trending directory index.
            </p>
            <Link
              href="/submit"
              className="block text-center border-2 border-foreground bg-primary py-2.5 font-mono text-sm font-black text-primary-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              CREATE_LOG
            </Link>
          </div>

          {/* Popular Tags card */}
          <div className="border-4 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-mono text-lg font-black uppercase mb-3">&gt; POPULAR_TAGS</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((t) => (
                <Link
                  key={t}
                  href={`/tags/${t}`}
                  className="border-2 border-foreground bg-background px-3 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-secondary transition-all"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>

          {/* User Guide Card */}
          <div className="border-4 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs">
            <h3 className="text-sm font-black uppercase mb-3 text-primary">&gt; SYSTEMINFO</h3>
            <ul className="list-inside list-decimal flex flex-col gap-2 leading-relaxed">
              <li>Sign in using Google, GitHub, or traditional credentials.</li>
              <li>Bookmark articles and add private notes.</li>
              <li>Engage by leaving comments.</li>
              <li>Upload custom avatar images.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

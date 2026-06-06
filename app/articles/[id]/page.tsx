import { notFound } from 'next/navigation'
import Link from 'next/link'
import dbConnect from '@/lib/db'
import Article from '@/lib/models/Article'
import Comment from '@/lib/models/Comment'
import { getCurrentUser } from '@/lib/auth'
import BookmarkOverlay from '@/components/BookmarkOverlay'
import UpvoteButton from '@/components/UpvoteButton'
import CommentForm from '@/components/CommentForm'

export const revalidate = 60 // ISR: revalidate every 60 seconds

export async function generateStaticParams() {
  try {
    await dbConnect()
    const articles = await Article.find().sort({ upvotes: -1 }).limit(10)
    return articles.map((article) => ({
      id: article._id.toString(),
    }))
  } catch (e) {
    console.error('Error generating static params:', e)
    return []
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await dbConnect()
  const article = await Article.findById(id)

  if (!article) {
    notFound()
  }

  // Fetch comments and populate user details
  const comments = await Comment.find({ articleId: id })
    .populate('userId', 'username avatar bio')
    .sort({ createdAt: 1 })

  // Check user session
  const user = await getCurrentUser()

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Back link */}
      <Link
        href="/"
        className="inline-block font-mono text-xs font-bold uppercase tracking-wider mb-6 hover:text-primary transition-colors"
      >
        &lt;~/back_to_feed
      </Link>

      {/* Main Article Container */}
      <div className="border-4 border-foreground bg-card p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#10b981] mb-8 flex flex-col gap-6">
        <div>
          {/* Tag and published date */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <Link
              href={`/tags/${article.tag}`}
              className="border-2 border-foreground bg-secondary px-2.5 py-0.5 font-mono text-xs font-black text-secondary-foreground uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-secondary/80"
            >
              #{article.tag}
            </Link>
            <span className="font-mono text-xs text-muted-foreground">
              PUBLISHED {new Date(article.publishedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-mono text-2xl sm:text-3xl font-black leading-tight text-foreground">
            {article.title}
          </h1>

          {/* Author */}
          <p className="font-mono text-xs text-muted-foreground mt-2 uppercase tracking-wide">
            Posted by <span className="font-bold text-foreground">@{article.author}</span>
          </p>
        </div>

        {/* Article Cover Image */}
        {article.coverImage && (
          <div className="border-4 border-foreground bg-muted h-64 sm:h-96 relative overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <img
              src={article.coverImage}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Description / Content Body */}
        <div className="font-mono text-sm leading-relaxed border-t-2 border-border pt-6">
          <p className="whitespace-pre-line mb-6">
            {article.description || 'No supplementary description provided for this link.'}
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-primary px-5 py-2.5 font-mono text-sm font-black text-primary-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            READ ORIGINAL SOURCE
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Score metrics */}
        <div className="flex items-center gap-4 border-t-2 border-border pt-6 mt-2">
          <span className="font-mono text-xs font-bold uppercase text-muted-foreground">METRICS:</span>
          <UpvoteButton
            articleId={article._id.toString()}
            upvotes={article.upvotes || 0}
            isAuthenticated={!!user}
          />
          <span className="font-mono text-xs font-bold border-2 border-foreground bg-background px-3 py-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            💬 {comments.length} Comments
          </span>
        </div>
      </div>

      {/* Bookmarks, note-taking & profile overlay */}
      <div className="mb-8">
        <BookmarkOverlay articleId={article._id.toString()} isAuthenticated={!!user} />
      </div>

      {/* Comments Section */}
      <div id="comments" className="flex flex-col gap-6 mt-10">
        <h2 className="font-mono text-xl font-black uppercase tracking-tight text-foreground">
          &gt; DISCUSSIONS_THREAD
        </h2>

        {/* Comment Input */}
        <CommentForm articleId={article._id.toString()} isAuthenticated={!!user} />

        {/* Comments Feed */}
        <div className="flex flex-col gap-4">
          {comments.length === 0 ? (
            <div className="border-4 border-foreground bg-card p-6 text-center font-mono text-xs text-muted-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              No comments posted yet. Start the conversation using the terminal above.
            </div>
          ) : (
            comments.map((comment: any) => {
              const commentAuthor = comment.userId || { username: 'deleted_user', avatar: 'https://robohash.org/deleted.png', bio: '' }
              return (
                <div
                  key={comment._id.toString()}
                  className="border-4 border-foreground bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-4"
                >
                  <img
                    src={commentAuthor.avatar || `https://robohash.org/${commentAuthor.username}.png?set=set4`}
                    alt={commentAuthor.username}
                    className="h-10 w-10 border-2 border-foreground bg-muted object-cover flex-shrink-0"
                  />
                  <div className="flex-1 font-mono">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-border pb-1 mb-2">
                      <span className="text-xs font-black">@{commentAuthor.username}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

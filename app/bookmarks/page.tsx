import dbConnect from '@/lib/db'
import Bookmark from '@/lib/models/Bookmark'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BookmarkListItem from '@/components/BookmarkListItem'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/signin?callbackUrl=/bookmarks')
  }

  await dbConnect()
  // Retrieve user bookmarks, populating the referenced Article documents
  const bookmarks = await Bookmark.find({ userId: user.userId })
    .populate('articleId')
    .sort({ createdAt: -1 })

  // Safely filter out any orphaned bookmarks whose corresponding articles no longer exist
  const validBookmarks = bookmarks.filter((b) => b.articleId !== null)

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header Banner */}
      <div className="border-4 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#10b981] mb-10 font-mono">
        <span className="text-xs font-black uppercase text-primary">[READING_LIST_INDEX]</span>
        <h1 className="text-3xl font-black uppercase tracking-tight mt-1 mb-2">
          MY BOOKMARKS
        </h1>
        <p className="text-xs text-muted-foreground">
          Logged in as <span className="font-bold text-foreground">@{user.username}</span> ({user.email}). Keep track of your saved resources and personal notes below.
        </p>
      </div>

      {/* Bookmarks Grid / List */}
      <div className="grid grid-cols-1 gap-6">
        {validBookmarks.length === 0 ? (
          <div className="border-4 border-foreground bg-card p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono">
            <p className="text-destructive font-bold mb-2">[NOTICE] NO SAVED BOOKMARKS</p>
            <p className="text-xs text-muted-foreground mb-4">
              Your reading list is currently empty. Visit the homepage to browse trending developer articles and save them.
            </p>
            <a
              href="/"
              className="inline-block border-2 border-foreground bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
            >
              BROWSE_TRENDING
            </a>
          </div>
        ) : (
          validBookmarks.map((bookmark: any) => {
            const article = bookmark.articleId
            return (
              <BookmarkListItem
                key={bookmark._id.toString()}
                bookmarkId={bookmark._id.toString()}
                articleId={article._id.toString()}
                title={article.title}
                url={article.url}
                tag={article.tag}
                author={article.author}
                coverImage={article.coverImage}
                initialNote={bookmark.note}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

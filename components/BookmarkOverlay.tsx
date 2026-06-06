'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { addBookmark, removeBookmark, updateBookmarkNote } from '@/actions/bookmarkActions'

interface BookmarkOverlayProps {
  articleId: string
  isAuthenticated: boolean
}

export default function BookmarkOverlay({ articleId, isAuthenticated }: BookmarkOverlayProps) {
  const pathname = usePathname()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkId, setBookmarkId] = useState('')
  const [note, setNote] = useState('')
  const [isSaved, setIsSaved] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isAuthenticated) return

    async function checkBookmark() {
      try {
        const res = await fetch('/api/bookmarks')
        if (res.ok) {
          const bookmarks = await res.json()
          const found = bookmarks.find(
            (b: any) =>
              b.articleId?._id === articleId ||
              b.articleId === articleId ||
              (typeof b.articleId === 'object' && b.articleId._id === articleId)
          )
          if (found) {
            setIsBookmarked(true)
            setBookmarkId(found._id)
            setNote(found.note || '')
          }
        }
      } catch (err) {
        console.error('Error fetching bookmark status:', err)
      }
    }
    checkBookmark()
  }, [articleId, isAuthenticated])

  const handleToggle = () => {
    if (!isAuthenticated) {
      window.location.href = `/signin?callbackUrl=${encodeURIComponent(pathname)}`
      return
    }

    startTransition(async () => {
      if (isBookmarked) {
        const res = await removeBookmark(articleId)
        if (res.success) {
          setIsBookmarked(false)
          setBookmarkId('')
          setNote('')
        }
      } else {
        const res = await addBookmark(articleId)
        if (res.success) {
          setIsBookmarked(true)
          const bRes = await fetch('/api/bookmarks')
          if (bRes.ok) {
            const bookmarks = await bRes.json()
            const found = bookmarks.find(
              (b: any) =>
                b.articleId?._id === articleId ||
                b.articleId === articleId ||
                (typeof b.articleId === 'object' && b.articleId._id === articleId)
            )
            if (found) {
              setBookmarkId(found._id)
            }
          }
        }
      }
    })
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value)
    setIsSaved(false)
  }

  const saveNote = async () => {
    if (!bookmarkId) return
    startTransition(async () => {
      const res = await updateBookmarkNote(bookmarkId, note)
      if (res.success) {
        setIsSaved(true)
      } else {
        alert(res.error || 'Failed to update note.')
      }
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="border-2 border-dashed border-foreground p-4 bg-muted font-mono text-xs text-center">
        <p className="mb-2">Want to save bookmarks and take personal notes?</p>
        <a
          href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`}
          className="underline font-bold text-primary hover:text-primary/90"
        >
          Sign in to your developer profile
        </a>
      </div>
    )
  }

  return (
    <div className="border-4 border-foreground bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 font-mono">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider">&gt; BOOKMARK_UTILITY.LOG</span>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`cursor-pointer border-2 border-foreground px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${
            isBookmarked ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
          }`}
        >
          {isBookmarked ? '✓ BOOKMARKED' : 'ADD_BOOKMARK'}
        </button>
      </div>

      {isBookmarked && (
        <div className="flex flex-col gap-2 mt-2 border-t-2 border-border pt-4">
          <label className="text-xs font-black uppercase">Personal Notes:</label>
          <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder="Log key insights or code snippets from this article..."
            rows={3}
            className="border-2 border-foreground bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full resize-none font-mono"
          />
          <button
            onClick={saveNote}
            disabled={isSaved || isPending}
            className={`cursor-pointer border-2 border-foreground px-4 py-1.5 self-end text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
              isSaved
                ? 'bg-muted text-muted-foreground opacity-70 cursor-not-allowed'
                : 'bg-[#10b981] text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            {isPending ? 'SAVING...' : isSaved ? 'NOTES_SAVED' : 'SAVE_NOTE'}
          </button>
        </div>
      )}
    </div>
  )
}

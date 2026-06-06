'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { removeBookmark, updateBookmarkNote } from '@/actions/bookmarkActions'

interface BookmarkListItemProps {
  bookmarkId: string
  articleId: string
  title: string
  url: string
  tag: string
  author: string
  coverImage?: string
  initialNote: string
}

export default function BookmarkListItem({
  bookmarkId,
  articleId,
  title,
  url,
  tag,
  author,
  coverImage,
  initialNote,
}: BookmarkListItemProps) {
  const [note, setNote] = useState(initialNote)
  const [isSaved, setIsSaved] = useState(true)
  const [isPending, startTransition] = useTransition()

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value)
    setIsSaved(false)
  }

  const handleSaveNote = () => {
    startTransition(async () => {
      const res = await updateBookmarkNote(bookmarkId, note)
      if (res.success) {
        setIsSaved(true)
      } else {
        alert(res.error || 'Failed to update note.')
      }
    })
  }

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove this bookmark?')) {
      startTransition(async () => {
        const res = await removeBookmark(articleId)
        if (res.error) {
          alert(res.error)
        }
      })
    }
  }

  return (
    <div className="border-4 border-foreground bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
      {/* Article cover */}
      {coverImage && (
        <div className="w-full md:w-48 h-32 md:h-auto border-b-4 md:border-b-0 md:border-r-4 border-foreground relative overflow-hidden bg-muted flex-shrink-0">
          <img src={coverImage} alt={title} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Main content */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 font-mono">
        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <Link
              href={`/tags/${tag}`}
              className="border-2 border-foreground bg-secondary px-2 py-0.5 text-[10px] font-black uppercase text-secondary-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              #{tag}
            </Link>
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="cursor-pointer border-2 border-foreground bg-destructive text-destructive-foreground px-2 py-0.5 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-destructive/90"
            >
              REMOVE
            </button>
          </div>

          <h3 className="text-base font-black leading-tight hover:text-primary mb-1">
            <Link href={`/articles/${articleId}`}>{title}</Link>
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase mb-3">By @{author}</p>

          {/* Notes area */}
          <div className="bg-background border-2 border-foreground p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <label className="block text-[10px] font-black uppercase mb-1">PERSONAL_NOTES.LOG:</label>
            <textarea
              value={note}
              onChange={handleNoteChange}
              placeholder="Save instructions, insights, or custom tags for this article..."
              rows={2}
              className="w-full border-0 bg-transparent p-0 text-xs focus:ring-0 focus:outline-none font-mono resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveNote}
                disabled={isSaved || isPending}
                className={`cursor-pointer border-2 border-foreground px-3 py-1 text-[10px] font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all ${
                  isSaved
                    ? 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed'
                    : 'bg-[#10b981] text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5'
                }`}
              >
                {isPending ? 'SAVING...' : isSaved ? 'NOTES_UP_TO_DATE' : 'SAVE_NOTE_CHANGES'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

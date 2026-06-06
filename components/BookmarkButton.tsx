'use client'

import { useTransition } from 'react'
import { addBookmark, removeBookmark } from '@/actions/bookmarkActions'

interface BookmarkButtonProps {
  articleId: string
  isBookmarked: boolean
  isAuthenticated: boolean
}

export default function BookmarkButton({ articleId, isBookmarked, isAuthenticated }: BookmarkButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }

    startTransition(async () => {
      try {
        if (isBookmarked) {
          await removeBookmark(articleId)
        } else {
          await addBookmark(articleId)
        }
      } catch (err) {
        console.error('Error toggling bookmark:', err)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`cursor-pointer border-2 border-foreground p-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 ${
        isBookmarked ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
      }`}
      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
    >
      <svg
        className="h-4.5 w-4.5"
        fill={isBookmarked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  )
}

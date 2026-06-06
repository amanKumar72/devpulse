'use client'

import { useTransition } from 'react'
import { upvoteArticle } from '@/actions/articleActions'

interface UpvoteButtonProps {
  articleId: string
  upvotes: number
  isAuthenticated: boolean
}

export default function UpvoteButton({ articleId, upvotes, isAuthenticated }: UpvoteButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }

    startTransition(async () => {
      try {
        const res = await upvoteArticle(articleId)
        if (res?.error) {
          alert(res.error)
        }
      } catch (err) {
        console.error('Error upvoting:', err)
      }
    })
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={isPending}
      className="cursor-pointer flex items-center gap-1.5 border-2 border-foreground bg-[#10b981] text-primary-foreground px-2 py-1 text-xs font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
    >
      ▲ <span className="font-mono">{upvotes}</span>
    </button>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { addComment } from '@/actions/commentActions'

interface CommentFormProps {
  articleId: string
  isAuthenticated: boolean
}

export default function CommentForm({ articleId, isAuthenticated }: CommentFormProps) {
  const pathname = usePathname()
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setError('')
    startTransition(async () => {
      const res = await addComment(articleId, content)
      if (res?.error) {
        setError(res.error)
      } else {
        setContent('')
      }
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="border-2 border-dashed border-foreground bg-muted p-6 text-center font-mono text-xs">
        <p className="mb-2">You must be authenticated to comment on this article.</p>
        <a
          href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`}
          className="underline font-bold text-primary hover:text-primary/90"
        >
          Access Node Login
        </a>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-4 border-foreground bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 font-mono"
    >
      <span className="text-xs font-black uppercase tracking-wider">&gt; POST_COMMENT.LOG</span>

      {error && (
        <div className="border-2 border-destructive bg-destructive/10 p-2 text-xs font-bold text-destructive">
          [ERROR] {error}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts, raise issues, or add supplementary code resources..."
        required
        rows={3}
        className="border-2 border-foreground bg-background p-3 text-xs w-full focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
      />

      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="cursor-pointer border-2 border-foreground bg-primary py-2 px-4 self-end text-xs font-black text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
      >
        {isPending ? 'TRANSMITTING...' : 'RUN_POST'}
      </button>
    </form>
  )
}

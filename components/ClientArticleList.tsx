'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import UpvoteButton from './UpvoteButton'
import BookmarkButton from './BookmarkButton'

interface ArticleType {
  _id: string
  title: string
  url: string
  tag: string
  description?: string
  coverImage?: string
  author: string
  upvotes: number
  commentsCount: number
  publishedAt: string
}

interface ClientArticleListProps {
  initialArticles: ArticleType[]
}

export default function ClientArticleList({ initialArticles }: ClientArticleListProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadUserSession() {
      try {
        const res = await fetch('/api/bookmarks')
        if (res.ok) {
          const bookmarks = await res.json()
          setIsAuthenticated(true)
          const ids = new Set<string>(
            bookmarks.map((b: any) => {
              const artId = b.articleId?._id || b.articleId
              return typeof artId === 'object' ? artId._id : artId
            })
          )
          setBookmarkedIds(ids)
        }
      } catch (e) {
        // Not authenticated
      }
    }
    loadUserSession()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {initialArticles.map((article) => {
        const isBookmarked = bookmarkedIds.has(article._id)
        return (
          <article
            key={article._id}
            className="group relative border-4 border-foreground bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_#10b981] transition-all flex flex-col sm:flex-row"
          >
            {article.coverImage && (
              <div className="w-full sm:w-44 h-32 sm:h-auto relative border-b-4 sm:border-b-0 sm:border-r-4 border-foreground overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-mono text-lg font-black leading-tight text-foreground hover:text-primary mb-2">
                  <Link href={`/articles/${article._id}`}>
                    {article.title}
                  </Link>
                </h3>
                <p className="font-mono text-xs text-muted-foreground line-clamp-2 mb-4">
                  {article.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 border-t-2 border-border mt-auto font-mono">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  BY @{article.author} • {new Date(article.publishedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <UpvoteButton
                    articleId={article._id}
                    upvotes={article.upvotes || 0}
                    isAuthenticated={isAuthenticated}
                  />
                  <Link
                    href={`/articles/${article._id}#comments`}
                    className="border-2 border-foreground bg-background px-2 py-1 text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-muted"
                  >
                    💬 <span className="font-mono text-xs">{article.commentsCount || 0}</span>
                  </Link>
                  <BookmarkButton
                    articleId={article._id}
                    isBookmarked={isBookmarked}
                    isAuthenticated={isAuthenticated}
                  />
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-foreground bg-background p-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
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
      })}
    </div>
  )
}

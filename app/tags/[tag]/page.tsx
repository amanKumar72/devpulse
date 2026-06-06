import dbConnect from '@/lib/db'
import Article from '@/lib/models/Article'
import Link from 'next/link'
import ClientArticleList from '@/components/ClientArticleList'

export const dynamicParams = true

export async function generateStaticParams() {
  return [
    { tag: 'react' },
    { tag: 'nodejs' },
    { tag: 'css' },
    { tag: 'javascript' },
    { tag: 'nextjs' },
  ]
}

export default async function Page({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag).toLowerCase()

  await dbConnect()
  const articles = await Article.find({ tag: decodedTag }).sort({ upvotes: -1, publishedAt: -1 })

  // Convert Mongoose documents to plain objects for client component props
  const plainArticles = articles.map((article) => ({
    _id: article._id.toString(),
    title: article.title,
    url: article.url,
    tag: article.tag,
    description: article.description || '',
    coverImage: article.coverImage || '',
    author: article.author || 'Anonymous',
    upvotes: article.upvotes || 0,
    commentsCount: article.commentsCount || 0,
    publishedAt: article.publishedAt.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Navigation breadcrumb */}
      <div className="mb-8 font-mono text-xs flex gap-2">
        <Link href="/" className="hover:underline">~/trending</Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-bold text-primary">tags/{decodedTag}</span>
      </div>

      {/* Header Banner */}
      <div className="border-4 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_#10b981] mb-10 font-mono">
        <span className="text-xs font-black uppercase text-primary">[TAG_DIRECTORY_INDEX]</span>
        <h1 className="text-3xl font-black uppercase tracking-tight mt-1 mb-2">
          #{decodedTag} ARTICLES
        </h1>
        <p className="text-xs text-muted-foreground">
          Showing all compiled logs tagged under index key. Total items returned: {articles.length}.
        </p>
      </div>

      {/* Feed */}
      <div>
        {plainArticles.length === 0 ? (
          <div className="border-4 border-foreground bg-card p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono">
            <p className="text-destructive font-bold mb-2">[WARNING] NO TAGGED ARTICLES FOUND</p>
            <p className="text-xs text-muted-foreground mb-4">
              No developer articles have been tagged with #{decodedTag} yet. Submit the first link now!
            </p>
            <Link
              href="/submit"
              className="mt-4 inline-block border-2 border-foreground bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
            >
              SUBMIT_LOG
            </Link>
          </div>
        ) : (
          <ClientArticleList initialArticles={plainArticles} />
        )}
      </div>
    </div>
  )
}

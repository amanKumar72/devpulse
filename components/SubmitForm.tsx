'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmitForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState('react')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setCoverImage(data.secure_url)
    } catch (err) {
      console.error('Error uploading cover image:', err)
      alert('Cover image upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url || !tag) {
      setError('Title, URL, and Tag are required.')
      return
    }

    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            url,
            tag,
            description,
            coverImage,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to submit article.')
        } else {
          router.push('/')
          router.refresh()
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong.')
      }
    })
  }

  const tagOptions = ['react', 'nodejs', 'css', 'javascript', 'nextjs', 'typescript', 'webdev', 'database']

  return (
    <div className="w-full border-4 border-foreground bg-card p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#10b981]">
      <h2 className="font-mono text-2xl font-black uppercase tracking-tight text-foreground mb-6">
        &gt; SUBMIT_NEW_ARTICLE.SH
      </h2>

      {error && (
        <div className="mb-6 border-2 border-destructive bg-destructive/10 p-3 font-mono text-xs font-bold text-destructive">
          [ERROR] {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-mono">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide">Article Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master CSS Grid Layouts in 10 Minutes"
            className="border-2 border-foreground bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </div>

        {/* URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide">Article URL</label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/blog/css-grid"
            className="border-2 border-foreground bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </div>

        {/* Tag selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide">Primary Tag</label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="border-2 border-foreground bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-mono uppercase"
          >
            {tagOptions.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide">Description / Notes</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why is this article useful? What are the key takeaways?"
            className="border-2 border-foreground bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 resize-none"
          />
        </div>

        {/* Cover Image Upload (Cloudinary) */}
        <div className="flex flex-col gap-1.5 mb-2">
          <label className="text-xs font-bold uppercase tracking-wide">Optional Cover Image</label>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-32 border-2 border-foreground bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-[10px] text-muted-foreground overflow-hidden">
              {coverImage ? (
                <img src={coverImage} alt="Cover preview" className="h-full w-full object-cover" />
              ) : isUploading ? (
                <span className="animate-pulse">LOAD...</span>
              ) : (
                <span>NO_IMAGE</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-foreground bg-secondary px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0"
              >
                {isUploading ? 'UPLOADING...' : 'CHOOSE_COVER'}
              </button>
              <p className="text-[10px] text-muted-foreground mt-1">Uploaded directly to Cloudinary CDN</p>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="cursor-pointer border-2 border-foreground bg-primary py-3 font-mono text-sm font-black text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
        >
          {isPending ? 'COMPILING_SUBMISSION...' : 'RUN_SUBMIT'}
        </button>
      </form>
    </div>
  )
}

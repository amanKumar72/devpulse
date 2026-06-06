'use client'

import { useActionState, useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signUpAction } from '@/actions/authActions'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [state, formAction, isPending] = useActionState(signUpAction, null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success) {
      router.push(callbackUrl)
      router.refresh()
    }
  }, [state, router, callbackUrl])

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
      setAvatarUrl(data.secure_url)
    } catch (err) {
      console.error('Error uploading avatar:', err)
      alert('Avatar upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-md border-4 border-foreground bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#10b981]">
      <h2 className="font-mono text-2xl font-black uppercase tracking-tight text-foreground">
        &gt; AUTH_REGISTER.EXE
      </h2>
      <p className="font-mono text-xs text-muted-foreground mb-6 uppercase tracking-wider">
        Register a new developer node profile
      </p>

      {/* Error Messages */}
      {(state?.error || errorParam) && (
        <div className="mb-4 border-2 border-destructive bg-destructive/10 p-3 font-mono text-xs font-bold text-destructive">
          [ERROR] {state?.error || errorParam}
        </div>
      )}

      {/* Sign Up Form */}
      <form action={formAction} className="flex flex-col gap-4">
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold uppercase tracking-wide">
            Username
          </label>
          <input
            name="username"
            type="text"
            required
            placeholder="e.g. hackerman"
            className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold uppercase tracking-wide">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="e.g. user@net.org"
            className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold uppercase tracking-wide">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold uppercase tracking-wide">
            Short Bio
          </label>
          <textarea
            name="bio"
            rows={2}
            placeholder="Stacking components and resolving merge conflicts..."
            className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 resize-none"
          />
        </div>

        {/* Avatar Upload (Cloudinary) */}
        <div className="flex flex-col gap-1.5 mb-2">
          <label className="font-mono text-xs font-bold uppercase tracking-wide">
            Avatar Image
          </label>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 border-2 border-foreground bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-mono text-[9px] text-muted-foreground overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : isUploading ? (
                <span className="animate-pulse">LOAD...</span>
              ) : (
                <span>NO_IMG</span>
              )}
            </div>
            <div className="flex-1">
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
                className="cursor-pointer border-2 border-foreground bg-secondary px-3 py-1.5 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                {isUploading ? 'UPLOADING...' : 'CHOOSE_FILE'}
              </button>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                Uploads directly to Cloudinary
              </p>
            </div>
          </div>
          <input type="hidden" name="avatar" value={avatarUrl} />
        </div>

        <button
          type="submit"
          disabled={isPending || isUploading}
          className="cursor-pointer border-2 border-foreground bg-primary py-2.5 font-mono text-sm font-black text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
        >
          {isPending ? 'CREATING NODE...' : 'RUN_REGISTER'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center justify-center gap-3">
        <span className="h-[2px] flex-1 bg-border" />
        <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">OR</span>
        <span className="h-[2px] flex-1 bg-border" />
      </div>

      {/* OAuth Buttons */}
      <div className="flex flex-col gap-3">
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 border-2 border-foreground bg-background py-2 font-mono text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#ea4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.92-2.75 3.5-4.51 6.76-4.51z"
            />
            <path
              fill="#4285f4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.75-4.87 3.75-8.49z"
            />
            <path
              fill="#fbbc05"
              d="M5.24 10.55c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.39 2.96C.5 4.77 0 6.82 0 9s.5 4.23 1.39 6.04l3.85-2.99c-.24-.72-.38-1.5-.38-2.3z"
            />
            <path
              fill="#34a853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.5 1.18-4.3 1.18-3.26 0-5.84-1.76-6.76-4.51L1.39 16.9C3.37 20.33 7.35 23 12 23z"
            />
          </svg>
          Google Cloud Auth
        </a>

        <a
          href="/api/auth/github"
          className="flex items-center justify-center gap-3 border-2 border-foreground bg-[#24292e] py-2 font-mono text-sm font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub Secure Signin
        </a>
      </div>

      {/* Footer Link */}
      <div className="mt-6 text-center">
        <p className="font-mono text-xs">
          Already registered?{' '}
          <Link href="/signin" className="font-bold text-primary underline">
            Run Signin.sh
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-background">
      <Suspense fallback={
        <div className="font-mono text-sm border-2 border-foreground p-4 bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          LOADING_REGISTRATION_MOD.LOG...
        </div>
      }>
        <SignUpForm />
      </Suspense>
    </div>
  )
}

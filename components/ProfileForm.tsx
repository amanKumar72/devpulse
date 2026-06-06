'use client'

import { useActionState, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileAction } from '@/actions/profileActions'

interface ProfileFormProps {
  user: {
    username: string
    email: string
    bio: string
    avatar: string
    hasPassword: boolean
    providers: string[]
  }
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(updateProfileAction, null)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '')
  const [isUploading, setIsUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success) {
      setSuccessMsg('Profile updated successfully!')
      router.refresh()
      // Clear success message after 5 seconds
      const timer = setTimeout(() => setSuccessMsg(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [state, router])

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
    <div className="w-full max-w-2xl border-4 border-foreground bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#10b981] mx-auto my-12">
      <h2 className="font-mono text-2xl font-black uppercase tracking-tight text-foreground">
        &gt; PROFILE_SETTINGS.EXE
      </h2>
      <p className="font-mono text-xs text-muted-foreground mb-6 uppercase tracking-wider">
        Modify your developer node coordinates and access credentials
      </p>

      {/* Success Notification */}
      {successMsg && (
        <div className="mb-4 border-2 border-primary bg-primary/10 p-3 font-mono text-xs font-bold text-primary">
          [SUCCESS] {successMsg}
        </div>
      )}

      {/* Error Messages */}
      {state?.error && (
        <div className="mb-4 border-2 border-destructive bg-destructive/10 p-3 font-mono text-xs font-bold text-destructive">
          [ERROR] {state.error}
        </div>
      )}

      {/* Form */}
      <form action={formAction} className="flex flex-col gap-6">
        <input type="hidden" name="avatar" value={avatarUrl} />

        {/* Top Section: Basic Info & Avatar */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar Upload */}
          <div className="flex flex-col gap-2 items-center text-center">
            <span className="font-mono text-xs font-bold uppercase tracking-wide">
              Node Avatar
            </span>
            <div className="relative h-28 w-28 border-4 border-foreground bg-muted shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-mono text-xs text-muted-foreground overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover animate-fade-in"
                />
              ) : isUploading ? (
                <span className="animate-pulse">LOADING...</span>
              ) : (
                <span>NO_IMAGE</span>
              )}
            </div>
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
              className="cursor-pointer border-2 border-foreground bg-secondary px-3 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] mt-2"
            >
              {isUploading ? 'UPLOADING...' : 'CHOOSE_AVATAR'}
            </button>
          </div>

          {/* Form Fields */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wide">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                defaultValue={user.username}
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
                defaultValue={user.email}
                placeholder="e.g. user@net.org"
                className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold uppercase tracking-wide">
            Bio (Developer Log)
          </label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={user.bio}
            placeholder="Introduce yourself or log your codebase project stats..."
            className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 resize-none"
          />
        </div>

        {/* Linked Providers Info */}
        <div className="border-2 border-dashed border-muted-foreground/30 p-3 bg-muted/20 font-mono text-xs">
          <span className="font-bold uppercase block mb-1">Linked Logins:</span>
          <div className="flex gap-2 flex-wrap mt-1">
            {user.providers.map((p) => (
              <span
                key={p}
                className="border border-foreground bg-background px-2.5 py-0.5 rounded-sm font-bold uppercase tracking-wide flex items-center gap-1.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Security / Password section */}
        <div className="border-2 border-foreground bg-card/50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 mt-2">
          <h3 className="font-mono text-sm font-black uppercase text-foreground">
            // UPDATE_PASSWORD
          </h3>
          <p className="font-mono text-[10px] text-muted-foreground uppercase leading-tight">
            Leave blank if you do not wish to modify your password coordinates.
          </p>

          {/* Conditional Old Password */}
          {user.hasPassword ? (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wide text-destructive">
                Current Password *
              </label>
              <input
                name="oldPassword"
                type="password"
                placeholder="Required for password changes"
                className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-amber-500/50 bg-amber-500/5 p-3 font-mono text-xs text-amber-600 dark:text-amber-400">
              [INFO] You currently log in via socials (Google/GitHub). Setting a new password below will enable credentials-based login using your email.
            </div>
          )}

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-bold uppercase tracking-wide">
              New Password
            </label>
            <input
              name="newPassword"
              type="password"
              placeholder="••••••••"
              className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="cursor-pointer border-2 border-foreground bg-primary py-2.5 font-mono text-sm font-black text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 mt-4"
        >
          {isPending ? 'SAVING COORDINATES...' : 'RUN_UPDATE'}
        </button>
      </form>
    </div>
  )
}

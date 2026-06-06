import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { signOutAction } from '@/actions/authActions'

export default async function Header() {
  const sessionUser = await getCurrentUser()
  let dbUser = null

  if (sessionUser) {
    try {
      await dbConnect()
      dbUser = await User.findById(sessionUser.userId)
    } catch (e) {
      console.error('Header db fetch error:', e)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-foreground bg-background px-6 py-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary font-bold text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            DP
            <span className="absolute -top-1 -right-1 h-3 w-3 animate-ping rounded-full bg-destructive" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
          </div>
          <div>
            <span className="font-mono text-2xl font-black tracking-tight text-foreground hover:text-primary transition-colors">
              DevPulse
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              [DEV_NEWS_HUB]
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 font-mono text-sm font-bold">
          <Link
            href="/"
            className="border-b-2 border-transparent py-1 hover:border-primary hover:text-primary transition-colors"
          >
            ~/trending
          </Link>
          <Link
            href="/bookmarks"
            className="border-b-2 border-transparent py-1 hover:border-primary hover:text-primary transition-colors"
          >
            ~/bookmarks
          </Link>
          <Link
            href="/submit"
            className="border-b-2 border-transparent py-1 hover:border-primary hover:text-primary transition-colors"
          >
            ~/submit
          </Link>
          <Link
            href="/profile"
            className="border-b-2 border-transparent py-1 hover:border-primary hover:text-primary transition-colors"
          >
            ~/profile
          </Link>
        </nav>

        {/* User Info / Actions */}
        <div className="flex items-center gap-4">
          {dbUser ? (
            <div className="flex items-center gap-4 border-2 border-foreground bg-card p-1 pr-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Link href="/profile" className="flex items-center gap-3 hover:text-primary transition-colors group">
                {dbUser.avatar && (
                  <img
                    src={dbUser.avatar}
                    alt={dbUser.username}
                    className="h-8 w-8 border-2 border-foreground bg-muted object-cover group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-xs font-black leading-none">@{dbUser.username}</p>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Settings</span>
                </div>
              </Link>
              <form action={signOutAction} className="m-0">
                <button
                  type="submit"
                  className="cursor-pointer border-2 border-foreground bg-destructive px-3 py-1 font-mono text-xs font-bold text-destructive-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-destructive/90 transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  SIGOUT
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/signin"
                className="border-2 border-foreground bg-secondary px-4 py-1.5 font-mono text-sm font-bold text-secondary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                SIGN_IN
              </Link>
              <Link
                href="/signup"
                className="border-2 border-foreground bg-primary px-4 py-1.5 font-mono text-sm font-bold text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                SIGN_UP
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

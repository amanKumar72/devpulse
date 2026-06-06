import { redirect } from 'next/navigation'
import dbConnect from '@/lib/db'
import User from '@/lib/models/User'
import { getCurrentUser } from '@/lib/auth'
import ProfileForm from '@/components/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser()

  if (!sessionUser) {
    redirect('/signin?callbackUrl=/profile')
  }

  await dbConnect()
  const user = await User.findById(sessionUser.userId)

  if (!user) {
    redirect('/signin?callbackUrl=/profile')
  }

  const serializedUser = {
    username: user.username,
    email: user.email,
    bio: user.bio || '',
    avatar: user.avatar || '',
    hasPassword: !!user.password,
    providers: user.providers.map((p: any) => p.name),
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center">
      <ProfileForm user={serializedUser} />
    </div>
  )
}

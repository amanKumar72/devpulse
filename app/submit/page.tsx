import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SubmitForm from '@/components/SubmitForm'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/signin?callbackUrl=/submit')
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <SubmitForm />
    </div>
  )
}

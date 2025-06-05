import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SetupWizard from '@/components/setup-wizard/setup-wizard'

export default async function SetupPage() {
  const supabase = createClient()

  // Get session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth/sign-in')
  }

  // Check if user already has an organization
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (orgMember) {
    redirect('/dashboard')
  }

  return (
    <div>
      <SetupWizard />
    </div>
  )
}

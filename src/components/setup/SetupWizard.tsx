"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import OrganizationStep from './steps/OrganizationStep'
import ProfileStep from './steps/ProfileStep'
import TeamStep from './steps/TeamStep'
import type { User } from '@supabase/supabase-js'

export default function SetupWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stepData, setStepData] = useState<any>({})
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!user) {
          router.push('/sign-in')
          return
        }
        setAuthenticatedUser(user)
      } catch (err) {
        console.error('Error checking user:', err)
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again.',
          variant: 'destructive',
        })
        router.push('/sign-in')
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router, supabase.auth, toast])

  const steps = [
    {
      id: 1,
      title: 'Create Organization',
      description: 'Set up your organization details',
    },
    {
      id: 2,
      title: 'Complete Profile',
      description: 'Tell us about yourself',
    },
    {
      id: 3,
      title: 'Invite Team',
      description: 'Invite your team members',
    },
  ]

  const totalSteps = steps.length

  const saveProgress = async (step: number, data: any) => {
    try {
      setStepData((prev: any) => ({ ...prev, ...data }))
      setCurrentStep(step)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress')
      throw err
    }
  }

  const completeSetup = async () => {
    try {
      if (!authenticatedUser) {
        throw new Error('No authenticated user found')
      }

      // Create organization with the collected data
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: stepData.organization.name,
          website: stepData.organization.website || null,
        })
        .select()
        .single()

      if (orgError) throw orgError
      if (!org) throw new Error('Failed to create organization')

      // Add user as organization owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: authenticatedUser.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      // Update user profile if needed
      if (stepData.profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: authenticatedUser.id,
            email: authenticatedUser.email!,
            full_name: stepData.profile.fullName,
            job_title: stepData.profile.title,
          })

        if (profileError) throw profileError
      }

      // Send team invites if any
      if (stepData.team?.invites.length) {
        const invites = stepData.team.invites.map((email: string) => ({
          organization_id: org.id,
          email,
          invited_by: authenticatedUser.id,
        }))

        const { error: inviteError } = await supabase
          .from('organization_invites')
          .insert(invites)

        if (inviteError) throw inviteError
      }

      return org
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup')
      throw err
    }
  }

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    }
  }, [error, toast])

  const handleNext = async (data: any) => {
    try {
      await saveProgress(currentStep + 1, data)
    } catch (err) {
      // Error is already handled by the hook
      return
    }
  }

  const handleBack = async () => {
    try {
      await saveProgress(currentStep - 1, {})
    } catch (err) {
      // Error is already handled by the hook
    }
  }

  const handleComplete = async (data: any) => {
    try {
      await saveProgress(currentStep, data)
      await completeSetup()
      router.push('/dashboard')
    } catch (err) {
      // Error is already handled by the hook
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">
            {steps[currentStep - 1].title}
          </h1>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(currentStep / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {currentStep === 1 && (
          <OrganizationStep
            initialData={stepData.organization}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <ProfileStep
            initialData={stepData.profile}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <TeamStep
            initialData={stepData.team}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        )}
      </div>
    </Card>
  )
} 
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { PostgrestError } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type SetupStep = {
  id: number
  title: string
  description: string
}

type StepData = Database['public']['Tables']['organization_setup_progress']['Row']['step_data']
type SetupProgressRecord = Database['public']['Tables']['organization_setup_progress']['Row']

export const SETUP_STEPS: SetupStep[] = [
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

export function useSetupWizard() {
  const { user } = useAuth()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [stepData, setStepData] = useState<StepData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProgress = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase
        .rpc('get_or_create_setup_progress', {
          user_id_param: user.id
        })

      if (rpcError) {
        throw rpcError
      }

      if (!data) {
        throw new Error('No data returned from setup progress query')
      }

      setCurrentStep(data.current_step)
      setStepData(data.step_data)
    } catch (err) {
      console.error('Error loading setup progress:', err)
      const errorMessage = err instanceof PostgrestError 
        ? `Database error: ${err.message}`
        : err instanceof Error 
          ? err.message 
          : 'Failed to load setup progress'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const saveProgress = useCallback(async (
    step: number,
    data: Partial<StepData>
  ) => {
    if (!user) return

    try {
      setError(null)
      const newStepData = { ...stepData, ...data }

      const { error } = await supabase
        .rpc('update_setup_progress', {
          user_id_param: user.id,
          step_param: step,
          step_data_param: newStepData
        })

      if (error) throw error

      setCurrentStep(step)
      setStepData(newStepData)
    } catch (err) {
      console.error('Error saving setup progress:', err)
      const errorMessage = err instanceof PostgrestError 
        ? `Database error: ${err.message}`
        : err instanceof Error 
          ? err.message 
          : 'Failed to save setup progress'
      setError(errorMessage)
      throw err
    }
  }, [user, stepData, supabase])

  const completeSetup = useCallback(async () => {
    if (!user || !stepData.organization) return

    try {
      setError(null)

      // Create organization first
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

      // Add user as organization owner immediately after
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      // Update user profile if needed
      if (stepData.profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: stepData.profile.fullName,
            title: stepData.profile.title,
          })

        if (profileError) throw profileError
      }

      // Send team invites if any
      if (stepData.team?.invites.length) {
        const invites = stepData.team.invites.map(email => ({
          organization_id: org.id,
          email,
          invited_by: user.id,
        }))

        const { error: inviteError } = await supabase
          .from('organization_invites')
          .insert(invites)

        if (inviteError) throw inviteError
      }

      // Delete setup progress last
      const { error: deleteError } = await supabase
        .from('organization_setup_progress')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      return org

    } catch (err) {
      console.error('Error completing setup:', err)
      const errorMessage = err instanceof PostgrestError 
        ? `Database error: ${err.message}`
        : err instanceof Error 
          ? err.message 
          : 'Failed to complete setup'
      setError(errorMessage)
      throw err
    }
  }, [user, stepData, supabase])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  return {
    currentStep,
    stepData,
    loading,
    error,
    saveProgress,
    completeSetup,
    totalSteps: SETUP_STEPS.length,
    steps: SETUP_STEPS,
  }
} 
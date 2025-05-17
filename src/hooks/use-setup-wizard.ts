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

// Define a more specific type for the structure within step_data JSON
interface WizardStepData {
  organization?: {
    name: string;
    website?: string | null;
  };
  profile?: {
    fullName: string;
    title: string; // This will be mapped to job_title in the profiles table
  };
  team?: {
    invites: string[];
  };
  [key: string]: any; // Allow other dynamic properties if necessary
}

type StepData = WizardStepData; // Use the more specific type for state
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
  const [stepData, setStepData] = useState<StepData>({}) // Initialized as WizardStepData
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
        .single<SetupProgressRecord>() // Expect a single record

      if (rpcError) {
        throw rpcError
      }

      if (!data) {
        throw new Error('No data returned from setup progress query')
      }

      setCurrentStep(data.current_step)
      setStepData(data.step_data as WizardStepData) // Cast to WizardStepData
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
    data: Partial<WizardStepData> // Parameter data is also WizardStepData
  ) => {
    if (!user) return

    try {
      setError(null)
      const newStepData: WizardStepData = { ...(stepData as WizardStepData), ...data } // Ensure types align for spread

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
            email: user.email!, // Add email
            full_name: stepData.profile.fullName,
            job_title: stepData.profile.title, // Map title to job_title
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
import { useCallback, useEffect, useRef, useState } from 'react'
import { type Session, type User, type SupabaseClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { useRouter } from 'next/navigation'
import { getAuthCookieOptions } from '@/lib/utils/cookies'

export type AuthError = {
  message: string
  code?: string
}

export type AuthState = {
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  error: AuthError | null
  session: Session | null
}

export type SignInResponse = {
  success: boolean
  error: string | null
}

export function useAuth() {
  const router = useRouter()
  const initialMountRef = useRef(false)
  const sessionInitialized = useRef(false)
  const currentSession = useRef<Session | null>(null)
  const supabaseClient = useRef<SupabaseClient<Database, "public">>(
    createClientComponentClient<Database>({
      cookieOptions: {
        ...getAuthCookieOptions(),
        domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
        secure: process.env.NODE_ENV === 'production',
      }
    })
  )
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
    session: null,
  })

  // Check and update session state
  const checkSession = useCallback(async () => {
    try {
      console.debug('[Auth Debug] Checking session...')
      const { data: { session }, error } = await supabaseClient.current.auth.getSession()
      
      if (error) {
        console.error('[Auth Debug] Session check error:', error)
        throw error
      }

      console.debug('[Auth Debug] Session check result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'missing',
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none'
      })

      // Only update state if session has changed
      if (JSON.stringify(session) !== JSON.stringify(currentSession.current)) {
        console.debug('[Auth Debug] Session changed, updating state')
        currentSession.current = session
        setState(prev => ({
          ...prev,
          isAuthenticated: !!session,
          user: session?.user ?? null,
          session,
          isLoading: false,
          error: null,
        }))
      }

      return session
    } catch (error) {
      console.error('[Auth Debug] Session check failed:', error)
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false,
        error: {
          message: error instanceof Error ? error.message : 'Session check failed',
        },
      }))
      return null
    }
  }, [])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      console.debug('[Auth Debug] Attempting sign in:', { email })
      
      const { data, error } = await supabaseClient.current.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (error) {
        console.error('[Auth Debug] Sign in error:', error)
        throw error
      }

      if (!data.session) {
        console.error('[Auth Debug] No session created after sign in')
        throw new Error('No session created')
      }

      console.debug('[Auth Debug] Sign in successful:', {
        userId: data.user?.id,
        hasSession: !!data.session,
        accessToken: data.session.access_token ? 'present' : 'missing',
        expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'none'
      })

      currentSession.current = data.session
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: data.user,
        session: data.session,
        isLoading: false,
        error: null,
      }))

      // Wait a moment for the session to be properly set
      await new Promise(resolve => setTimeout(resolve, 100))

      // Use Next.js router with state parameter
      console.debug('[Auth Debug] Navigating to dashboard')
      router.push('/dashboard?auth_state=post_signin')

      return { success: true, error: null }
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred'
      console.error('[Auth Debug] Sign in error:', errorMessage)
      
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false,
        error: {
          message: errorMessage,
        },
      }))
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }, [router])

  // Handle auth state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.debug('[Auth Debug] Setting up auth state change listener')
    const {
      data: { subscription },
    } = supabaseClient.current.auth.onAuthStateChange(async (event, session) => {
      console.debug('[Auth Debug] Auth state changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'missing',
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none',
        isInitialized: sessionInitialized.current,
        pathname: window.location.pathname
      })
      
      // Skip initial session if we've already initialized
      if (event === 'INITIAL_SESSION') {
        if (sessionInitialized.current) {
          console.debug('[Auth Debug] Skipping duplicate initial session event')
          return
        }
        sessionInitialized.current = true
      }

      // For SIGNED_IN event, wait for session to be properly set
      if (event === 'SIGNED_IN') {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Only update state if session has changed
      if (JSON.stringify(session) !== JSON.stringify(currentSession.current)) {
        console.debug('[Auth Debug] Session changed in auth state change')
        currentSession.current = session
        setState(prev => ({
          ...prev,
          isAuthenticated: !!session,
          user: session?.user ?? null,
          session,
          isLoading: false,
        }))
      }

      // Handle sign-out navigation
      if (event === 'SIGNED_OUT') {
        console.debug('[Auth Debug] Navigating to sign-in')
        currentSession.current = null
        router.push('/sign-in?auth_state=post_signout')
      }
    })

    return () => {
      console.debug('[Auth Debug] Cleaning up auth state change listener')
      subscription.unsubscribe()
    }
  }, [router])

  // Initial session check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!initialMountRef.current) {
      console.debug('[Auth Debug] Performing initial session check')
      checkSession()
      initialMountRef.current = true
    }
  }, [checkSession])

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const { error: signOutError } = await supabaseClient.current.auth.signOut()

      if (signOutError) {
        const errorMessage = signOutError.message
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          session: null,
          isLoading: false,
          error: {
            message: errorMessage,
          },
        }))
        return { success: false, error: errorMessage }
      }

      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false,
        error: null,
      }))

      return { success: true, error: null }
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred'
      console.error('Sign out error:', errorMessage)
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false,
        error: {
          message: errorMessage,
        },
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  return {
    ...state,
    signIn,
    signOut,
  }
}
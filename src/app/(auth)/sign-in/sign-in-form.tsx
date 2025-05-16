"use client";

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { Message } from "@/components/form-message";
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'

// Define validation schema with zod
const formSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Must be a valid email address' }),
  password: z.string()
    .min(1, { message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters' })
})

type FormValues = z.infer<typeof formSchema>

interface SignInFormProps {
  searchParams?: Message;
}

export function SignInForm({ searchParams }: SignInFormProps) {
  const { signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Initialize React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onBlur' // Validate on blur for better UX
  })
  
  const isSubmitting = form.formState.isSubmitting

  // Handle searchParams after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    if (searchParams && 'error' in searchParams) {
      setError(searchParams.error)
    }
  }, [searchParams])

  // Form submission handler
  async function onSubmit(values: FormValues) {
    try {
      setError(null)
      console.debug('[Sign In Form Debug] Submitting sign in:', { email: values.email })
      
      const { success, error } = await signIn(values.email, values.password)

      if (!success) {
        console.error('[Sign In Form Debug] Sign in failed:', error)
        setError(error || 'Failed to sign in')
        return
      }

      console.debug('[Sign In Form Debug] Sign in successful')
    } catch (err) {
      console.error('[Sign In Form Debug] Sign in error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {mounted && (error || (searchParams && 'error' in searchParams)) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p>{error || (searchParams && 'error' in searchParams ? searchParams.error : '')}</p>
          </AlertDescription>
        </Alert>
      )}
      
      {mounted && searchParams && 'message' in searchParams && !error && (
        <Alert>
          <AlertDescription>
            <p>{searchParams.message}</p>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    autoComplete="email"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      {...field}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          <div className="text-sm text-center space-x-1">
            <a href="/reset-password" className="text-primary hover:underline">
              Forgot password?
            </a>
            <span>·</span>
            <a href="/sign-up" className="text-primary hover:underline">
              Create account
            </a>
          </div>
        </form>
      </Form>
    </div>
  )
} 
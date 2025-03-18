'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function AdminFunctionCreator({ createAdminFunction }: { createAdminFunction: (formData: FormData) => Promise<any> }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const response = await createAdminFunction(formData);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Admin Check Function</CardTitle>
        <CardDescription>Create a database function to check auth.users table</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This will create a PostgreSQL function that can check the auth.users table directly.
          This is useful for diagnosing authentication issues.
        </p>
        
        {result && (
          <Alert className={result.success ? 'bg-green-50' : 'bg-red-50'}>
            <div className="flex items-center">
              {result.success ? <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> : <XCircle className="h-4 w-4 text-red-600 mr-2" />}
              <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            </div>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <form action={handleSubmit}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Admin Function'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export function AuthSystemChecker({ checkAuthSystem }: { checkAuthSystem: (formData: FormData) => Promise<any> }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const response = await checkAuthSystem(formData);
      setResult(response);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Check Auth System</CardTitle>
        <CardDescription>Run diagnostics on the auth system</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This will run a series of checks on the auth system to diagnose any issues.
        </p>
        
        {result && (
          <div className="mt-4 space-y-4">
            {result.error ? (
              <Alert className="bg-red-50">
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : result.authUsers ? (
              <div className="border p-4 rounded-md space-y-2">
                <h3 className="font-medium">Auth Users Check</h3>
                <div className="text-sm">
                  <div className="flex items-center">
                    {result.authUsers.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    )}
                    <span>{result.authUsers.message}</span>
                  </div>
                  
                  {result.authUsers.data && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                      {JSON.stringify(result.authUsers.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <Alert className="bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <AlertTitle>No Results</AlertTitle>
                <AlertDescription>No diagnostics results were returned.</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form action={handleSubmit}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Run Auth System Check'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export function AuthIssuesDiagnoser({ diagnoseAuthIssues }: { diagnoseAuthIssues: (formData: FormData) => Promise<any> }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const response = await diagnoseAuthIssues(formData);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnose Auth Issues</CardTitle>
        <CardDescription>Run deeper diagnostics on the auth system</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This will run deeper diagnostics to identify potential issues with the auth system.
        </p>
        
        {result && (
          <div className="mt-4 space-y-4">
            <Alert className={result.success ? 'bg-green-50' : 'bg-red-50'}>
              <div className="flex items-center">
                {result.success ? <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> : <XCircle className="h-4 w-4 text-red-600 mr-2" />}
                <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              </div>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
            
            {result.data && (
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">Diagnostic Results</h3>
                <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form action={handleSubmit}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Diagnosing...' : 'Run Diagnostics'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export function UserCreationTester({ testUserCreation }: { testUserCreation: (formData: FormData) => Promise<any> }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const response = await testUserCreation(formData);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test User Creation</CardTitle>
        <CardDescription>Test if a user can be created and deleted</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This will attempt to create a test user and then delete it,
          to verify if user creation is working properly.
        </p>
        
        {result && (
          <div className="mt-4 space-y-4">
            <Alert className={result.success ? 'bg-green-50' : 'bg-red-50'}>
              <div className="flex items-center">
                {result.success ? <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> : <XCircle className="h-4 w-4 text-red-600 mr-2" />}
                <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              </div>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
            
            {(result.user || result.error) && (
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">Details</h3>
                <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
                  {JSON.stringify(result.user || result.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form action={handleSubmit}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Testing...' : 'Run Test'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
} 
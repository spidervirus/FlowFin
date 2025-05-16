# CSRF Protection Guide

## Overview

Cross-Site Request Forgery (CSRF) is a type of attack that forces authenticated users to execute unwanted actions on a web application. FlowFin implements comprehensive CSRF protection using a dual approach for server and client components.

## Implementation Architecture

The CSRF protection in FlowFin is split into two parts to accommodate Next.js's component model:

1. **Server-Side Protection (`src/lib/api/csrf-protection.server.ts`)**
   - Used in Server Components, API routes, and middleware
   - Handles cookie management and token validation
   - Implements token rotation and secure validation

2. **Client-Side Integration (`src/lib/api/csrf-protection.ts`)**
   - Used in Client Components with the "use client" directive
   - Provides utilities for including CSRF tokens in requests
   - Retrieves token from cookies for client-side code

## Basic Usage

### Server Components and API Routes

```typescript
// In an API route or Server Component
import { validateCsrfToken, getOrCreateCsrfToken } from '@/lib/api/csrf-protection.server';

// In a Server Component, make sure the token is present
export default async function MyServerComponent() {
  // Ensure CSRF token is set in cookies
  const token = await getOrCreateCsrfToken();
  
  // Pass token to client for forms
  return (
    <form>
      <input type="hidden" name="csrfToken" value={token} />
      {/* Form fields */}
    </form>
  );
}

// In an API route
export async function POST(request: Request) {
  try {
    // Validate CSRF token
    const csrfResult = await validateCsrfToken(request);
    if (!csrfResult.success) {
      return Response.json({ error: csrfResult.error }, { status: 403 });
    }
    
    // Process request normally
    // ...
  } catch (error) {
    return Response.json({ error: 'Error processing request' }, { status: 500 });
  }
}
```

### Client Components

```typescript
// In a Client Component
"use client";

import { useCsrfToken } from '@/lib/api/csrf-protection';

export default function MyClientComponent() {
  const { token, fetchWithCsrf, getFormField } = useCsrfToken();
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Method 1: Using the fetchWithCsrf utility
    const response = await fetchWithCsrf('/api/some-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...formData,
        ...getFormField() // Automatically adds CSRF token
      })
    });
    
    // Process response
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Include CSRF token as hidden field */}
      <input type="hidden" name="csrfToken" value={token || ''} />
      
      {/* Form fields */}
    </form>
  );
}
```

## Middleware Integration

To protect all non-GET routes automatically:

```typescript
// In middleware.ts
import { csrfMiddleware } from '@/lib/api/csrf-protection.server';

export function middleware(request: NextRequest) {
  // Apply CSRF middleware for non-GET routes
  return csrfMiddleware(request);
}

// Configure which routes to protect
export const config = {
  matcher: [
    // Apply to all POST routes except authentication
    '/((?!api/auth/signin|api/auth/signup|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Testing CSRF Protection

### Test Valid Tokens

```typescript
// First ensure token is set
await fetch('/api/csrf/token'); // Route that sets token

// Then make a protected request
const response = await fetch('/api/protected', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': document.cookie.match(/csrf_token=([^;]+)/)?.[1] || ''
  },
  body: JSON.stringify({ data: 'test' })
});
```

### Test Invalid Tokens

```typescript
// Make a request with invalid token
const response = await fetch('/api/protected', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': 'invalid-token'
  },
  body: JSON.stringify({ data: 'test' })
});

// Should receive 403 Forbidden
```

## Troubleshooting

### Token Not Found

If your client components can't find the CSRF token:

1. Make sure the token is set in cookies by navigating to a page with a Server Component first
2. Check if cookies are properly accessible (no HttpOnly issues)
3. Create a dedicated API route to fetch a fresh CSRF token

### Validation Failures

If requests are failing CSRF validation:

1. Check for token rotation issues - tokens might be changing between request setup and submission
2. Verify your token is included in both cookies and headers
3. Inspect request headers to confirm token is being sent correctly
4. For form submissions, make sure the token field name is `csrfToken`

## Security Considerations

- Tokens are rotated after each state-changing request for enhanced security
- Validation uses timing-safe comparison to prevent timing attacks
- Tokens are stored in HttpOnly cookies to prevent JavaScript access from potential XSS attacks
- SameSite=Lax prevents CSRF in modern browsers even without tokens

## API Reference

### Server-Side API

- `generateCsrfToken()`: Creates a cryptographically secure random token
- `setCsrfToken()`: Sets a new token in cookies and returns it
- `getCsrfToken()`: Retrieves current token from cookies
- `getOrCreateCsrfToken()`: Gets existing token or creates a new one
- `clearCsrfToken()`: Removes token cookie
- `validateCsrfToken(request)`: Validates token from request against cookie
- `csrfMiddleware(request)`: Middleware function for Next.js

### Client-Side API

- `getClientCsrfToken()`: Gets token from cookies in browser
- `withCsrfToken(options)`: Adds token to fetch options
- `createCsrfFetch()`: Creates fetch function with token included
- `getCsrfTokenFieldHtml()`: Gets HTML for hidden input
- `getCsrfTokenObject()`: Gets token as object for forms
- `useCsrfToken()`: Hook for React components

By following this guide, you'll ensure proper CSRF protection throughout your application while maintaining compatibility with Next.js's component model.
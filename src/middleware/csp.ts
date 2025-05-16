import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function getCspHeaders() {
  const cspHeader = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://api.tempolabs.ai", "https://storage.googleapis.com"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", process.env.NEXT_PUBLIC_SUPABASE_URL!, "https://*.supabase.co", "https://api.tempolabs.ai"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
  };

  return Object.entries(cspHeader)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

export function cspMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Only add CSP in production to avoid development issues
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      getCspHeaders()
    );
  }
  
  // Add other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}
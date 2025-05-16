/**
 * Security Configuration
 * 
 * This file centralizes security-related configurations for the FlowFin application.
 * It includes settings for Content Security Policy, cookies, CSRF protection, and
 * other security measures to ensure consistent implementation across the app.
 */

// Environment detection
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Cookie Security Settings
export const COOKIE_CONFIG = {
  // Session cookie settings
  SESSION: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: undefined, // Session cookie
  },
  
  // Persistent cookie settings (7 days default)
  PERSISTENT: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  
  // Sensitive data cookie settings
  SENSITIVE: {
    httpOnly: true,
    secure: true, // Always secure, even in development
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  },
  
  // Authentication cookie settings
  AUTH: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  },
  
  // CSRF token cookie settings
  CSRF: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 2, // 2 hours
  }
};

// CSRF Protection Configuration
export const CSRF_CONFIG = {
  COOKIE_NAME: 'csrf_token',
  HEADER_NAME: 'x-csrf-token',
  META_NAME: 'csrf-token',
  TOKEN_LENGTH: 32,
  TOKEN_EXPIRY: 60 * 60 * 2, // 2 hours in seconds
  ENABLED: IS_PRODUCTION, // Enable in production, optional in development
};

// Content Security Policy
export const CSP_CONFIG = {
  DEFAULT_SRC: ["'self'"],
  SCRIPT_SRC: [
    "'self'",
    "'unsafe-inline'", // For development, consider removing in production
    "https://api.tempolabs.ai",
    "https://storage.googleapis.com",
  ],
  STYLE_SRC: ["'self'", "'unsafe-inline'"],
  IMG_SRC: ["'self'", "data:", "https://images.unsplash.com", "https:"],
  FONT_SRC: ["'self'", "data:"],
  CONNECT_SRC: [
    "'self'",
    "https://*.supabase.co",
    "https://api.tempolabs.ai",
  ],
  OBJECT_SRC: ["'none'"],
  FRAME_SRC: ["'self'"],
  FRAME_ANCESTORS: ["'none'"],
  FORM_ACTION: ["'self'"],
  BASE_URI: ["'self'"],
  UPGRADE_INSECURE_REQUESTS: IS_PRODUCTION,
  BLOCK_ALL_MIXED_CONTENT: IS_PRODUCTION,
};

// Encryption Configuration
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256, // bits
  IV_LENGTH: 12, // bytes
  TAG_LENGTH: 16, // bytes
  SALT_LENGTH: 16, // bytes
  ITERATIONS: 100000,
  SECRET_ENV_VAR: 'ENCRYPTION_SECRET',
  FALLBACK_SECRET: 'flowfin-development-encryption-key-not-for-production',
};

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  AUTH: {
    MAX: 20,
    WINDOW_MS: 60 * 1000, // 1 minute
    MESSAGE: 'Too many authentication attempts. Please try again later.',
  },
  API: {
    MAX: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
    MESSAGE: 'Too many requests. Please try again later.',
  },
  SENSITIVE: {
    MAX: 5,
    WINDOW_MS: 60 * 1000, // 1 minute
    MESSAGE: 'Too many attempts. Please try again later.',
  },
};

// XSS Protection Configuration
export const XSS_CONFIG = {
  SANITIZE_HTML: true,
  SANITIZE_URL: true,
  SANITIZE_SCRIPTS: true,
  SANITIZE_STYLES: true,
};

// Security Headers
export const SECURITY_HEADERS = {
  // Security headers for all responses
  COMMON: {
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
  
  // Additional headers for auth-related endpoints
  AUTH: {
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
  },
};

// Helper function to generate Content-Security-Policy header value
export function generateCSP(nonce?: string): string {
  const directives: string[] = [];
  
  // Add default-src
  directives.push(`default-src ${CSP_CONFIG.DEFAULT_SRC.join(' ')}`);
  
  // Add script-src with nonce if provided
  const scriptSrc = [...CSP_CONFIG.SCRIPT_SRC];
  if (nonce) scriptSrc.push(`'nonce-${nonce}'`);
  directives.push(`script-src ${scriptSrc.join(' ')}`);
  
  // Add remaining directives
  directives.push(`style-src ${CSP_CONFIG.STYLE_SRC.join(' ')}`);
  directives.push(`img-src ${CSP_CONFIG.IMG_SRC.join(' ')}`);
  directives.push(`font-src ${CSP_CONFIG.FONT_SRC.join(' ')}`);
  directives.push(`connect-src ${CSP_CONFIG.CONNECT_SRC.join(' ')}`);
  directives.push(`object-src ${CSP_CONFIG.OBJECT_SRC.join(' ')}`);
  directives.push(`frame-src ${CSP_CONFIG.FRAME_SRC.join(' ')}`);
  directives.push(`frame-ancestors ${CSP_CONFIG.FRAME_ANCESTORS.join(' ')}`);
  directives.push(`form-action ${CSP_CONFIG.FORM_ACTION.join(' ')}`);
  directives.push(`base-uri ${CSP_CONFIG.BASE_URI.join(' ')}`);
  
  // Add production-only directives
  if (IS_PRODUCTION) {
    if (CSP_CONFIG.UPGRADE_INSECURE_REQUESTS) {
      directives.push('upgrade-insecure-requests');
    }
    if (CSP_CONFIG.BLOCK_ALL_MIXED_CONTENT) {
      directives.push('block-all-mixed-content');
    }
  }
  
  return directives.join('; ');
}

// Get all security headers including CSP if enabled
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const headers = { ...SECURITY_HEADERS.COMMON };
  
  // Add CSP in production or when explicitly enabled
  if (IS_PRODUCTION || process.env.ENABLE_CSP === 'true') {
    headers['Content-Security-Policy'] = generateCSP(nonce);
  }
  
  return headers;
}

// Helper to get environment-specific cookie options
export function getCookieOptions(type: keyof typeof COOKIE_CONFIG = 'SESSION') {
  return COOKIE_CONFIG[type];
}

// Get security configuration for client-side use (safe subset)
export function getClientSecurityConfig() {
  return {
    csrfEnabled: CSRF_CONFIG.ENABLED,
    csrfHeaderName: CSRF_CONFIG.HEADER_NAME,
    xssProtection: {
      sanitizeUrls: XSS_CONFIG.SANITIZE_URL,
      sanitizeHtml: XSS_CONFIG.SANITIZE_HTML,
    },
    isProd: IS_PRODUCTION,
  };
}
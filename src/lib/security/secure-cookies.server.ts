/**
 * Secure Cookie Server Utilities
 * 
 * Server-side utilities for handling cookies securely with proper
 * flags, encryption, and best practices for sensitive data.
 */

import { cookies } from 'next/headers';
// import { encrypt, decrypt } from './encryption'; // Commented out missing import

// Placeholder encryption/decryption functions
// TODO: Replace with actual encryption/decryption logic from './encryption'
function encrypt(text: string): string {
  console.warn("Encryption is not implemented. Using placeholder.");
  // For a real implementation, you would use a library like 'crypto-js' or Node.js 'crypto' module
  // Example: return crypto.createCipheriv(...).update(text, 'utf8', 'hex') + crypto.createCipheriv(...).final('hex');
  return `encrypted:${text}`; // Simple placeholder
}

function decrypt(encryptedText: string): string {
  console.warn("Decryption is not implemented. Using placeholder.");
  // For a real implementation, you would use a library like 'crypto-js' or Node.js 'crypto' module
  // Example: return crypto.createDecipheriv(...).update(encryptedText, 'hex', 'utf8') + crypto.createDecipheriv(...).final('utf8');
  if (encryptedText.startsWith("encrypted:")) {
    return encryptedText.substring("encrypted:".length); // Simple placeholder
  }
  throw new Error("Failed to decrypt (placeholder logic)");
}

/**
 * Cookie options with secure defaults
 */
export interface SecureCookieOptions {
  /** Cookie expiration in seconds */
  maxAge?: number;
  
  /** Domain for the cookie */
  domain?: string;
  
  /** Cookie path */
  path?: string;
  
  /** Whether the cookie is only sent over HTTPS */
  secure?: boolean;
  
  /** Whether the cookie is inaccessible to JavaScript */
  httpOnly?: boolean;
  
  /** Same-Site attribute for CSRF protection */
  sameSite?: 'strict' | 'lax' | 'none';
  
  /** Whether to encrypt the cookie value */
  encrypt?: boolean;
  
  /** Expiration date for the cookie */
  expires?: Date;
}

/**
 * Default secure cookie options
 */
const DEFAULT_OPTIONS: SecureCookieOptions = {
  path: '/',
  // Secure in production, not in development for easier testing
  secure: process.env.NODE_ENV === 'production',
  // Always httpOnly for sensitive cookies to prevent XSS
  httpOnly: true,
  // Lax allows the cookie to be sent when navigating to the site
  sameSite: 'lax',
  // By default, session cookie (no maxAge)
  maxAge: undefined,
  // Encrypt sensitive data by default
  encrypt: true,
};

/**
 * Sets a secure cookie with appropriate flags
 * 
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options
 */
export function setSecureCookie(
  name: string, 
  value: string | object, 
  options: SecureCookieOptions = {}
): void {
  const cookieStore = cookies();
  
  // Merge with default options
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Convert objects to string
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  // Encrypt value if encryption is enabled
  let finalValue = stringValue;
  if (opts.encrypt && stringValue) {
    try {
      finalValue = encrypt(stringValue);
    } catch (error) {
      console.error(`Failed to encrypt cookie value for ${name}:`, error);
      // Fall back to unencrypted value but log the error
    }
  }
  
  // Set the cookie with secure options
  cookieStore.set({
    name,
    value: finalValue,
    path: opts.path,
    domain: opts.domain,
    maxAge: opts.maxAge,
    expires: opts.expires,
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
  });
}

/**
 * Gets a cookie value, decrypting if needed
 * 
 * @param name Cookie name
 * @param encrypted Whether the cookie is encrypted
 * @returns Cookie value or undefined if not found
 */
export function getSecureCookie<T = string>(
  name: string,
  encrypted: boolean = true
): T | undefined {
  const cookieStore = cookies();
  const cookie = cookieStore.get(name);
  
  if (!cookie) {
    return undefined;
  }
  
  // Decrypt value if encrypted
  if (encrypted && cookie.value) {
    try {
      const decryptedValue = decrypt(cookie.value);
      
      // Check if it's JSON
      if (decryptedValue.startsWith('{') || decryptedValue.startsWith('[')) {
        try {
          return JSON.parse(decryptedValue) as T;
        } catch {
          // If not valid JSON, return as string
          return decryptedValue as unknown as T;
        }
      }
      
      return decryptedValue as unknown as T;
    } catch (error) {
      console.error(`Failed to decrypt cookie value for ${name}:`, error);
      // If decryption fails, return undefined as the value is not usable
      return undefined;
    }
  }
  
  // Try to parse as JSON
  if (cookie.value && (cookie.value.startsWith('{') || cookie.value.startsWith('['))) {
    try {
      return JSON.parse(cookie.value) as T;
    } catch {
      // Return as is if not valid JSON
      return cookie.value as unknown as T;
    }
  }
  
  return cookie.value as unknown as T;
}

/**
 * Deletes a cookie
 * 
 * @param name Cookie name
 * @param options Cookie options (path and domain must match the cookie to delete)
 */
export function deleteSecureCookie(
  name: string,
  options: Pick<SecureCookieOptions, 'path' | 'domain'> = {}
): void {
  const cookieStore = cookies();
  cookieStore.delete({
    name,
    path: options.path || DEFAULT_OPTIONS.path,
    domain: options.domain,
  });
}

/**
 * Sets a session cookie (deleted when browser closes)
 * 
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options
 */
export function setSessionCookie(
  name: string,
  value: string,
  options: Omit<SecureCookieOptions, 'maxAge'> = {}
): void {
  setSecureCookie(name, value, { ...options, maxAge: undefined });
}

/**
 * Sets a persistent cookie with specified expiration
 * 
 * @param name Cookie name
 * @param value Cookie value
 * @param maxAgeSeconds Cookie lifetime in seconds
 * @param options Cookie options
 */
export function setPersistentCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  options: Omit<SecureCookieOptions, 'maxAge'> = {}
): void {
  setSecureCookie(name, value, { ...options, maxAge: maxAgeSeconds });
}

/**
 * Sets a sensitive cookie with maximum security
 * 
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options
 */
export function setSensitiveCookie(
  name: string,
  value: string,
  options: Omit<SecureCookieOptions, 'httpOnly' | 'secure' | 'sameSite' | 'encrypt'> = {}
): void {
  setSecureCookie(name, value, {
    ...options,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    encrypt: true,
  });
}

/**
 * Checks if a cookie exists
 * 
 * @param name Cookie name
 * @returns true if cookie exists, false otherwise
 */
export function hasSecureCookie(name: string): boolean {
  const cookieStore = cookies();
  return cookieStore.has(name);
}

/**
 * Gets all cookies
 * 
 * @returns Array of cookie objects
 */
export function getAllCookies(): { name: string; value: string }[] {
  const cookieStore = cookies();
  return cookieStore.getAll();
}

/**
 * Generate a secure random string for use in cookies
 * 
 * @param length Length of the random string
 * @returns Random string
 */
export function generateSecureToken(length: number = 32): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').slice(0, length);
}

/**
 * Get proper cookie domain for current environment
 */
export function getProperCookieDomain(): string | undefined {
  // In development, don't set domain
  if (process.env.NODE_ENV !== 'production') return undefined;
  
  // For production, you need to provide the domain based on your deployment environment
  // This could be fetched from environment variables
  const domain = process.env.COOKIE_DOMAIN;
  return domain;
}
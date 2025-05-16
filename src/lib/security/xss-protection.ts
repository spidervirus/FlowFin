/**
 * XSS Protection Utilities
 * 
 * This file provides utilities for preventing cross-site scripting (XSS) attacks
 * by sanitizing user inputs and properly escaping content in different contexts.
 */

/**
 * HTML entity mapping for escaping
 */
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;'
};

/**
 * Regular expressions for detecting potentially malicious content
 */
const XSS_REGEX = {
  HTML_CHARS: /[&<>"'`/]/g,
  HTML_CHARS_MATCH: /[&<>"'`/]/,
  JS_ESCAPES: /['"\\\n\r\u2028\u2029]/g,
  URL_PROTOCOL: /^(javascript|data|vbscript|file):/i,
  ATTR_NAME: /^(on\w+|style|href|src|formaction)$/i,
  SCRIPT_OR_DATA: /<(script|data|object|embed|iframe)[^>]*?>[\s\S]*?<\/\1>/gi,
  UNWANTED_TAGS: /<(style|link|form|object|embed|iframe|script|meta)[^>]*?>[\s\S]*?<\/\1>/gi,
  EVAL_OR_FUNCTION: /\b(eval|Function)\s*\(/i,
  DOM_XSS_SINKS: /\b(document\.write|document\.writeln|innerHTML|outerHTML|insertAdjacentHTML)\s*=/i
};

/**
 * Escapes HTML entities in a string to prevent XSS
 * 
 * @param str The string to escape
 * @returns The escaped string
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str.replace(XSS_REGEX.HTML_CHARS, (match: string) => HTML_ESCAPES[match]);
}

/**
 * Determines if a string needs HTML escaping
 * 
 * @param str The string to check
 * @returns True if the string needs escaping
 */
export function needsEscaping(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  return XSS_REGEX.HTML_CHARS_MATCH.test(str);
}

/**
 * Sanitizes a URL to prevent JavaScript injection
 * 
 * @param url The URL to sanitize
 * @returns Safe URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim();
  
  // Check for potentially dangerous protocols
  if (XSS_REGEX.URL_PROTOCOL.test(trimmedUrl)) {
    return '';
  }
  
  // Add a default protocol if none exists
  if (!/^https?:\/\//i.test(trimmedUrl) && !trimmedUrl.startsWith('/')) {
    // For relative URLs without protocol, keep as is
    if (trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../') || !trimmedUrl.includes(':')) {
      return trimmedUrl;
    }
    // Otherwise, treat as suspicious
    return '';
  }
  
  return trimmedUrl;
}

/**
 * Sanitizes HTML content by removing potentially dangerous tags and attributes
 * 
 * @param html The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // This is a basic implementation - for production, consider using DOMPurify
  let sanitized = html;
  
  // Remove script and data tags, etc.
  sanitized = sanitized.replace(XSS_REGEX.SCRIPT_OR_DATA, '');
  
  // Remove other unwanted tags
  sanitized = sanitized.replace(XSS_REGEX.UNWANTED_TAGS, '');
  
  // Remove eval and Function calls
  sanitized = sanitized.replace(XSS_REGEX.EVAL_OR_FUNCTION, 'disabledFunction(');
  
  // Remove DOM XSS sinks
  sanitized = sanitized.replace(XSS_REGEX.DOM_XSS_SINKS, 'disabledProperty=');
  
  return sanitized;
}

/**
 * Sanitizes JavaScript code to prevent XSS
 * 
 * @param code The JavaScript code to sanitize
 * @returns Sanitized JavaScript code or empty string if potentially dangerous
 */
export function sanitizeJavaScript(code: string): string {
  if (!code) return '';
  
  // Check for potentially dangerous patterns
  if (
    XSS_REGEX.EVAL_OR_FUNCTION.test(code) || 
    XSS_REGEX.DOM_XSS_SINKS.test(code)
  ) {
    return '';
  }
  
  return code;
}

/**
 * Sanitizes a string for safe insertion into HTML attributes
 * 
 * @param value The attribute value to sanitize
 * @param attrName The name of the attribute
 * @returns Sanitized attribute value
 */
export function sanitizeAttribute(value: string, attrName: string): string {
  // Check if it's a potentially dangerous attribute
  if (XSS_REGEX.ATTR_NAME.test(attrName)) {
    if (attrName.toLowerCase() === 'href' || attrName.toLowerCase() === 'src') {
      return sanitizeUrl(value);
    }
    if (attrName.toLowerCase() === 'style') {
      return sanitizeStyle(value);
    }
    // For on* attributes, return nothing (disallow inline JavaScript)
    if (attrName.toLowerCase().startsWith('on')) {
      return '';
    }
  }
  
  // For other attributes, escape HTML entities
  return escapeHtml(value);
}

/**
 * Sanitizes CSS styles to prevent XSS through CSS
 * 
 * @param style The CSS style string to sanitize
 * @returns Sanitized CSS style string
 */
export function sanitizeStyle(style: string): string {
  if (!style) return '';
  
  // Remove expression and function calls
  let sanitized = style.replace(/expression\s*\(|javascript:|behavior:|@import|position\s*:\s*fixed/gi, '');
  
  // Remove url() with potentially dangerous protocols
  sanitized = sanitized.replace(/url\s*\(\s*(['"]*)(javascript|data|vbscript|file):/gi, 'url($1invalid:');
  
  return sanitized;
}

/**
 * Generates a nonce for use with Content-Security-Policy
 * @returns A random nonce string
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Fallback for environments without crypto
  let nonce = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    nonce += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return nonce;
}

/**
 * Safe JSON serialization to prevent XSS in JSON embedded in HTML
 * 
 * @param data The data to serialize
 * @returns A safely serialized JSON string
 */
export function safeJsonStringify(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

/**
 * Sanitizes user input for safe display (recommended for most cases)
 * 
 * @param input User input to sanitize
 * @returns Sanitized string
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  return escapeHtml(input.trim());
}

/**
 * Creates a safe HTML attribute object from user input
 * 
 * @param attributes Object with attribute names and values
 * @returns Object with sanitized attribute values
 */
export function sanitizeAttributes(attributes: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [name, value] of Object.entries(attributes)) {
    // Skip on* attributes entirely
    if (name.toLowerCase().startsWith('on')) continue;
    
    sanitized[name] = sanitizeAttribute(value, name);
  }
  
  return sanitized;
}

/**
 * Sanitizes an error message for safe display
 * 
 * @param error Error object or string
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(error: unknown): string {
  let message: string;
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    message = error.message;
  } else {
    message = 'An unknown error occurred';
  }
  
  return sanitizeUserInput(message);
}

/**
 * Creates safe data attributes for DOM elements
 * 
 * @param data Object with data attribute values
 * @returns Object with sanitized data attributes
 */
export function createSafeDataAttributes(data: Record<string, string>): Record<string, string> {
  const safeData: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const dataKey = `data-${key.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
    safeData[dataKey] = sanitizeUserInput(value);
  }
  
  return safeData;
}
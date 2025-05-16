import { createHash, randomBytes } from "crypto";

export class CSRFTokenManager {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

  private static tokenStore = new Map<
    string,
    { token: string; expires: number }
  >();

  static generateToken(): string {
    const token = randomBytes(this.TOKEN_LENGTH).toString("hex");
    const expires = Date.now() + this.TOKEN_EXPIRY;

    this.tokenStore.set(token, { token, expires });
    return token;
  }

  static validateToken(token: string | null): boolean {
    if (!token) return false;

    const storedToken = this.tokenStore.get(token);
    if (!storedToken) return false;

    // Check if token has expired
    if (Date.now() > storedToken.expires) {
      this.tokenStore.delete(token);
      return false;
    }

    return true;
  }

  static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.tokenStore.entries()) {
      if (now > data.expires) {
        this.tokenStore.delete(token);
      }
    }
  }
}

export const validateCsrfToken = (token: string | null): boolean => {
  return CSRFTokenManager.validateToken(token);
};

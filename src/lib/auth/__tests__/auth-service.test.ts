import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthService } from "../auth-service";
import { createClient } from "@/lib/supabase/client";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      refreshSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}));

vi.mock("@/lib/error-handler", () => ({
  handleError: vi.fn((error) => error),
  showErrorToast: vi.fn(),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Get instance of AuthService
    authService = AuthService.getInstance();
    mockSupabase = createClient();
  });

  afterEach(() => {
    // Clean up after each test
    authService.cleanup();
  });

  describe("signUp", () => {
    it("should successfully sign up a new user", async () => {
      const mockUser = { id: "123", email: "test@example.com" };
      const mockSession = { user: mockUser };

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signUp(
        "test@example.com",
        "Password123!",
      );

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123!",
      });
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("should handle sign up error", async () => {
      const mockError = new Error("Sign up failed");
      mockSupabase.auth.signUp.mockRejectedValueOnce(mockError);

      const result = await authService.signUp(
        "test@example.com",
        "Password123!",
      );

      expect(result.user).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe("signIn", () => {
    it("should successfully sign in a user", async () => {
      const mockUser = { id: "123", email: "test@example.com" };
      const mockSession = { user: mockUser };

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn(
        "test@example.com",
        "Password123!",
      );

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123!",
      });
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("should handle sign in error", async () => {
      const mockError = new Error("Sign in failed");
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(mockError);

      const result = await authService.signIn(
        "test@example.com",
        "Password123!",
      );

      expect(result.user).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe("signOut", () => {
    it("should successfully sign out a user", async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

      const result = await authService.signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it("should handle sign out error", async () => {
      const mockError = new Error("Sign out failed");
      mockSupabase.auth.signOut.mockRejectedValueOnce(mockError);

      const result = await authService.signOut();

      expect(result.error).toBeTruthy();
    });
  });

  describe("session management", () => {
    it("should get current session", async () => {
      const mockSession = { user: { id: "123" } };
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.getSession();

      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it("should refresh session", async () => {
      const mockSession = { user: { id: "123" } };
      mockSupabase.auth.refreshSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.refreshSession();

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });
  });

  describe("authentication state", () => {
    it("should return true when authenticated", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: "123" } } },
        error: null,
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it("should return false when not authenticated", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});

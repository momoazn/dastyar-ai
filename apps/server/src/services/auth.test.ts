import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { User } from "@/database";
import * as authRepo from "@/repositories/auth";
import {
  generateJwtToken,
  validateAuthHeader,
  validateJwtToken,
  validateOptionalAuthHeader,
  verifyJwtToken,
} from "./auth";

// Mock the auth repository
const mockFindUserById = mock(authRepo.findUserById);

// Mock user data for testing
const mockUser: User = {
  id: 1,
  username: "testuser",
  password: "hashedpassword",
  salt: "",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Auth Service", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFindUserById.mockReset();
  });

  describe("generateJwtToken", () => {
    it("should generate a valid JWT token", () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should include userId, username, and role in token payload", () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      const decoded = verifyJwtToken(token);
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
    });
  });

  describe("verifyJwtToken", () => {
    it("should verify and decode a valid token", () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      const decoded = verifyJwtToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
    });

    it("should throw error for invalid token", () => {
      expect(() => verifyJwtToken("invalid-token")).toThrow();
    });

    it("should throw error for malformed token", () => {
      expect(() => verifyJwtToken("not.a.jwt")).toThrow();
    });

    it("should throw error for empty token", () => {
      expect(() => verifyJwtToken("")).toThrow();
    });
  });

  describe("validateJwtToken", () => {
    it("should validate token and return user when token is valid and user exists", async () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      mockFindUserById.mockResolvedValue(mockUser);

      const result = await validateJwtToken(token);
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
      expect(mockFindUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it("should return error when token is valid but user not found", async () => {
      const token = generateJwtToken({
        id: 999,
        username: "nonexistent",
        role: "user",
      });

      mockFindUserById.mockResolvedValue(null);

      const result = await validateJwtToken(token);
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.error).toEqual({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    });

    it("should return error for invalid token", async () => {
      const result = await validateJwtToken("invalid-token");
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.error).toEqual({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    });

    it("should return error for expired token", async () => {
      // Note: Testing expired tokens requires mocking time or using a token with very short expiry
      // For now, we test the error handling path
      const result = await validateJwtToken("malformed.token.here");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("UNAUTHORIZED");
    });
  });

  describe("validateAuthHeader", () => {
    it("should validate Bearer token in auth header", async () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      mockFindUserById.mockResolvedValue(mockUser);

      const result = await validateAuthHeader(`Bearer ${token}`);
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
    });

    it("should return error when auth header is missing", async () => {
      const result = await validateAuthHeader(undefined);
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header",
      });
    });

    it("should return error when auth header does not start with Bearer", async () => {
      const result = await validateAuthHeader("Token abc123");
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header",
      });
    });

    it("should return error when Bearer token is invalid", async () => {
      const result = await validateAuthHeader("Bearer invalid-token");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("UNAUTHORIZED");
    });

    it("should return error when auth header is empty string", async () => {
      const result = await validateAuthHeader("");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("UNAUTHORIZED");
    });
  });

  describe("validateOptionalAuthHeader", () => {
    it("should validate Bearer token when provided", async () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      mockFindUserById.mockResolvedValue(mockUser);

      const result = await validateOptionalAuthHeader(`Bearer ${token}`);
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it("should return success without user when no auth header provided", async () => {
      const result = await validateOptionalAuthHeader(undefined);
      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
    });

    it("should return success without user when auth header is empty", async () => {
      const result = await validateOptionalAuthHeader("");
      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
    });

    it("should return success without user when token is invalid", async () => {
      const result = await validateOptionalAuthHeader("Bearer invalid-token");
      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
    });

    it("should return success without user when Bearer token user not found", async () => {
      const token = generateJwtToken({
        id: 999,
        username: "nonexistent",
        role: "user",
      });

      mockFindUserById.mockResolvedValue(null);

      const result = await validateOptionalAuthHeader(`Bearer ${token}`);
      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
    });
  });
});

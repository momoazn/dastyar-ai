import { beforeEach, describe, expect, it, mock } from "bun:test";
import jwt from "jsonwebtoken";
import { env } from "@/config";
import type { User } from "@/database";
import {
  generateJwtToken,
  validateAuthHeader,
  validateJwtToken,
  validateOptionalAuthHeader,
  verifyJwtToken,
} from "./auth";

// Mock user data for testing
const mockUser: User = {
  id: 1,
  username: "testuser",
  password: "hashedpassword",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Auth Service", () => {
  const mockFindUserById = mock(
    async (_id: number): Promise<User | null> => mockUser
  );

  beforeEach(() => {
    mockFindUserById.mockReset();
    mockFindUserById.mockImplementation(async () => mockUser);
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

    it("should respect custom expiresIn option", () => {
      const token = generateJwtToken(
        {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
        7200
      );

      const decoded = jwt.decode(token) as { exp: number; iat: number };
      expect(decoded.exp - decoded.iat).toBe(7200);
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

  describe("algorithm pinning", () => {
    it("rejects a token signed with another HMAC algorithm", () => {
      const token = jwt.sign(
        { userId: 1, username: "a", role: "admin" },
        env.JWT_SECRET,
        {
          algorithm: "HS512",
        }
      );
      expect(() => verifyJwtToken(token)).toThrow();
    });

    it("rejects an unsigned token", () => {
      const token = jwt.sign({ userId: 1, username: "a", role: "admin" }, "", {
        algorithm: "none",
      });
      expect(() => verifyJwtToken(token)).toThrow();
    });

    it("signs with HS256", () => {
      const token = generateJwtToken({ id: 1, username: "a", role: "user" });
      expect(jwt.decode(token, { complete: true })?.header.alg).toBe("HS256");
    });
  });

  describe("validateJwtToken", () => {
    it("should validate token and return user when token is valid and user exists", async () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      const result = await validateJwtToken(token, mockFindUserById);
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(mockUser.id);
      expect(result.error).toBeUndefined();
    });

    it("should return error when token is valid but user not found", async () => {
      const token = generateJwtToken({
        id: 999,
        username: "nonexistent",
        role: "user",
      });

      mockFindUserById.mockImplementation(async () => null);

      const result = await validateJwtToken(token, mockFindUserById);
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.error).toEqual({
        code: "USER_NOT_FOUND",
        message: "کاربر یافت نشد. لطفاً دوباره وارد شوید.",
      });
    });

    it("should return error for invalid token", async () => {
      const result = await validateJwtToken("invalid-token");
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.error).toEqual({
        code: "INVALID_TOKEN",
        message: "توکن نامعتبر است. لطفاً دوباره وارد شوید.",
      });
    });

    it("should return error for expired token", async () => {
      const expiredToken = jwt.sign(
        {
          userId: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
        env.JWT_SECRET,
        { expiresIn: -1 }
      );
      const result = await validateJwtToken(expiredToken);
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: "TOKEN_EXPIRED",
        message: "توکن منقضی شده است. لطفاً دوباره وارد شوید.",
      });
    });
  });

  describe("validateAuthHeader", () => {
    it("should validate Bearer token in auth header", async () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      const result = await validateAuthHeader(
        `Bearer ${token}`,
        mockFindUserById
      );
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(mockUser.id);
      expect(result.error).toBeUndefined();
    });

    it("should return error when auth header is missing", async () => {
      const result = await validateAuthHeader(undefined);
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: "MISSING_AUTH_HEADER",
        message: "هدر احراز هویت نامعتبر است.",
      });
    });

    it("should return error when auth header does not start with Bearer", async () => {
      const result = await validateAuthHeader("Token abc123");
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: "MISSING_AUTH_HEADER",
        message: "هدر احراز هویت نامعتبر است.",
      });
    });

    it("should return error when Bearer token is invalid", async () => {
      const result = await validateAuthHeader("Bearer invalid-token");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_TOKEN");
    });

    it("should return error when auth header is empty string", async () => {
      const result = await validateAuthHeader("");
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("MISSING_AUTH_HEADER");
    });
  });

  describe("validateOptionalAuthHeader", () => {
    it("should validate Bearer token when provided", async () => {
      const token = generateJwtToken({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      const result = await validateOptionalAuthHeader(
        `Bearer ${token}`,
        mockFindUserById
      );
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(mockUser.id);
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

      mockFindUserById.mockImplementation(async () => null);

      const result = await validateOptionalAuthHeader(
        `Bearer ${token}`,
        mockFindUserById
      );
      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
    });
  });
});

import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { db, initializeDatabase, users } from "@/database";
import {
  createUser,
  findUserById,
  findUserByUsername,
  hashPassword,
  UsernameTakenError,
  updateUsername,
  updateUserPassword,
  usernameExists,
  verifyUserCredentials,
  WrongPasswordError,
} from "./auth";

// Helper function to clean up test data
async function cleanupTestUsers() {
  try {
    await db.delete(users);
  } catch {
    // Ignore errors during cleanup
  }
}

describe("createUser unique constraint", () => {
  it("maps a duplicate username to UsernameTakenError", async () => {
    await initializeDatabase();
    await db.delete(users);
    const password = await hashPassword("password123");
    await createUser({ username: "dupuser", password, role: "user" });
    await expect(
      createUser({ username: "dupuser", password, role: "user" })
    ).rejects.toBeInstanceOf(UsernameTakenError);
  });
});

describe("Auth Repository", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestUsers();
  });

  describe("hashPassword", () => {
    it("should hash password", async () => {
      const password = "mysecretpassword";
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it("should generate different hashes for same password", async () => {
      const password = "samepassword";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt uses random salt
    });

    it("should handle empty password", async () => {
      const hashed = await hashPassword("");
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
    });
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const hashedPassword = await hashPassword("password123");
      const user = await createUser({
        username: "newuser",
        password: hashedPassword,
        role: "user",
      });

      expect(user).toBeDefined();
      expect(user.id).toBeGreaterThan(0);
      expect(user.username).toBe("newuser");
      expect(user.password).toBe(hashedPassword);
      expect(user.role).toBe("user");
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("should create admin user", async () => {
      const hashedPassword = await hashPassword("adminpass");
      const user = await createUser({
        username: "adminuser",
        password: hashedPassword,
        role: "admin",
      });

      expect(user.role).toBe("admin");
    });

    it("should throw error when creating duplicate username", async () => {
      const hashedPassword = await hashPassword("password123");
      await createUser({
        username: "duplicate",
        password: hashedPassword,
        role: "user",
      });

      // Attempting to create another user with same username should fail
      await expect(
        createUser({
          username: "duplicate",
          password: hashedPassword,
          role: "user",
        })
      ).rejects.toThrow();
    });
  });

  describe("findUserByUsername", () => {
    it("should find existing user by username", async () => {
      const hashedPassword = await hashPassword("password123");
      const created = await createUser({
        username: "findme",
        password: hashedPassword,
        role: "user",
      });

      const found = await findUserByUsername("findme");
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.username).toBe("findme");
    });

    it("should return null for non-existent username", async () => {
      const found = await findUserByUsername("nonexistent");
      expect(found).toBeNull();
    });

    it("should be case-sensitive", async () => {
      const hashedPassword = await hashPassword("password123");
      await createUser({
        username: "CaseSensitive",
        password: hashedPassword,
        role: "user",
      });

      const found = await findUserByUsername("casesensitive");
      expect(found).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("should find existing user by id", async () => {
      const hashedPassword = await hashPassword("password123");
      const created = await createUser({
        username: "findbyid",
        password: hashedPassword,
        role: "user",
      });

      const found = await findUserById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.username).toBe("findbyid");
    });

    it("should return null for non-existent id", async () => {
      const found = await findUserById(99_999);
      expect(found).toBeNull();
    });
  });

  describe("usernameExists", () => {
    it("should return true for existing username", async () => {
      const hashedPassword = await hashPassword("password123");
      await createUser({
        username: "existinguser",
        password: hashedPassword,
        role: "user",
      });

      const exists = await usernameExists("existinguser");
      expect(exists).toBe(true);
    });

    it("should return false for non-existent username", async () => {
      const exists = await usernameExists("doesnotexist");
      expect(exists).toBe(false);
    });

    it("should be case-sensitive", async () => {
      const hashedPassword = await hashPassword("password123");
      await createUser({
        username: "TestUser",
        password: hashedPassword,
        role: "user",
      });

      const exists = await usernameExists("testuser");
      expect(exists).toBe(false);
    });
  });

  describe("verifyUserCredentials", () => {
    it("should verify correct credentials", async () => {
      const password = "correctpassword";
      const hashedPassword = await hashPassword(password);
      await createUser({
        username: "verifyuser",
        password: hashedPassword,
        role: "user",
      });

      const user = await verifyUserCredentials({
        username: "verifyuser",
        password,
      });

      expect(user).toBeDefined();
      expect(user?.username).toBe("verifyuser");
    });

    it("should return null for incorrect password", async () => {
      const hashedPassword = await hashPassword("correctpassword");
      await createUser({
        username: "verifyuser2",
        password: hashedPassword,
        role: "user",
      });

      const user = await verifyUserCredentials({
        username: "verifyuser2",
        password: "wrongpassword",
      });

      expect(user).toBeNull();
    });

    it("should return null for non-existent username", async () => {
      const user = await verifyUserCredentials({
        username: "nonexistent",
        password: "anypassword",
      });

      expect(user).toBeNull();
    });

    it("should reject empty password", async () => {
      const hashedPassword = await hashPassword("correctpassword");
      await createUser({
        username: "verifyuser3",
        password: hashedPassword,
        role: "user",
      });

      const user = await verifyUserCredentials({
        username: "verifyuser3",
        password: "",
      });

      expect(user).toBeNull();
    });
  });

  describe("updateUsername", () => {
    it("should update username successfully", async () => {
      const hashedPassword = await hashPassword("password123");
      const user = await createUser({
        username: "oldusername",
        password: hashedPassword,
        role: "user",
      });

      const updated = await updateUsername(user.id, "newusername");
      expect(updated.username).toBe("newusername");
      expect(updated.id).toBe(user.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        user.updatedAt.getTime()
      );
    });

    it("should throw error when new username already exists", async () => {
      const hashedPassword = await hashPassword("password123");
      await createUser({
        username: "existing",
        password: hashedPassword,
        role: "user",
      });

      const user2 = await createUser({
        username: "user2",
        password: hashedPassword,
        role: "user",
      });

      await expect(updateUsername(user2.id, "existing")).rejects.toBeInstanceOf(
        UsernameTakenError
      );
    });

    it("should allow updating to same username", async () => {
      const hashedPassword = await hashPassword("password123");
      const user = await createUser({
        username: "sameuser",
        password: hashedPassword,
        role: "user",
      });

      // Should not throw error
      const updated = await updateUsername(user.id, "sameuser");
      expect(updated.username).toBe("sameuser");
    });

    it("should throw error for non-existent user", async () => {
      await expect(updateUsername(99_999, "newname")).rejects.toThrow(
        "به‌روزرسانی کد ملی ناموفق بود."
      );
    });
  });

  describe("updateUserPassword", () => {
    it("should update password successfully", async () => {
      const oldPassword = "oldpassword123";
      const newPassword = "newpassword456";
      const hashedPassword = await hashPassword(oldPassword);

      const user = await createUser({
        username: "passworduser",
        password: hashedPassword,
        role: "user",
      });

      await updateUserPassword(user.id, oldPassword, newPassword);

      // Verify old password no longer works
      const verifyOld = await verifyUserCredentials({
        username: "passworduser",
        password: oldPassword,
      });
      expect(verifyOld).toBeNull();

      // Verify new password works
      const verifyNew = await verifyUserCredentials({
        username: "passworduser",
        password: newPassword,
      });
      expect(verifyNew).toBeDefined();
      expect(verifyNew?.username).toBe("passworduser");
    });

    it("should throw error when current password is incorrect", async () => {
      const password = "correctpassword";
      const hashedPassword = await hashPassword(password);

      const user = await createUser({
        username: "passworduser2",
        password: hashedPassword,
        role: "user",
      });

      await expect(
        updateUserPassword(user.id, "wrongpassword", "newpassword")
      ).rejects.toBeInstanceOf(WrongPasswordError);
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        updateUserPassword(99_999, "oldpass", "newpass")
      ).rejects.toThrow("کاربر یافت نشد.");
    });

    it("should allow setting same password", async () => {
      const password = "samepassword";
      const hashedPassword = await hashPassword(password);

      const user = await createUser({
        username: "passworduser3",
        password: hashedPassword,
        role: "user",
      });

      // Should not throw error
      await updateUserPassword(user.id, password, password);

      // Verify password still works
      const verified = await verifyUserCredentials({
        username: "passworduser3",
        password,
      });
      expect(verified).toBeDefined();
    });
  });
});

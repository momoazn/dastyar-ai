import { z } from "zod";
import type { User } from "@/database";
import {
  createUser,
  generateSalt,
  hashPassword,
  usernameExists,
  verifyUserCredentials,
} from "@/repositories/auth";
import { generateJwtToken } from "@/services/auth";
import { publicProcedure } from "./base";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const authProcedures = {
  register: publicProcedure.input(registerSchema).handler(async ({ input }) => {
    const { username, password } = input;

    console.debug(
      `[auth.register] Registration attempt for username: ${username}`
    );

    // Check if user already exists
    const userExists = await usernameExists(username);

    console.debug(
      `[auth.register] User existence check for "${username}": ${userExists ? "EXISTS" : "NOT FOUND"}`
    );

    if (userExists) {
      console.warn(
        `[auth.register] Registration failed: username "${username}" already exists`
      );
      throw new Error("Username already exists");
    }

    const salt = await generateSalt(12);
    console.debug(`[auth.register] Salt generated for "${username}"`);
    const hashedPassword = await hashPassword(password, salt);
    console.debug(`[auth.register] Password hashed for "${username}"`);

    let user: User;
    try {
      console.debug(`[auth.register] Attempting to create user "${username}"`);
      user = await createUser({
        username,
        password: hashedPassword,
        salt,
        role: "user",
      });
      console.debug(
        `[auth.register] User successfully created for username: "${username}"`
      );
    } catch (error) {
      console.error(
        `[auth.register] Failed to create user "${username}":`,
        error
      );
      throw new Error("Failed to register user. Please try again.");
    }

    console.debug(
      `[auth.register] User created: id=${user.id}, username=${user.username}`
    );

    // Generate JWT
    const token = generateJwtToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    console.debug(`[auth.register] JWT generated for "${username}"`);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }),

  login: publicProcedure.input(loginSchema).handler(async ({ input }) => {
    const { username, password } = input;

    console.debug(`[auth.login] Login attempt for username: ${username}`);

    const user = await verifyUserCredentials({ username, password });

    console.debug(
      `[auth.login] User lookup for "${username}": ${user ? "FOUND" : "NOT FOUND"}`
    );

    if (!user) {
      console.warn(
        `[auth.login] Invalid credentials: user "${username}" not found or password mismatch`
      );
      throw new Error("Invalid credentials");
    }

    console.debug(
      `[auth.login] Password verification for "${username}": SUCCESS`
    );

    const token = generateJwtToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    console.debug(`[auth.login] JWT generated for "${username}"`);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }),

  me: publicProcedure.handler(({ context }) => {
    console.debug("[auth.me] Me handler invoked");

    if (!context.user) {
      console.warn("[auth.me] Not authenticated - no user in context");
      throw new Error("Not authenticated");
    }

    console.debug(
      `[auth.me] Authenticated as user: id=${context.user.id}, username=${context.user.username}, role=${context.user.role}`
    );

    return {
      id: context.user.id,
      username: context.user.username,
      role: context.user.role,
    };
  }),
};

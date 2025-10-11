import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config';
import { publicProcedure } from './base';

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const authProcedures = {
  register: publicProcedure
    .input(registerSchema)
    .handler(async ({ input, context }) => {
      const { username, password } = input;

      // Check if user already exists
      const existingUser = await context.db.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await context.db.user.create({
        data: {
          username,
          passwordHash,
        },
      });

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .handler(async ({ input, context }) => {
      const { username, password } = input;

      // Find user
      const user = await context.db.user.findUnique({
        where: { username },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

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
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    return {
      id: context.user.id,
      username: context.user.username,
      role: context.user.role,
    };
  }),
};

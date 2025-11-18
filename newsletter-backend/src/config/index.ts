import path from "path";
import { z } from "zod";
import dotenv from "dotenv";
// Load .env from the project root (server/.env)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const Env = z.object({
  PORT: z.coerce.number().default(3001),

  // Required at runtime for Prisma to connect
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),

});

export const config = Env.parse(process.env);
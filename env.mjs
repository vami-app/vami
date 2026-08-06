import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema.
   * This ensures the app crashes at build/startup if variables are missing.
   */
  server: {
    MONGODB_URI: z.string().url(),
    JWT_SECRET: z.string().min(16),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    CLOUDINARY_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  /**
   * Client-side environment variables schema.
   * Prefix with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  },

  /**
   * Destructure process.env manually.
   * Next.js requires this due to how edge runtimes bundle variables.
   */
  runtimeEnv: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  
  // By default, skip validation during CI tests if variables aren't set
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  
  // Don't treat empty strings as valid
  emptyStringAsUndefined: true,
});

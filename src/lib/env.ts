import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth.js
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),

  // Magic links
  MAGIC_LINK_SECRET: z.string().min(32),

  // Mandrill
  MANDRILL_API_KEY: z.string().min(1),
  MANDRILL_SENDER_EMAIL: z.string().email(),
  MANDRILL_SENDER_NAME: z.string().min(1),

  // Cron
  CRON_SECRET: z.string().min(16),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().min(1),

  // Analytics & monitoring (optional in dev)
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Admin
  ADMIN_NOTIFICATION_EMAIL: z.string().email(),

  // Node env
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

// Skip validation in test and during Next.js static build (no .env.local needed at build time)
const isTest = process.env['NODE_ENV'] === 'test'
const isBuild = process.env['NEXT_PHASE'] === 'phase-production-build'
const skip = isTest || isBuild

const parsed = skip ? envSchema.partial().safeParse(process.env) : envSchema.safeParse(process.env)

if (!parsed.success && !skip) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables — check your .env.local file')
}

export const env = (parsed.success ? parsed.data : {}) as z.infer<typeof envSchema>

import { z } from 'zod'

// P6: admin action schemas
export const adminLoginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export type AdminLoginData = z.infer<typeof adminLoginSchema>

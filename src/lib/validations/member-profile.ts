import { z } from 'zod'

export const memberProfileSchema = z.object({
  description: z.string().max(1000, '1000 caractères max.').optional().or(z.literal('')),
  websiteUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  linkedinUrl: z.string().url('URL LinkedIn invalide').optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  yearFounded: z
    .number({ error: 'Année invalide' })
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  employeeCount: z.number({ error: 'Nombre invalide' }).int().min(0).optional(),
  logoUrl: z.string().url('URL logo invalide').optional().or(z.literal('')),
  activityDomains: z.array(z.string()).min(1, "Sélectionnez au moins un domaine d'activité"),
  certifications: z.array(z.string()),
  certificationOtherLabel: z.string().max(200).optional().or(z.literal('')),
})

export type MemberProfileData = z.infer<typeof memberProfileSchema>

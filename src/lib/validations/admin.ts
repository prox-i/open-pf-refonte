import { z } from 'zod'
import { memberProfileSchema } from '@/lib/validations/member-profile'

// Édition d'une fiche adhérent depuis le back-office : mêmes champs que la fiche
// (magic-link) + le nom, éditable par l'admin.
export const adminMemberEditSchema = memberProfileSchema.extend({
  name: z.string().trim().min(2, 'Nom requis').max(200),
})

export type AdminMemberEditData = z.infer<typeof adminMemberEditSchema>

// P6: admin action schemas
export const adminLoginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1),
})

export type AdminLoginData = z.infer<typeof adminLoginSchema>

// Réglages du site (rubrique « Réglages » du back-office)
export const siteSettingsSchema = z.object({
  contactRecipientEmail: z.string().email('Email destinataire invalide'),
  publicEmail: z.string().email('Email public invalide'),
  publicAddress: z.string().min(1, 'Adresse requise'),
  publicHours: z.string().min(1, 'Horaires requis'),
  facebookUrl: z.string().url('URL invalide').or(z.literal('')),
  linkedinUrl: z.string().url('URL invalide').or(z.literal('')),
})

export type SiteSettingsData = z.infer<typeof siteSettingsSchema>

// Événement d'agenda (rubrique « Agenda » du back-office)
export const agendaEventSchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(200, 'Titre trop long'),
  description: z.string().max(500, '500 caractères max.').optional().or(z.literal('')),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date requise'),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Heure invalide (HH:MM)')
    .optional()
    .or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  detailUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  isExternalUrl: z.boolean(),
  isPublished: z.boolean(),
  showOnHome: z.boolean(),
  sortOrder: z.number().int().min(0),
})

export type AgendaEventData = z.infer<typeof agendaEventSchema>

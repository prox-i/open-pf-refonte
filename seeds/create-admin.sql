-- Compte administrateur OPEN PF
-- Identifiant : Open2026
-- Mot de passe : Open2026
--
-- Exécuter une seule fois sur la DB (Drizzle Studio, psql, ou Neon console)
-- Après migration : pnpm exec drizzle-kit migrate

INSERT INTO admin_users (id, email, password_hash, name, is_active)
VALUES (
  gen_random_uuid(),
  'Open2026',
  '$2b$10$IBwCV2FyhMaczM6P/tB7luj0LqHW18z0OMtKxrh4tVgjh0al7ph5y',
  'Admin OPEN PF',
  true
)
ON CONFLICT (email) DO NOTHING;

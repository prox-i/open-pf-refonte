import Link from 'next/link'
import { MemberLogo } from '@/components/public/member-logo'
import { ArrowIcon } from '@/components/public/arrow-icon'

interface MemberContactCardProps {
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  linkedinUrl: string | null
  address: string | null
  primaryContact: {
    name: string
    role: string | null
    email: string | null
    phone: string | null
  } | null
}

export function MemberContactCard({
  name,
  logoUrl,
  websiteUrl,
  linkedinUrl,
  address,
  primaryContact,
}: MemberContactCardProps) {
  const websiteDisplay = websiteUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <aside className="member-profile-side contact-card">
      {/* Logo zone */}
      <div className="profile-logo-zone">
        <MemberLogo
          name={name}
          logoUrl={logoUrl}
          sizes="(max-width:980px) 80vw, 280px"
          priority
        />
      </div>

      {/* Contact list */}
      <div className="profile-contact-list">
        {primaryContact && (
          <div className="profile-contact-item">
            <span className="profile-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.3 0-8 2.7-8 4v1h16v-1c0-1.3-2.7-4-8-4z"
                />
              </svg>
            </span>
            <div>
              <span className="profile-contact-label">Contact</span>
              <span className="profile-contact-value">
                {primaryContact.name}
                {primaryContact.role && (
                  <span className="contact-role">{primaryContact.role}</span>
                )}
              </span>
            </div>
          </div>
        )}

        {address && (
          <div className="profile-contact-item">
            <span className="profile-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
                />
              </svg>
            </span>
            <div>
              <span className="profile-contact-label">Adresse</span>
              <span className="profile-contact-value">{address}</span>
            </div>
          </div>
        )}

        {primaryContact?.email && (
          <div className="profile-contact-item">
            <span className="profile-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
                />
              </svg>
            </span>
            <div>
              <span className="profile-contact-label">Email</span>
              <span className="profile-contact-value">
                <a href={`mailto:${primaryContact.email}`}>{primaryContact.email}</a>
              </span>
            </div>
          </div>
        )}

        {primaryContact?.phone && (
          <div className="profile-contact-item">
            <span className="profile-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
                />
              </svg>
            </span>
            <div>
              <span className="profile-contact-label">Téléphone</span>
              <span className="profile-contact-value">
                <a href={`tel:${primaryContact.phone}`}>{primaryContact.phone}</a>
              </span>
            </div>
          </div>
        )}

        {websiteUrl && (
          <div className="profile-contact-item">
            <span className="profile-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1 17.93V18a1 1 0 0 0-1-1H8a3 3 0 0 1-3-3v-1l5 5v-.07zM17.9 15a3 3 0 0 0-1.7-.9l-1.2-.2a1 1 0 0 1-.8-.6l-.3-.7a1 1 0 0 1 .3-1.1l1.5-1.3a1 1 0 0 0 .3-.9l-.2-.7A8 8 0 0 0 12 4v1a1 1 0 0 0 1 1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a3 3 0 0 0-3 3v1a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v2.59A8 8 0 0 0 17.9 15z"
                />
              </svg>
            </span>
            <div>
              <span className="profile-contact-label">Site web</span>
              <span className="profile-contact-value">
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  {websiteDisplay}
                </a>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions : LinkedIn + CTA regroupés pour éviter le vide visuel */}
      <div className="profile-actions">
        {linkedinUrl && (
          <a
            className="contact-social-btn"
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} sur LinkedIn`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z"
              />
            </svg>
            LinkedIn
          </a>
        )}
        {websiteUrl ? (
          <a className="btn profile-cta-btn" href={websiteUrl} target="_blank" rel="noopener noreferrer">
            Visiter le site <ArrowIcon />
          </a>
        ) : (
          <Link className="btn btn-secondary profile-cta-btn" href="/contact">
            Nous contacter <ArrowIcon />
          </Link>
        )}
      </div>
    </aside>
  )
}

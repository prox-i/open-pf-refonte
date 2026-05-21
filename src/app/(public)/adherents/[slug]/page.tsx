import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/public/cta-band'
import { MEMBERS } from '@/lib/data/members'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return MEMBERS.map((m) => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const member = MEMBERS.find((m) => m.slug === slug)
  if (!member) return {}
  return {
    title: `${member.name} – Adhérent OPEN PF`,
    description: member.description ?? `${member.name} est membre du réseau OPEN PF.`,
  }
}

export default async function MemberPage({ params }: Props) {
  const { slug } = await params
  const member = MEMBERS.find((m) => m.slug === slug)
  if (!member) notFound()

  return (
    <>
      <section className="hero hero-simple">
        <div className="hero-inner container">
          <div>
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link> › <Link href="/adherents">Adhérents</Link> ›{' '}
              {member.name}
            </nav>
            <h1 style={{ color: 'white', marginTop: '8px' }}>{member.name}</h1>
            {member.description && (
              <p className="lead" style={{ marginTop: '20px' }}>
                {member.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '860px' }}>
          <div
            className="card"
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              gap: '36px',
              alignItems: 'center',
            }}
          >
            <div className="logo-card" style={{ height: '120px' }}>
              {member.logoUrl ? (
                <Image
                  src={member.logoUrl}
                  alt={`Logo ${member.name}`}
                  width={160}
                  height={100}
                  style={{ objectFit: 'contain', maxHeight: '100px' }}
                  unoptimized
                />
              ) : (
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: 'var(--navy)',
                    textAlign: 'center',
                  }}
                >
                  {member.name}
                </span>
              )}
            </div>
            <div>
              <h2>{member.name}</h2>
              {member.description && <p style={{ marginTop: '14px' }}>{member.description}</p>}
              <p style={{ marginTop: '14px', color: 'var(--muted)', fontSize: '14px' }}>
                Membre actif du réseau OPEN Polynésie française
              </p>
            </div>
          </div>

          <div style={{ marginTop: '28px' }}>
            <Link href="/adherents" className="btn btn-secondary">
              ← Retour à l&apos;annuaire
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}

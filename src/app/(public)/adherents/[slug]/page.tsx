import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/public/cta-band'
import { MemberProfileHero } from '@/components/annuaire/member-profile-hero'
import { MemberContactCard } from '@/components/annuaire/member-contact-card'
import { MemberDomainsCard } from '@/components/annuaire/member-domains-card'
import { MemberPresentationCard } from '@/components/annuaire/member-presentation-card'
import { RelatedMembers } from '@/components/annuaire/related-members'
import {
  getMemberBySlug,
  getMemberContacts,
  getMemberDomains,
  getOtherActiveMembers,
} from '@/lib/db/queries/members'
import { getDailySeed } from '@/lib/random/seeded-shuffle'
import { buildBreadcrumbJsonLd, buildMemberJsonLd } from '@/lib/seo'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const member = await getMemberBySlug(slug)
  if (!member) return {}
  const desc =
    member.description ??
    `${member.name} est membre actif du réseau OPEN en Polynésie française.`
  const ogImage = member.logoUrl ?? '/logo-open.png'
  return {
    title: { absolute: `${member.name} – Adhérent OPEN PF` },
    description: desc.slice(0, 160),
    alternates: { canonical: `/adherents/${slug}` },
    openGraph: {
      title: `${member.name} – Adhérent OPEN PF`,
      description: desc.slice(0, 155),
      type: 'profile',
      url: `/adherents/${slug}`,
      images: [{ url: ogImage, alt: member.name }],
    },
    twitter: { card: 'summary_large_image', images: [ogImage] },
  }
}

export default async function MemberPage({ params }: Props) {
  const { slug } = await params
  const [member, otherMembers] = await Promise.all([
    getMemberBySlug(slug),
    getOtherActiveMembers(slug, 3, { seed: getDailySeed() }),
  ])
  if (!member) notFound()

  const [domains, contacts] = await Promise.all([
    getMemberDomains(member.id),
    getMemberContacts(member.id),
  ])

  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Accueil', href: '/' },
    { name: 'Adhérents', href: '/adherents' },
    { name: member.name, href: `/adherents/${slug}` },
  ])
  const memberJsonLd = buildMemberJsonLd(member)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(memberJsonLd) }}
      />

      <MemberProfileHero name={member.name} slug={slug} domains={domains} />

      <section className="section bg-soft" style={{ paddingTop: '40px' }}>
        <div className="container">
          <div className="member-profile-layout">
            <MemberContactCard
              name={member.name}
              logoUrl={member.logoUrl ?? null}
              websiteUrl={member.websiteUrl ?? null}
              linkedinUrl={member.linkedinUrl ?? null}
              address={member.address ?? null}
              primaryContact={primaryContact}
            />
            <div className="member-profile-main">
              {domains.length > 0 && <MemberDomainsCard domains={domains} />}
              <MemberPresentationCard
                name={member.name}
                description={member.description ?? null}
                yearFounded={member.yearFounded ?? null}
                employeeCount={member.employeeCount ?? null}
                isMedefMember={member.isMedefMember ?? false}
              />
            </div>
          </div>
        </div>
      </section>

      {otherMembers.length > 0 && <RelatedMembers members={otherMembers} />}

      <CtaBand />
    </>
  )
}

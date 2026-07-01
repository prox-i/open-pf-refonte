'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
  badge?: number
}

interface AdminSidebarProps {
  userName: string
  pendingCount: number
}

export function AdminSidebar({ userName, pendingCount }: AdminSidebarProps) {
  const pathname = usePathname()

  // BO-012 : « Demandes d'adhésion » et « Fiches à valider » pointaient sur la
  // même finalité → on ne garde qu'une seule entrée (Demandes d'adhésion).
  const navItems: NavItem[] = [
    { href: '/admin', label: "Vue d'ensemble" },
    { href: '/admin/demandes', label: "Demandes d'adhésion", badge: pendingCount },
    { href: '/admin/adherents', label: 'Adhérents' },
    { href: '/admin/actualites', label: 'Actualités' },
    { href: '/admin/agenda', label: 'Agenda' },
    { href: '/admin/offres-emploi', label: "Offres d'emploi" },
    { href: '/admin/relances', label: 'Relances' },
    { href: '/admin/contenu', label: 'Contenu du site' },
    { href: '/admin/reglages', label: 'Réglages' },
  ]

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="admin-sidebar">
      {/* BO-017 : le logo renvoie vers la home du BO. Logo identique au front public. */}
      <Link href="/admin" className="brand admin-brand" aria-label="Back-office OPEN, accueil">
        <Image
          src="/logo-open.png"
          alt="OPEN"
          width={97}
          height={44}
          className="admin-brand-logo"
          style={{ height: '40px', width: 'auto' }}
        />
        <span>
          <span className="brand-sub">
            Back-office
            <br />
            Organisation des Professionnels
          </span>
        </span>
      </Link>

      <nav className="admin-nav" aria-label="Administration">
        <ul className="admin-menu">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={isActive(item.href) ? 'active' : ''}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="badge">{item.badge}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-sidebar-footer">
        <span className="admin-user">{userName}</span>
        <button
          type="button"
          className="btn-signout"
          onClick={() => signOut({ redirectTo: '/admin/login' })}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

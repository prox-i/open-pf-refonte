import Link from 'next/link'

interface Domain {
  id: string
  label: string
}

interface MemberFiltersProps {
  domains: Domain[]
  activeId?: string | undefined
  q?: string | undefined
}

export function MemberFilters({ domains, activeId, q }: MemberFiltersProps) {
  if (domains.length === 0) return null

  const allHref = q ? `/adherents?q=${encodeURIComponent(q)}` : '/adherents'

  // Note: ces chips sont des <a>/<Link> (role=link), pas des boutons toggle.
  // `aria-pressed` n'est PAS autorisé sur role=link (axe critical) — on utilise
  // uniquement `aria-current="page"` pour indiquer le filtre actif, conforme WAI-ARIA.
  return (
    <div className="directory-filters-wrap">
      <div className="filters" role="group" aria-label="Filtrer par domaine d'activité">
        <Link
          href={allHref}
          scroll={false}
          className={`filter-chip light${!activeId ? ' active' : ''}`}
          {...(!activeId ? { 'aria-current': 'page' as const } : {})}
        >
          Tous les domaines
        </Link>
        {domains.map((d) => {
          const params = new URLSearchParams()
          if (q) params.set('q', q)
          params.set('domaine', d.id)
          const isActive = activeId === d.id
          return (
            <Link
              key={d.id}
              href={`/adherents?${params.toString()}`}
              scroll={false}
              className={`filter-chip light${isActive ? ' active' : ''}`}
              {...(isActive ? { 'aria-current': 'page' as const } : {})}
            >
              {d.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

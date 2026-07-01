import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgendaEventItem } from '@/components/public/agenda-event-item'

const BASE = {
  id: '1',
  slug: 'assemblee-generale',
  title: 'Assemblée générale ordinaire',
  description: 'Bilan, gouvernance et perspectives.',
  eventDate: '2026-07-04',
  startTime: null,
  detailUrl: null,
  isExternalUrl: false,
  hasContent: false,
}

describe('AgendaEventItem', () => {
  it('affiche le titre et la date formatée', () => {
    render(<AgendaEventItem event={BASE} />)
    expect(screen.getByRole('heading', { name: 'Assemblée générale ordinaire' })).toBeInTheDocument()
    expect(screen.getByText(/JUIL\./)).toBeInTheDocument()
  })

  it('n’affiche PAS « Voir plus » sans detailUrl', () => {
    render(<AgendaEventItem event={BASE} />)
    expect(screen.queryByText(/Voir plus/)).not.toBeInTheDocument()
  })

  it('affiche « Voir plus » avec un detailUrl', () => {
    render(<AgendaEventItem event={{ ...BASE, detailUrl: '/actualites/ag-2026' }} />)
    const link = screen.getByRole('link', { name: /Voir plus/ })
    expect(link).toHaveAttribute('href', '/actualites/ag-2026')
  })

  it('pointe vers la page de détail interne si l’événement a du contenu', () => {
    render(<AgendaEventItem event={{ ...BASE, hasContent: true }} />)
    const link = screen.getByRole('link', { name: /Voir plus/ })
    expect(link).toHaveAttribute('href', '/agenda/assemblee-generale')
    expect(link).not.toHaveAttribute('target')
  })

  it('ouvre dans un nouvel onglet si lien externe', () => {
    render(
      <AgendaEventItem
        event={{ ...BASE, detailUrl: 'https://open.pf', isExternalUrl: true }}
      />,
    )
    const link = screen.getByRole('link', { name: /Voir plus/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

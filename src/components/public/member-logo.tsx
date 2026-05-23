import Image from 'next/image'

const PALETTE = [
  { bg: '#fff1f8', fg: '#c0006a' },
  { bg: '#eff3ff', fg: '#0057d8' },
  { bg: '#f0f9ff', fg: '#0369a1' },
  { bg: '#f0fdf4', fg: '#15803d' },
  { bg: '#fdf4ff', fg: '#7c3aed' },
  { bg: '#fff8f0', fg: '#b45309' },
]

export function colorFor(name: string): { bg: string; fg: string } {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  const idx = h % PALETTE.length
  // PALETTE is non-empty, idx is always in-range — fallback is unreachable
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return PALETTE[idx] ?? PALETTE[0]!
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) return (words[0] ?? '').slice(0, 3).toUpperCase()
  return words
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

interface MemberLogoProps {
  name: string
  logoUrl?: string | null
  sizes?: string
  priority?: boolean
  /** Controls the standalone height. Ignored when a parent context class overrides it. */
  size?: 'sm' | 'md' | 'lg'
}

export function MemberLogo({ name, logoUrl, sizes, priority = false, size }: MemberLogoProps) {
  const sizeClass = size ? `member-logo--${size}` : ''
  const wrapClass = ['member-logo-wrap', sizeClass].filter(Boolean).join(' ')

  if (logoUrl) {
    return (
      <div className={wrapClass}>
        <Image
          src={logoUrl}
          alt={`Logo ${name}`}
          fill
          sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px'}
          style={{ objectFit: 'contain', padding: '20px' }}
          priority={priority}
        />
      </div>
    )
  }

  const { bg, fg } = colorFor(name)
  return (
    <div
      className={`${wrapClass} member-logo-fallback`}
      style={{ background: bg }}
      role="img"
      aria-label={`${name} — logo non disponible`}
    >
      <span style={{ color: fg }} aria-hidden="true">{getInitials(name)}</span>
    </div>
  )
}

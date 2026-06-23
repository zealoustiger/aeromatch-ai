// The ClubHanger aviator — one flat-vector character (leather flying helmet,
// goggles, scarf, bomber jacket) recolored + varied deterministically, the way
// Reddit recolors Snoo. Renders from an explicit `config` (a user's chosen look)
// or a `seed` string (stable per id — used for the seeded seeker profiles and as
// every user's default). Pure SVG, no deps, server-renderable.

export type AviatorConfig = {
  bg: number; skin: number; cap: number; scarf: number; lens: number; expr: number; goggles: number
}

export const AVIATOR = {
  BG: ['#FF8FA3', '#FFB703', '#8ECAE6', '#90BE6D', '#B79CED', '#FF9F1C', '#4EA8DE', '#F4978E', '#52B788', '#EE6C4D'],
  SKIN: ['#F8D5C2', '#F1C5A8', '#E0AC8B', '#C68B63', '#A56A43', '#824D28'],
  CAP: ['#6B4226', '#8B5A2B', '#4E3424', '#5C4033', '#7A4B25', '#3E5C54'],
  SCARF: ['#E63946', '#2A9D8F', '#F4A261', '#457B9D', '#E76F51', '#9B5DE5', '#F15BB5', '#06D6A0', '#FFD166'],
  LENS: ['#BDE0FE', '#A8DADC', '#FFE5A8', '#CDB4DB', '#CFF0CC'],
  EXPR: 3,
  GOGGLES: 2,
}

function darken(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  r = (r * f) | 0; g = (g * f) | 0; b = (b * f) | 0
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

const pick = (h: number, len: number, salt: number) => Math.floor(h / salt) % len

/** Stable config from a seed (id) — the "random per profile, but never changes" default. */
export function aviatorConfigFromSeed(seed: string): AviatorConfig {
  const h = hashStr(seed || 'pilot')
  return {
    bg: pick(h, AVIATOR.BG.length, 1),
    skin: pick(h, AVIATOR.SKIN.length, 7),
    cap: pick(h, AVIATOR.CAP.length, 13),
    scarf: pick(h, AVIATOR.SCARF.length, 29),
    lens: pick(h, AVIATOR.LENS.length, 53),
    expr: pick(h, AVIATOR.EXPR, 101),
    goggles: pick(h, AVIATOR.GOGGLES, 211),
  }
}

/** A fresh random config — used by the client-side picker's shuffle grid. */
export function randomAviatorConfig(): AviatorConfig {
  const r = (n: number) => Math.floor(Math.random() * n)
  return {
    bg: r(AVIATOR.BG.length), skin: r(AVIATOR.SKIN.length), cap: r(AVIATOR.CAP.length),
    scarf: r(AVIATOR.SCARF.length), lens: r(AVIATOR.LENS.length), expr: r(AVIATOR.EXPR), goggles: r(AVIATOR.GOGGLES),
  }
}

const clamp = (i: number, len: number) => ((i % len) + len) % len

export function aviatorSvg(c: AviatorConfig): string {
  const bg = AVIATOR.BG[clamp(c.bg, AVIATOR.BG.length)]
  const skin = AVIATOR.SKIN[clamp(c.skin, AVIATOR.SKIN.length)]
  const cap = AVIATOR.CAP[clamp(c.cap, AVIATOR.CAP.length)]
  const scarf = AVIATOR.SCARF[clamp(c.scarf, AVIATOR.SCARF.length)]
  const lens = AVIATOR.LENS[clamp(c.lens, AVIATOR.LENS.length)]
  const expr = clamp(c.expr, AVIATOR.EXPR)
  const gd = clamp(c.goggles, AVIATOR.GOGGLES) === 1
  const capD = darken(cap, 0.72), capDD = darken(cap, 0.55), scarfD = darken(scarf, 0.78), skinD = darken(skin, 0.86), jacket = darken(cap, 0.92)

  const eyes = gd ? '' : (expr === 2
    ? `<path d="M42 50 Q45 47 48 50" stroke="#2b2b2b" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M52 50 Q55 47 58 50" stroke="#2b2b2b" stroke-width="2" fill="none" stroke-linecap="round"/>`
    : `<circle cx="44" cy="50" r="2.3" fill="#2b2b2b"/><circle cx="56" cy="50" r="2.3" fill="#2b2b2b"/>`)
  const mouth = expr === 1
    ? `<path d="M45 60 Q50 67 55 60 Z" fill="#8a3b3b"/><path d="M46 60.5 Q50 62.5 54 60.5 Z" fill="#fff"/>`
    : `<path d="M45.5 60 Q50 ${expr === 2 ? 64 : 65} 54.5 60" stroke="#2b2b2b" stroke-width="2.1" fill="none" stroke-linecap="round"/>`
  const goggles = gd
    ? `<rect x="29" y="47" width="42" height="4.5" rx="2.25" fill="${capDD}"/><circle cx="44" cy="50" r="6.8" fill="${capDD}"/><circle cx="56" cy="50" r="6.8" fill="${capDD}"/><circle cx="44" cy="50" r="4.4" fill="${lens}"/><circle cx="56" cy="50" r="4.4" fill="${lens}"/><circle cx="42" cy="48" r="1.4" fill="#fff" opacity="0.85"/><circle cx="54" cy="48" r="1.4" fill="#fff" opacity="0.85"/>`
    : `<rect x="29" y="33" width="42" height="4.5" rx="2.25" fill="${capDD}"/><circle cx="40" cy="35.5" r="6.6" fill="${capDD}"/><circle cx="60" cy="35.5" r="6.6" fill="${capDD}"/><circle cx="40" cy="35.5" r="4.3" fill="${lens}"/><circle cx="60" cy="35.5" r="4.3" fill="${lens}"/><circle cx="38" cy="33.5" r="1.4" fill="#fff" opacity="0.85"/><circle cx="58" cy="33.5" r="1.4" fill="#fff" opacity="0.85"/>`

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><clipPath id="ch-av"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#ch-av)">
    <rect width="100" height="100" fill="${bg}"/>
    <path d="M18 101 Q18 82 40 79 L60 79 Q82 82 82 101 Z" fill="${jacket}"/>
    <path d="M33 80 Q50 88 67 80 L64 90 Q50 95 36 90 Z" fill="#ece0c8"/>
    <rect x="42.5" y="62" width="15" height="22" rx="6.5" fill="${skin}"/>
    <ellipse cx="50" cy="68" rx="8.5" ry="3" fill="${skinD}" opacity="0.5"/>
    <path d="M32 80 Q50 90 68 80 L70 98 Q50 91 30 98 Z" fill="${scarf}"/><path d="M63 82 Q83 88 76 107 Q63 100 58 89 Z" fill="${scarfD}"/>
    <path d="M26 54 Q24 27 50 26 Q76 27 74 54 Q74 63 67 67 Q59 71 50 71 Q41 71 33 67 Q26 63 26 54 Z" fill="${cap}"/>
    <circle cx="27" cy="53" r="6.5" fill="${capD}"/><circle cx="73" cy="53" r="6.5" fill="${capD}"/><circle cx="27" cy="53" r="2.2" fill="${capDD}"/><circle cx="73" cy="53" r="2.2" fill="${capDD}"/>
    <ellipse cx="50" cy="54" rx="15.5" ry="17.5" fill="${skin}"/>
    <path d="M34 65 Q50 72 66 65" stroke="${capD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${eyes}${mouth}${goggles}
  </g></svg>`
}

export default function AviatorAvatar({
  seed, config, size = 44, className = '', ring = true,
}: {
  seed?: string
  config?: AviatorConfig | null
  size?: number
  className?: string
  ring?: boolean
}) {
  const cfg = config ?? aviatorConfigFromSeed(seed ?? 'pilot')
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 overflow-hidden rounded-full ${ring ? 'ring-2 ring-white shadow-sm' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: aviatorSvg(cfg) }}
    />
  )
}

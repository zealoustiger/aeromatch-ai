/**
 * Avionics capability classifier for piston GA aircraft listings.
 *
 * Converts the raw `avionics: string[]` extracted from a listing description
 * into structured capability chips (Glass Panel, ADS-B Out, Autopilot, WAAS GPS)
 * plus the original item list. Pure functions — no DB, no React.
 *
 * Pattern matching uses `includes()` on the lowercase-joined avionics list.
 * First detected match per category wins; all remaining items are shown verbatim.
 */

export interface AvionicsCap {
  key: 'glass' | 'adsb' | 'autopilot' | 'waas' | 'gps'
  label: string
  hint: string
}

export interface AvionicsInfo {
  /** Detected capability chips, in display priority order. */
  caps: AvionicsCap[]
  /** The raw avionics items verbatim from the listing. */
  items: string[]
}

// --- Pattern tables (checked via substring match on lowercased joined list) ---

const GLASS_PATTERNS = [
  'g1000', 'g3000', 'g5000', 'g3x',
  'entegra', 'avidyne',
  'g600', 'g500', 'g700', 'g950', 'g900x',
  'efis', 'primary flight display', ' pfd',
  'eis 4000', 'eis4000',
]

const ADSB_PATTERNS = [
  'ads-b', 'adsb', 'ads b',
  'stratus', 'sentry', 'dynon adsb',
  '978 uht', '978mhz',
]

const AUTOPILOT_PATTERNS = [
  'autopilot', 'auto pilot',
  's-tec', 'stec', 'st75', 'st55',
  'kap 140', 'kap140', 'kap-140',
  'kfc 200', 'kfc200', 'kfc-200',
  'gfc 500', 'gfc500', 'gfc-500',
  'gfc 700', 'gfc700', 'gfc-700',
  'gpss', 'navmatic', 'century iii', 'century iv',
  'piper autocontrol', 'altimatic',
  'relaxor', 'sorcerer',
]

const WAAS_PATTERNS = [
  'waas',
  'gtn 650', 'gtn650', 'gtn-650',
  'gtn 750', 'gtn750', 'gtn-750',
  'gtn 635', 'gtn635',
  'gns 430w', 'gns430w', 'gns-430w',
  'gns 530w', 'gns530w', 'gns-530w',
  'gnc 355', 'gnc355', 'gnc-355',
  'g275',
  'lpv', 'lnav+v',
  'ifr approach',
]

const GPS_PATTERNS = [
  'gns 430', 'gns430', 'gns-430',
  'gns 530', 'gns530', 'gns-530',
  'gns 480', 'gns480',
  'kln 94', 'kln94',
  'kln 90', 'kln90',
  'gns 150', 'gns150',
  'loran',
  ' gps',
]

function matchAny(items: string[], patterns: string[]): boolean {
  const haystack = items.join(' ').toLowerCase()
  return patterns.some((p) => haystack.includes(p))
}

/**
 * Classify an avionics list into capability chips + raw item list.
 * Returns null when avionics is null or empty (panel should self-suppress).
 */
export function classifyAvionics(avionics: string[] | null): AvionicsInfo | null {
  if (!avionics || avionics.length === 0) return null

  const caps: AvionicsCap[] = []

  if (matchAny(avionics, GLASS_PATTERNS)) {
    caps.push({
      key: 'glass',
      label: 'Glass panel',
      hint: 'Integrated glass-panel display (G1000, Entegra, Avidyne, or equivalent).',
    })
  }
  if (matchAny(avionics, ADSB_PATTERNS)) {
    caps.push({
      key: 'adsb',
      label: 'ADS-B Out',
      hint: 'ADS-B Out equipped — meets the 2020 mandate for Class B, C, and E ≥ 10,000 ft.',
    })
  }
  if (matchAny(avionics, AUTOPILOT_PATTERNS)) {
    caps.push({
      key: 'autopilot',
      label: 'Autopilot',
      hint: 'Autopilot system installed.',
    })
  }
  if (matchAny(avionics, WAAS_PATTERNS)) {
    caps.push({
      key: 'waas',
      label: 'WAAS GPS',
      hint: 'WAAS-capable GPS navigator — can fly LPV and LNAV+V approaches to published IFR minimums.',
    })
  } else if (matchAny(avionics, GPS_PATTERNS)) {
    caps.push({
      key: 'gps',
      label: 'GPS navigator',
      hint: 'GPS navigator installed (non-WAAS or WAAS status not specified).',
    })
  }

  return { caps, items: avionics }
}

// ─── IFR suitability synthesis ───────────────────────────────────────────────
// Turns the detected capability chips into a single honest "can I file IFR, and
// how capable is this panel?" buyer read. Tiers cascade from the richest combo
// (glass + WAAS + autopilot) down to a bare ADS-B mention; each sub-line states
// what is present and explicitly defers to the owner/logbooks for anything not
// detected — never asserting a certification we can't see. Returns null when no
// IFR-meaningful capability was detected, so callers self-suppress rather than
// render a fabricated read from an ambiguous equipment list. Pure — no React.
export type IfrTier = 'full' | 'capable' | 'equipped' | 'basic'

export interface IfrSuitability {
  tier: IfrTier
  headline: string
  sub: string
}

export function computeIfrSuitability(caps: AvionicsCap[]): IfrSuitability | null {
  if (caps.length === 0) return null
  const keys = new Set(caps.map((c) => c.key))
  const glass = keys.has('glass')
  const waas = keys.has('waas')
  const gps = keys.has('gps')
  const ap = keys.has('autopilot')
  const adsb = keys.has('adsb')

  if (glass && waas && ap)
    return { tier: 'full', headline: 'Full IFR touring setup', sub: 'Glass panel, WAAS GPS, and autopilot — everything needed for instrument cross-country flying.' }
  if (glass && waas)
    return { tier: 'full', headline: 'IFR-capable with glass panel', sub: 'Glass avionics and WAAS GPS for LPV/LNAV+V approaches. No autopilot detected — ask the owner.' }
  if (glass && ap)
    return { tier: 'capable', headline: 'Glass panel with autopilot', sub: 'Integrated glass display and autopilot. Verify WAAS GPS details with the owner for precision approaches.' }
  if (waas && ap)
    return { tier: 'capable', headline: 'IFR-capable: WAAS GPS + autopilot', sub: 'WAAS GPS for precision approaches and autopilot for cross-country — a solid IFR panel.' }
  if (glass)
    return { tier: 'capable', headline: 'Glass panel', sub: 'Integrated glass display. Verify WAAS GPS and autopilot details with the owner for IFR use.' }
  if (waas)
    return { tier: 'capable', headline: 'WAAS GPS — IFR-capable', sub: 'WAAS GPS navigator for LPV precision approaches. No autopilot or glass panel detected in the listing.' }
  if (gps && ap)
    return { tier: 'equipped', headline: 'IFR-equipped: GPS + autopilot', sub: 'GPS navigator and autopilot; WAAS capability not specified — verify with owner for LPV approaches.' }
  if (gps)
    return { tier: 'equipped', headline: 'GPS navigator installed', sub: 'GPS navigator listed. Verify WAAS capability and IFR certification with the owner.' }
  if (ap)
    return { tier: 'equipped', headline: 'Autopilot installed', sub: 'Autopilot listed but no GPS navigator detected. Ask the owner about the full IFR navigation suite.' }
  if (adsb)
    return { tier: 'basic', headline: 'ADS-B compliant', sub: 'ADS-B Out equipped. No glass, GPS, or autopilot found in the listing — ask the owner about the full panel.' }
  return null
}

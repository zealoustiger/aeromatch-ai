import type { Partnership, PartnershipSeeker } from './types'

/**
 * Compatibility matching engine.
 *
 * `scoreMatch` is a PURE function — it touches no database and no globals, so it
 * is unit-testable in isolation (see matching.test.ts). All coordinate data is
 * injected via the `airportCoords` map so callers can resolve ICAO → lat/lng from
 * the `airports` table once and reuse it across many pairs.
 */

export interface AirportCoord {
  lat: number
  lng: number
}

/** ICAO (upper-case) → coordinates. Missing entries are tolerated (geo softens). */
export type AirportCoords = Record<string, AirportCoord | undefined>

export interface MatchResult {
  /** 0–100 integer compatibility score (returned even when not qualified). */
  score: number
  /** True only when every HARD qualifier passes. */
  qualified: boolean
  /** Human-readable why-it-matched bullets. */
  reasons: string[]
  /** Why the pair failed a hard gate (empty when qualified). */
  blockers: string[]
}

/** Default commute radius when a seeker hasn't specified one. */
export const DEFAULT_TRAVEL_NM = 50

// SOFT-fit weights (applied only to applicable dimensions, then renormalized to 100).
const W_BUDGET = 40
const W_GEO = 25
const W_AIRCRAFT = 15
const W_SHARE = 10
const W_MISSION = 10

/** Great-circle distance in nautical miles. */
export function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065 // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function usd(n: number): string {
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

const MISSION_KEYWORDS: Record<string, string[]> = {
  personal_travel: ['travel', 'trip', 'cross country', 'cross-country', 'touring', 'transportation'],
  weekend_trips: ['weekend', 'getaway', 'trip', 'travel'],
  cross_country: ['cross country', 'cross-country', 'xc', 'travel', 'long range', 'ifr'],
  instrument_currency: ['ifr', 'instrument', 'currency', 'g1000', 'glass', 'avionics'],
  training: ['train', 'instruction', 'hour building', 'hour-building', 'time building', 'cfi', 'student'],
  business: ['business', 'commute', 'commuting', 'work'],
  other: [],
}

/**
 * Score a (seeker, partnership) pair from 0–100.
 *
 * HARD qualifiers gate `qualified`; SOFT fit drives the score. The score is the
 * sum of earned points across *applicable* soft dimensions, renormalized to 100,
 * so a pair that only has budget + geo data is scored fairly against one that has
 * every dimension populated.
 */
export function scoreMatch(
  seeker: PartnershipSeeker,
  partnership: Partnership,
  airportCoords: AirportCoords
): MatchResult {
  const reasons: string[] = []
  const blockers: string[] = []
  let qualified = true

  // Resolve coordinates (best-effort — unknown coords soften, never crash).
  const sCoord = airportCoords[(seeker.home_airport ?? '').toUpperCase()]
  const pCoord = airportCoords[(partnership.home_airport ?? '').toUpperCase()]
  const travel = seeker.willing_to_travel_nm ?? DEFAULT_TRAVEL_NM
  const distNm = sCoord && pCoord ? haversineNm(sCoord.lat, sCoord.lng, pCoord.lat, pCoord.lng) : null

  // ── HARD: Geo ──────────────────────────────────────────────
  // Only gates when we can actually compute the distance.
  if (distNm !== null) {
    if (distNm <= travel) {
      reasons.push(`Within ${Math.round(distNm)}nm of your home airport (${seeker.home_airport})`)
    } else {
      qualified = false
      blockers.push(`${Math.round(distNm)}nm away — beyond your ${travel}nm travel limit`)
    }
  }

  // ── HARD: Ratings (P.ratings_required ⊆ S.ratings_held) ────
  const held = (seeker.ratings_held ?? []).map(norm)
  const required = (partnership.ratings_required ?? []).filter(Boolean)
  const missingRatings = required.filter((r) => !held.includes(norm(r)))
  if (required.length > 0) {
    if (missingRatings.length === 0) {
      reasons.push(`You hold every required rating (${required.join(', ')})`)
    } else {
      qualified = false
      blockers.push(
        `Missing required rating${missingRatings.length > 1 ? 's' : ''}: ${missingRatings.join(', ')}`
      )
    }
  }

  // ── HARD: Hours (S.total_hours >= P.min_hours) ─────────────
  const minHours = partnership.min_hours ?? 0
  const totalHours = seeker.total_hours ?? 0
  if (minHours > 0) {
    if (totalHours >= minHours) {
      reasons.push(`You meet the ${minHours}-hour minimum`)
    } else {
      qualified = false
      blockers.push(`Requires ${minHours} hrs — your profile lists ${totalHours}`)
    }
  }

  // ── SOFT: accumulate earned points over applicable weight ──
  let earned = 0
  let applicable = 0

  // Budget fit (40): buy-in / monthly / hourly.
  const budgetDims: { label: string; pv: number | null; sv: number | null }[] = [
    { label: 'Buy-in', pv: partnership.buy_in_price, sv: seeker.max_buy_in },
    { label: 'Monthly', pv: partnership.monthly_fixed, sv: seeker.max_monthly },
    { label: 'Hourly wet rate', pv: partnership.hourly_wet, sv: seeker.max_hourly },
  ]
  const budgetFracs: number[] = []
  for (const d of budgetDims) {
    if (d.pv == null || d.sv == null || d.sv <= 0) continue
    let frac: number
    if (d.pv <= d.sv) {
      frac = 1
      reasons.push(`${d.label} ${usd(d.sv - d.pv)} under your ${usd(d.sv)} max`)
    } else if (d.pv <= d.sv * 1.15) {
      // Partial credit for up to 15% over budget, linearly decaying.
      frac = 1 - (d.pv - d.sv) / (d.sv * 0.15)
    } else {
      frac = 0
    }
    budgetFracs.push(frac)
  }
  if (budgetFracs.length > 0) {
    earned += mean(budgetFracs) * W_BUDGET
    applicable += W_BUDGET
  }

  // Geo proximity (25): closer = higher, within the travel radius.
  if (distNm !== null && distNm <= travel) {
    const frac = travel > 0 ? Math.max(0, Math.min(1, 1 - distNm / travel)) : 1
    earned += frac * W_GEO
    applicable += W_GEO
  } else if (distNm !== null) {
    // Out of range but distance known — counts as an applicable miss (0 pts).
    applicable += W_GEO
  }

  // Aircraft preference (15): make membership + model overlap.
  const prefMakes = (seeker.preferred_makes ?? []).map(norm).filter(Boolean)
  const prefModels = (seeker.preferred_models ?? '').trim()
  const aircraftParts: number[] = []
  if (prefMakes.length > 0) {
    const makeHit = prefMakes.includes(norm(partnership.make))
    aircraftParts.push(makeHit ? 1 : 0)
    if (makeHit) reasons.push(`${partnership.make} is on your preferred-makes list`)
  }
  if (prefModels) {
    const modelTokens = prefModels
      .split(/[,/]| or /i)
      .map((t) => norm(t))
      .filter(Boolean)
    const pModel = norm(partnership.model)
    const modelHit = modelTokens.some((t) => pModel.includes(t) || t.includes(pModel))
    aircraftParts.push(modelHit ? 1 : 0)
    if (modelHit) reasons.push(`${partnership.model} matches your model preferences`)
  }
  if (aircraftParts.length > 0) {
    earned += mean(aircraftParts) * W_AIRCRAFT
    applicable += W_AIRCRAFT
  }

  // Share-type preference (10).
  const prefShares = (seeker.preferred_share_types ?? []).map((s) => norm(String(s)))
  if (prefShares.length > 0) {
    const shareHit = prefShares.includes(norm(partnership.share_type))
    if (shareHit) {
      earned += W_SHARE
      reasons.push(`Offered as a share type you prefer`)
    }
    applicable += W_SHARE
  }

  // Mission / usage alignment (10): heuristic keyword overlap.
  const uses = (seeker.intended_use ?? []).filter(Boolean)
  if (uses.length > 0) {
    const haystack = [partnership.description, partnership.share_type, partnership.make, partnership.model]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    let hits = 0
    for (const u of uses) {
      const keywords = MISSION_KEYWORDS[norm(u)] ?? [norm(u).replace(/_/g, ' ')]
      if (keywords.some((k) => k && haystack.includes(k))) hits++
    }
    if (hits > 0) {
      earned += (hits / uses.length) * W_MISSION
      reasons.push(`Aligns with how you plan to fly`)
    }
    applicable += W_MISSION
  }

  // Renormalize earned over applicable weight → 0–100.
  let score: number
  if (applicable > 0) {
    score = Math.round((earned / applicable) * 100)
  } else {
    // No comparable soft signals at all — fall back to a neutral-ish baseline.
    score = qualified ? 60 : 30
  }
  score = Math.max(0, Math.min(100, score))

  return { score, qualified, reasons, blockers }
}

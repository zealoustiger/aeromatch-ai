import type { AircraftForSale } from '@/lib/types'

/**
 * Listing quality grading.
 *
 * `quality_score` (0-100) is computed in Postgres as a STORED generated column
 * (see migration aircraft_for_sale_quality_score). The signal weights below
 * MUST stay in sync with that SQL expression — they exist here so the admin
 * tool can explain *why* a listing scored the way it did (which signals are
 * missing), and as a fallback if the column is ever null.
 *
 * Grade cutoffs live here (not in SQL) so they can be tuned without a migration.
 */

export type Grade = 'A' | 'B' | 'C'

export const GRADE_CUTOFFS: Record<'A' | 'B', number> = { A: 78, B: 50 }

export interface QualitySignal {
  key: string
  label: string
  points: number
  present: (r: Partial<AircraftForSale>) => boolean
}

const isRealText = (v: string | null | undefined, banned: string[] = []) => {
  const t = (v ?? '').trim().toLowerCase()
  return t.length > 0 && !banned.includes(t)
}

// Order: highest-value signals first (matches the SQL weights).
export const QUALITY_SIGNALS: QualitySignal[] = [
  { key: 'price', label: 'Asking price', points: 30, present: (r) => r.asking_price != null },
  { key: 'year', label: 'Year', points: 12, present: (r) => r.year != null },
  { key: 'make', label: 'Make', points: 12, present: (r) => isRealText(r.make, ['unknown']) },
  { key: 'model', label: 'Model', points: 12, present: (r) => isRealText(r.model, ['unknown']) },
  { key: 'state', label: 'Location (state)', points: 12, present: (r) => r.state != null },
  { key: 'registration', label: 'N-number', points: 10, present: (r) => isRealText(r.registration) },
  { key: 'ttaf', label: 'Total time', points: 7, present: (r) => r.ttaf != null },
  { key: 'description', label: 'Description', points: 5, present: (r) => (r.description ?? '').length >= 80 },
]

/** JS mirror of the SQL generated column — used for the admin "explain" view. */
export function scoreRow(r: Partial<AircraftForSale>): number {
  return QUALITY_SIGNALS.reduce((sum, s) => sum + (s.present(r) ? s.points : 0), 0)
}

export function gradeFromScore(score: number | null | undefined): Grade {
  const s = score ?? 0
  if (s >= GRADE_CUTOFFS.A) return 'A'
  if (s >= GRADE_CUTOFFS.B) return 'B'
  return 'C'
}

/** Minimum score required to clear a given grade — used to translate a grade
 *  filter into a `quality_score >=` query bound. 'C' is the floor (everything). */
export function minScoreForGrade(grade: Grade): number {
  if (grade === 'A') return GRADE_CUTOFFS.A
  if (grade === 'B') return GRADE_CUTOFFS.B
  return 0
}

export interface GradeMeta {
  label: string
  short: string
  /** Tailwind classes for a small chip. */
  chip: string
  blurb: string
}

export function gradeMeta(grade: Grade): GradeMeta {
  switch (grade) {
    case 'A':
      return {
        label: 'Grade A',
        short: 'A',
        chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        blurb: 'Complete, high-confidence listing',
      }
    case 'B':
      return {
        label: 'Grade B',
        short: 'B',
        chip: 'bg-amber-50 text-amber-700 ring-amber-200',
        blurb: 'Usable, but missing some details',
      }
    default:
      return {
        label: 'Grade C',
        short: 'C',
        chip: 'bg-rose-50 text-rose-700 ring-rose-200',
        blurb: 'Sparse listing — key fields missing',
      }
  }
}

export interface QualityExplanation {
  score: number
  grade: Grade
  signals: { key: string; label: string; points: number; present: boolean }[]
  missing: string[]
}

/** Full breakdown for the admin debugger: which signals are present/missing. */
export function explainQuality(r: Partial<AircraftForSale>): QualityExplanation {
  const signals = QUALITY_SIGNALS.map((s) => ({
    key: s.key,
    label: s.label,
    points: s.points,
    present: s.present(r),
  }))
  // Prefer the stored score when available; fall back to the JS mirror.
  const score = r.quality_score ?? scoreRow(r)
  return {
    score,
    grade: gradeFromScore(score),
    signals,
    missing: signals.filter((s) => !s.present).map((s) => s.label),
  }
}

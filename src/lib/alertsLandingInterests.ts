/**
 * The `/alerts` landing page's catch-all interest chips — shared between the
 * server component (`src/app/alerts/page.tsx`, which fetches a live sample
 * preview per source path) and the client component (`AlertsLanding.tsx`,
 * which renders them). Lives in a plain module (no `'use client'`) so a
 * server component can import the plain `sourcePath` list directly — a
 * `'use client'` file's non-component exports aren't usable that way.
 */
export interface BaseInterest {
  label: string
  /** Human label for the email copy; '' → general new-listing copy. */
  context: string
  /** Matchable search path (must start with /aircraft or /partnerships). */
  sourcePath: string
  noun: 'aircraft' | 'partnership' | 'seeker'
  source: string
}

export const BASE_INTERESTS: BaseInterest[] = [
  { label: 'All aircraft for sale', context: '', sourcePath: '/aircraft', noun: 'aircraft', source: 'alerts_landing' },
  { label: 'Partnership shares', context: '', sourcePath: '/partnerships', noun: 'partnership', source: 'alerts_landing' },
  { label: 'Pilots seeking a partnership', context: '', sourcePath: '/partnerships/seeking', noun: 'seeker', source: 'alerts_landing' },
]

export const BASE_INTEREST_PATHS: string[] = BASE_INTERESTS.map((i) => i.sourcePath)

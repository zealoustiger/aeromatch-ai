import type { AlertDigestSample } from './email'

/**
 * Cross-section listing dedupe for a combined digest email (2+ due alerts for
 * the same subscriber in one send — see the alert-digest cron). Each
 * section's sample list is fetched independently per-alert, so a listing
 * matching more than one of the subscriber's alerts (e.g. "Cessna 182" + "all
 * of TX") would otherwise show the same photo card once per matching
 * section — reads as spam/duplication in one email (GOAL.md: never spam).
 *
 * Deliberately does NOT touch `newCount`/`dropCount` — those stay the
 * truthful per-alert totals GOAL.md requires; only the preview sample cards
 * are deduped. A dropped duplicate simply isn't re-rendered as its own card;
 * the section's "See all matches" link still covers it.
 */

export interface DedupeSectionInput {
  context: string | null
  samples?: AlertDigestSample[]
}

function cleanContext(context: string | null): string {
  return (context || '').trim()
}

/**
 * Keeps each sample (by `url`) only in the first section (by array order)
 * it appears in, and attaches an `alsoMatchesLabel` note to the kept sample
 * naming one other section it also matched (first duplicate encountered,
 * skipped if that section has no usable context to name). A sample with no
 * duplicate elsewhere in `sections` is returned unchanged.
 */
export function dedupeDigestSectionSamples<T extends DedupeSectionInput>(sections: T[]): T[] {
  const contextsByUrl = new Map<string, string[]>()
  sections.forEach((section) => {
    for (const sample of section.samples ?? []) {
      const list = contextsByUrl.get(sample.url)
      if (list) list.push(cleanContext(section.context))
      else contextsByUrl.set(sample.url, [cleanContext(section.context)])
    }
  })

  const seenUrls = new Set<string>()
  return sections.map((section) => {
    const samples = (section.samples ?? []).flatMap((sample) => {
      if (seenUrls.has(sample.url)) return []
      seenUrls.add(sample.url)

      const others = (contextsByUrl.get(sample.url) ?? []).slice(1).filter(Boolean)
      if (others.length === 0) return [sample]
      return [{ ...sample, alsoMatchesLabel: `Also matches your ${others[0]} alert` }]
    })
    return { ...section, samples }
  })
}

import { HelpCircle } from 'lucide-react'

/**
 * Per-model "Frequently asked questions" block for the curated
 * `/aircraft/[make]/[model]` pages. Renders 3 genuine, evergreen Q&As as a
 * native `<details>`/`<summary>` accordion (no client JS — works without
 * hydration, keyboard-accessible, and the answer text is always in the DOM so
 * it matches the FAQPage JSON-LD 1:1).
 *
 * Styling mirrors the existing for-sale rail cards
 * (`rounded-xl border border-slate-200 bg-white p-6 shadow-sm`) and the
 * established sky-blue accent — no new palette.
 */
export default function ModelFaq({
  label,
  faqs,
  className = '',
}: {
  label: string
  faqs: { q: string; a: string }[]
  className?: string
}) {
  if (!faqs || faqs.length === 0) return null

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`.trim()}
      aria-labelledby="model-faq-heading"
    >
      <h2
        id="model-faq-heading"
        className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900"
      >
        <HelpCircle className="h-4 w-4 text-sky-500" />
        {label} — frequently asked questions
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Quick answers for buyers and prospective co-owners.
      </p>
      <div className="divide-y divide-slate-100">
        {faqs.map((f, i) => (
          <details key={i} className="group py-3 first:pt-0 last:pb-0">
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-lg leading-none text-sky-500 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

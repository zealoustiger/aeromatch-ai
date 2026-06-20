import Link from 'next/link'
import { SITE_URL } from '@/lib/seo'

export type Crumb = {
  /** visible label */
  label: string
  /** absolute path; omit for the current (last) page so it renders as plain text */
  href?: string
}

/**
 * Reusable, crawlable breadcrumb trail. Every non-current crumb is a real
 * `<Link>` (an `<a>` in the HTML) so search engines follow it and link equity
 * flows to the linked pages. Styled sky-blue, mobile-first; wraps gracefully at
 * 375px (no horizontal overflow). Also emits BreadcrumbList JSON-LD for rich
 * results — matching the repo's existing `application/ld+json` pattern.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400">
        {items.map((c, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-x-2">
              {c.href && !isLast ? (
                <Link href={c.href} className="text-sky-600 hover:text-sky-700 hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-600" aria-current="page">
                  {c.label}
                </span>
              )}
              {!isLast && <span className="text-slate-300">/</span>}
            </li>
          )
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  )
}

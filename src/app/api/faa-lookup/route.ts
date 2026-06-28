import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// FAA Aircraft Registry per-lookup. The FAA Aircraft Inquiry returns server-rendered
// HTML — we parse the table fields we need (Mfr Name, Model, Year Mfr, registrant Type).
// Fails soft on every error path so the form still works without a response.
const FAA_URL = 'https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt='

export type FaaLookupResult =
  | { found: true; make: string; model: string; year: number | null; registrantType: string | null }
  | { found: false; error: 'not-found' | 'lookup-unavailable' | 'parse-error' }

// Extract a labelled table cell from the FAA HTML. The registry uses both
// <th scope="row">Label</th><td>Value</td> and older <td>Label</td><td>Value</td>
// layouts depending on the section, so we try both.
function extractField(html: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`${escaped}<\\/th>\\s*<td[^>]*>([^<]+)<\\/td>`, 'i'),
    new RegExp(`>\\s*${escaped}\\s*<\\/td>\\s*<td[^>]*>([^<]+)<\\/td>`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1].trim()
  }
  return null
}

// Title-case a raw FAA manufacturer name and drop a trailing corporate suffix so the
// stored make stays clean ("MAULE" → "Maule", "AVIAT AIRCRAFT INC" → "Aviat Aircraft").
// We never invent a name — this is the registry's own value, just cased.
function cleanMakeName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ').replace(/[.,]+$/, '')
  if (!trimmed) return ''
  const titled = trimmed.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
  return titled.replace(/\s+(Inc|Incorporated|Corp|Corporation|Co|Company|Llc|Ltd)$/i, '').trim()
}

// Map the FAA's uppercase make names to our canonical MAKES dropdown values where we
// can; otherwise fall back to the registry's own make name in clean Title Case so the
// form can still fill the required Make field (the post form injects an option for
// makes outside its preset list). Returns '' only when the FAA gave us no make at all.
function matchMake(faaName: string): string {
  const n = faaName.trim().toUpperCase()
  if (!n) return ''
  if (n.startsWith('CESSNA')) return 'Cessna'
  if (n.startsWith('PIPER')) return 'Piper'
  if (n.startsWith('BEECHCRAFT') || n.startsWith('BEECH') || n === 'RAYTHEON') return 'Beechcraft'
  if (n.startsWith('CIRRUS')) return 'Cirrus'
  if (n.startsWith('MOONEY')) return 'Mooney'
  if (n.startsWith("VAN'S") || n.startsWith('VANS ') || n === 'VANS') return "Van's"
  if (n.startsWith('DIAMOND')) return 'Diamond'
  if (n.startsWith('GRUMMAN')) return 'Grumman'
  return cleanMakeName(faaName)
}

// Normalise registrant type to a short, human-readable label.
function normaliseType(raw: string): string | null {
  const n = raw.trim().toUpperCase()
  if (n.includes('INDIVIDUAL')) return 'Individual'
  if (n.includes('LLC') || n.includes('LIMITED LIABILITY')) return 'LLC'
  if (n.includes('TRUST')) return 'Trust'
  if (n.includes('CORP') || n.includes('PARTNERSHIP')) return 'Corporation'
  if (n.includes('GOVERNMENT') || n.includes('GOV')) return 'Government'
  return raw.trim() || null
}

export async function GET(req: NextRequest): Promise<NextResponse<FaaLookupResult>> {
  const raw = req.nextUrl.searchParams.get('n') ?? ''
  // Strip leading N, spaces, dashes — FAA accepts the digit portion only.
  const nNumber = raw.trim().toUpperCase().replace(/^N/, '').replace(/[^A-Z0-9]/g, '')

  if (!nNumber) {
    return NextResponse.json({ found: false, error: 'not-found' })
  }

  let html: string
  try {
    const res = await fetch(`${FAA_URL}${encodeURIComponent(nNumber)}`, {
      headers: {
        // Polite browser-like UA to avoid 403s from the FAA server.
        'User-Agent': 'Mozilla/5.0 (compatible; ClubHanger/1.0; +https://clubhanger.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      // 8-second ceiling — we don't want to stall the user's form submission.
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return NextResponse.json({ found: false, error: 'lookup-unavailable' })
    html = await res.text()
  } catch {
    return NextResponse.json({ found: false, error: 'lookup-unavailable' })
  }

  // The "no results" page says "No aircraft found" or is an empty results table.
  if (/no\s+aircraft\s+found|no\s+records?\s+found|0\s+records?\s+found/i.test(html)) {
    return NextResponse.json({ found: false, error: 'not-found' })
  }

  const mfrRaw = extractField(html, 'Mfr Name') ?? extractField(html, 'MFR NAME') ?? ''
  const modelRaw = extractField(html, 'Model') ?? extractField(html, 'MODEL') ?? ''
  const yearRaw = extractField(html, 'Year Mfr') ?? extractField(html, 'YEAR MFR') ?? ''
  const typeRaw = extractField(html, 'Type') ?? ''

  if (!mfrRaw && !modelRaw) {
    return NextResponse.json({ found: false, error: 'parse-error' })
  }

  const make = matchMake(mfrRaw)
  const model = modelRaw.replace(/\s+/g, ' ').trim()
  const yearNum = yearRaw ? parseInt(yearRaw, 10) : null
  const year = yearNum && yearNum > 1900 && yearNum <= new Date().getFullYear() ? yearNum : null
  const registrantType = normaliseType(typeRaw)

  return NextResponse.json({ found: true, make, model, year, registrantType })
}

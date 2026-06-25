/**
 * Auto-name a saved search from its active filters.
 *
 * Saving a search used to force the user to type a name first. This turns the raw
 * query string into a concise, human-readable name so the save can happen in one
 * click (the user can rename it later on /searches). Pure + side-effect-free so it
 * can run on the client and be unit-tested.
 *
 * Examples:
 *   /aircraft   ?make=Cessna&model=172&state=ca&max_price=80000 → "Cessna 172 for sale in CA under $80k"
 *   /partnerships ?make=Cirrus&airport=KHWD&radius=100          → "Cirrus partnerships near KHWD"
 */

// Compact money label for names: "$80k", "$1.2M", "$20,000". Keeps names short.
function compactMoney(raw: string | null): string | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (n >= 1_000 && n % 1_000 === 0) return `$${n / 1_000}k`
  return `$${n.toLocaleString()}`
}

function nameAircraft(p: URLSearchParams): string {
  const make = p.get('make')?.trim()
  const model = p.get('model')?.trim()
  const lead = [make, model].filter(Boolean).join(' ') || 'Aircraft'

  let name = `${lead} for sale`

  const state = p.get('state')?.trim()
  if (state) name += ` in ${state.toUpperCase()}`

  const tail: string[] = []
  const maxPrice = compactMoney(p.get('max_price'))
  if (maxPrice) tail.push(`under ${maxPrice}`)
  const minYear = p.get('min_year')?.trim()
  if (minYear) tail.push(`${minYear}+`)
  const maxTt = p.get('max_tt')?.trim()
  if (maxTt && Number.isFinite(Number(maxTt))) {
    tail.push(`under ${Number(maxTt).toLocaleString()} hrs`)
  }
  if (p.get('drops') === '1') tail.push('price drops')
  const q = p.get('q')?.trim()
  if (q) tail.push(`“${q}”`)

  if (tail.length) name += ` ${tail.join(', ')}`
  return name
}

function namePartnership(p: URLSearchParams): string {
  const make = p.get('make')?.trim()
  const lead = make ? `${make} partnerships` : 'Partnerships'

  let name = lead

  const airports = p.get('airports')?.trim()
  const airport = p.get('airport')?.trim()
  const radius = p.get('radius')?.trim()
  if (airports) name += ` near ${airports.toUpperCase()}`
  else if (airport && radius) name += ` within ${radius}mi of ${airport.toUpperCase()}`
  else if (airport) name += ` near ${airport.toUpperCase()}`

  const state = p.get('state')?.trim()
  if (state) name += ` in ${state.toUpperCase()}`

  const tail: string[] = []
  const shareType = p.get('share_type')?.trim()
  if (shareType) tail.push(shareType)
  const maxMonthly = compactMoney(p.get('max_monthly'))
  if (maxMonthly) tail.push(`under ${maxMonthly}/mo`)
  const maxBuyIn = compactMoney(p.get('max_buyin'))
  if (maxBuyIn) tail.push(`buy-in under ${maxBuyIn}`)

  if (tail.length) name += ` · ${tail.join(', ')}`
  return name
}

function nameSeeker(p: URLSearchParams): string {
  const make = p.get('make')?.trim()
  const lead = make ? `${make} seekers` : 'Seekers'

  let name = lead

  const airports = p.get('airports')?.trim()
  const airport = p.get('airport')?.trim()
  const radius = p.get('radius')?.trim()
  if (airports) name += ` near ${airports.toUpperCase()}`
  else if (airport && radius) name += ` within ${radius}mi of ${airport.toUpperCase()}`
  else if (airport) name += ` near ${airport.toUpperCase()}`

  const tail: string[] = []
  const rating = p.get('rating')?.trim()
  if (rating) tail.push(rating.toUpperCase())
  const minHours = p.get('min_hours')?.trim()
  if (minHours && Number.isFinite(Number(minHours))) tail.push(`${Number(minHours).toLocaleString()}+ hrs`)
  const shareType = p.get('share_type')?.trim()
  if (shareType) tail.push(shareType)

  if (tail.length) name += ` · ${tail.join(', ')}`
  return name
}

const MAX_NAME_LEN = 80

/** Build a concise, readable name for a saved search from its query string + path. */
export function autoNameSearch(params: string, path: string): string {
  const p = new URLSearchParams(params)
  let name: string
  if (path === '/aircraft') name = nameAircraft(p)
  else if (path === '/partnerships/seeking') name = nameSeeker(p)
  else name = namePartnership(p)
  return name.length > MAX_NAME_LEN ? `${name.slice(0, MAX_NAME_LEN - 1).trimEnd()}…` : name
}

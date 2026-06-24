// Seed FAA-realistic pilot-seeking listings into partnership_seekers so the
// "Pilots seeking shares" page isn't empty (cold-start). NOT real people: names
// are first-name + last-initial only, ratings/hours are authentic distributions,
// home airports are real (pulled from our airports table), NO contact info.
// Seed rows are identified by poster_id IS NULL (delete to remove).
//
//   node scripts/seed-seekers.mjs --dry-run            # print sample, insert nothing
//   node scripts/seed-seekers.mjs --count 10           # insert 10
//   node scripts/seed-seekers.mjs --purge              # delete all seed rows (poster_id null)

import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const U = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const K = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE
const args = process.argv.slice(2)
const has = (f) => args.includes(`--${f}`)
const num = (f, d) => { const i = args.indexOf(`--${f}`); return i >= 0 ? parseInt(args[i + 1], 10) : d }

async function sb(path, init) {
  const r = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  const t = await r.text(); return t ? JSON.parse(t) : null
}

if (has('purge')) {
  await sb('partnership_seekers?poster_id=is.null', { method: 'DELETE', headers: { Prefer: 'return=minimal' } })
  console.log('purged seed seekers (poster_id IS NULL)')
  process.exit(0)
}

// Deterministic-ish PRNG so re-runs are stable-ish (seeded by index).
let s = 1234567
const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
const pick = (a) => a[Math.floor(rnd() * a.length)]
const sample = (a, n) => { const c = [...a]; const o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return o }
const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))

const FIRST = ['James', 'Maria', 'David', 'Sarah', 'Michael', 'Jennifer', 'Robert', 'Linda', 'Carlos', 'Emily', 'John', 'Aisha', 'Daniel', 'Grace', 'Kevin', 'Priya', 'Thomas', 'Rachel', 'Steven', 'Nina', 'Andrew', 'Sofia', 'Brian', 'Hannah', 'Marcus', 'Olivia', 'Wei', 'Laura', 'Eric', 'Diana', 'Paul', 'Mei', 'Greg', 'Tara', 'Sam', 'Lena']
const LASTI = 'ABCDEFGHJKLMNPRSTVWZ'.split('')

// Mission archetypes drive ratings/hours/budget/aircraft + description voice.
const MISSIONS = [
  { key: 'first', ratings: [['PPL'], ['PPL']], hrs: [70, 240], makes: [['Cessna', '172'], ['Piper', 'PA-28 / Cherokee'], ['Cessna', '152']], buyin: [8000, 22000], use: ['training', 'personal_travel'],
    title: (a) => `New owner-to-be seeking a 1/3 or 1/4 share near ${a}`,
    desc: (h, m, a) => `Newer PPL with about ${h} hours looking for my first share in a simple, well-kept ${m}. I want something forgiving to build confidence and stay current near ${a}. I'm meticulous about squawks and happy to be hands-on with the annual.` },
  { key: 'timebuild', ratings: [['PPL', 'IFR'], ['PPL']], hrs: [180, 420], makes: [['Cessna', '172'], ['Piper', 'PA-28'], ['Cessna', '152']], buyin: [10000, 25000], use: ['time_building', 'training'],
    title: (a) => `Time-building pilot wants an affordable share at ${a}`,
    desc: (h, m, a) => `Working toward my commercial — ${h} hours and counting. Looking for an inexpensive, available ${m} I can fly often out of ${a} without breaking the bank. Cosmetics don't matter; dispatch reliability and a fair hourly do.` },
  { key: 'stepup', ratings: [['PPL', 'IFR', 'Complex'], ['Commercial', 'IFR']], hrs: [400, 950], makes: [['Cirrus', 'SR22'], ['Beechcraft', 'Bonanza'], ['Mooney', 'M20'], ['Piper', 'Comanche']], buyin: [40000, 90000], use: ['personal_travel', 'business'],
    title: (a) => `Stepping up to a faster single — share near ${a}`,
    desc: (h, m, a) => `Instrument-rated with ${h} hours, ready to move into something faster. Hoping to share a clean ${m} based around ${a}. I keep my currency tight and treat a partnership like a marriage — communication and a real reserve fund matter to me.` },
  { key: 'family', ratings: [['PPL', 'IFR'], ['PPL', 'IFR']], hrs: [260, 700], makes: [['Cessna', '182'], ['Cirrus', 'SR22'], ['Beechcraft', 'Bonanza'], ['Diamond', 'DA40']], buyin: [30000, 75000], use: ['personal_travel', 'weekend_trips'],
    title: (a) => `Family flyer seeking a 4-seat IFR share at ${a}`,
    desc: (h, m, a) => `Fly for family trips most weekends — ${h} hours, instrument current. Looking for a roomy, IFR-equipped ${m} near ${a} with two or three serious partners. Kids and bags mean useful load matters; I'll happily co-own the maintenance planning.` },
  { key: 'fun', ratings: [['PPL'], ['PPL', 'Tailwheel']], hrs: [150, 600], makes: [["Van's", 'RV-7'], ['Cessna', '180 / 185'], ['Piper', 'Super Cub']], buyin: [20000, 55000], use: ['fun', 'weekend_trips'],
    title: (a) => `Weekend fun flyer — taildragger/experimental share near ${a}`,
    desc: (h, m, a) => `In it for the joy of flying. ${h} hours, love stick-and-rudder. Looking for a ${m} to share for $100 hamburgers and backcountry strips out of ${a}. Low-time, well-sorted, and a partner who flies as much as I do.` },
  { key: 'ifr', ratings: [['PPL', 'IFR'], ['Commercial', 'IFR']], hrs: [240, 520], makes: [['Cessna', '172 G1000'], ['Cirrus', 'SR20'], ['Cessna', '182']], buyin: [25000, 60000], use: ['personal_travel', 'training'],
    title: (a) => `IFR pilot wants a glass-panel share to stay proficient at ${a}`,
    desc: (h, m, a) => `${h} hours, instrument-rated and want to stay sharp. Seeking a glass ${m} near ${a} for regular actual and approaches. I fly ~15 hours/month, value a clean panel and a partner who flags squawks early.` },
]
const SCHED = ['Calendar', 'FlyingClub', 'FirstCome', 'Flexible']
const SHARES = ['1/2', '1/3', '1/4']

async function main() {
  // Real home airports: prefer towered/GA fields with a city, spread across states.
  const airports = await sb('airports?select=icao,name,city,state&type=in.(large_airport,medium_airport)&city=not.is.null&state=not.is.null&limit=600')
  const usable = airports.filter((a) => a.icao && /^[A-Z0-9]{3,4}$/.test(a.icao) && a.state?.length === 2)

  const count = has('dry-run') ? 5 : num('count', 10)
  const rows = []
  for (let i = 0; i < count; i++) {
    const M = pick(MISSIONS)
    const ap = pick(usable)
    const [make, model] = pick(M.makes)
    const ratings = pick(M.ratings)
    const hours = between(M.hrs[0], M.hrs[1])
    const aLabel = `${ap.city} (${ap.icao})`
    const buy = Math.round(between(M.buyin[0], M.buyin[1]) / 1000) * 1000
    const daysAgo = between(1, 45)
    rows.push({
      preferred_makes: [make],
      preferred_models: model,
      aircraft_category: make === "Van's" ? 'experimental' : 'sel',
      max_buy_in: buy,
      max_monthly: Math.round(between(250, 750) / 50) * 50,
      max_hourly: Math.round(between(70, 160) / 5) * 5,
      home_airport: ap.icao,
      airport_name: ap.name,
      city: ap.city,
      state: ap.state,
      willing_to_travel_nm: pick([25, 50, 75, 100, 150]),
      total_hours: hours,
      ratings_held: ratings,
      preferred_share_types: sample(SHARES, between(1, 2)),
      preferred_scheduling: pick(SCHED),
      intended_use: M.use,
      hours_per_month: between(5, 25),
      title: M.title(aLabel),
      description: M.desc(hours, `${make} ${model}`, aLabel),
      contact_name: `${pick(FIRST)} ${pick(LASTI)}.`,
      contact_email: '', // no real contact; column is NOT NULL so empty, never a fake address
      contact_phone: null,
      contact_method: 'platform', // inquiries route through on-platform messaging, not email
      status: 'active',
      poster_id: null, // marks this as seed data (purge with --purge)
      created_at: new Date(Date.now() - daysAgo * 864e5).toISOString(),
    })
  }

  if (has('dry-run')) {
    for (const r of rows) console.log(`\n• ${r.contact_name} — ${r.ratings_held.join('+')} · ${r.total_hours}h · ${r.home_airport} ${r.city},${r.state}\n  "${r.title}"\n  ${r.description}`)
    console.log(`\n(dry run — ${rows.length} sample rows, nothing inserted)`)
    return
  }
  await sb('partnership_seekers', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rows) })
  console.log(`inserted ${rows.length} seed seekers (poster_id IS NULL).`)
}
main().catch((e) => { console.error(e); process.exit(1) })

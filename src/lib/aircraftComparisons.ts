import { getMakeModel, type SeoMakeModel } from '@/lib/seo'

// ---------------------------------------------------------------------------
// Curated head-to-head aircraft comparison pages (`/aircraft/compare/[slug]`).
//
// Targets the very high-volume "{model} vs {model}" buyer query class with real,
// substantively-unique side-by-side content. Each page is built ENTIRELY from the
// existing curated MODEL_SPECS + MODEL_HIGHLIGHTS tables (via getMakeModel) plus a
// hand-written, non-fabricated `intro` — so there are NO invented figures and the
// copy never goes stale. The set is hand-curated (NOT every combination) so we never
// publish thin/near-duplicate combinatorial pages: both sides of every pair already
// carry a curated spec table + highlights, and the slug list is the single source of
// truth the route's generateStaticParams + the sitemap share (dynamicParams = false,
// so any non-curated slug 404s). Each comparison cross-links to both model hubs,
// flowing crawl equity from the indexed seed pages into and across this new family.
// ---------------------------------------------------------------------------

type ModelRef = { makeSlug: string; modelSlug: string }

export type Comparison = {
  /** URL slug, e.g. "cessna-172-vs-cirrus-sr22". The single source of truth. */
  slug: string
  a: ModelRef
  b: ModelRef
  /** Unique editorial intro (2–3 sentences). Real, well-known characteristics only. */
  intro: string
  /**
   * 3 genuine, evergreen head-to-head Q&As shown on the page + emitted as FAQPage
   * JSON-LD (visible text must match the structured data 1:1). Authored from the
   * `intro` + both sides' curated MODEL_SPECS / MODEL_HIGHLIGHTS — NO fabricated
   * figures and NO live listing counts, so the copy never goes stale.
   */
  faqs: { q: string; a: string }[]
}

// Each pair below has curated MODEL_SPECS + MODEL_HIGHLIGHTS on BOTH sides (verified
// against seo.ts), so every page renders a full two-column spec table + highlights.
export const COMPARISONS: Comparison[] = [
  {
    slug: 'cessna-172-vs-cirrus-sr22',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Cessna 172 and the Cirrus SR22 sit at opposite ends of the single-engine spectrum, which is exactly why buyers compare them. The 172 is the most-produced, easiest-to-own trainer ever built — forgiving, cheap to run, and supported everywhere. The SR22 is a fast, 300-plus-horsepower composite cross-country machine with a glass panel and a whole-airframe parachute, at a much higher purchase and operating cost. One is the safe, low-drama first airplane; the other is a serious traveler you grow into.',
    faqs: [
      { q: 'Is the Cirrus SR22 faster than the Cessna 172?', a: 'Yes, substantially. The SR22’s 310 hp gives roughly 183 kt cruise against about 124 kt for the 180 hp Cessna 172, so the SR22 covers ground far more quickly. The 172 trades that speed for simplicity and low operating cost.' },
      { q: 'Which is cheaper to own, a 172 or an SR22?', a: 'The 172, by a wide margin. It burns less fuel, has fixed gear and no parachute system, and its parts and maintenance are the most ubiquitous in aviation. The SR22 adds a bigger engine, glass-panel upkeep, and the periodic CAPS parachute repack — costs many owners share through co-ownership.' },
      { q: 'Which is the better first airplane?', a: 'For most new owners, the 172: it is forgiving, easy to insure, and inexpensive to run, which is why it is the default trainer. The SR22 is a high-performance cross-country machine better suited to a pilot ready to step up, ideally with type-specific transition training.' },
    ],
  },
  {
    slug: 'cessna-172-vs-piper-cherokee',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'piper', modelSlug: 'cherokee' },
    intro:
      'The Cessna 172 and the Piper Cherokee (PA-28) are the two default fixed-gear four-seat trainers, and the choice usually comes down to high wing versus low wing. The high-wing 172 gives shade, easy entry, and great downward visibility; the low-wing Cherokee feels a touch sportier and has a single cabin door. Both are simple, forgiving, and cheap to maintain with enormous parts and instructor support — making either an ideal first airplane or first partnership.',
    faqs: [
      { q: 'What is the main difference between a Cessna 172 and a Piper Cherokee?', a: 'Wing position. The 172 is a high-wing and the Cherokee (PA-28) a low-wing, but both are simple fixed-gear four-seat singles around 180 hp with similar cruise near 120 kt. The high wing gives shade and downward visibility; the low wing feels a touch sportier and uses a single cabin door.' },
      { q: 'Which is cheaper to maintain, a 172 or a Cherokee?', a: 'Both are among the least expensive four-seat singles to own, with huge parts supplies and near-universal mechanic familiarity, so running costs are very close. The choice usually comes down to high- versus low-wing preference rather than money.' },
      { q: 'Which is better for a first airplane or partnership?', a: 'Either is an excellent first airplane or first partnership — both are forgiving, well-supported, and economical to share. Pick by how you like to board the airplane and what you prefer to see out the window.' },
    ],
  },
  {
    slug: 'cessna-172-vs-cessna-182',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'cessna', modelSlug: '182' },
    intro:
      'The Cessna 172 Skyhawk and 182 Skylane share a high-wing layout and Cessna’s legendary support network, so the comparison is really about how much airplane you need. The 172 is lighter, cheaper to run, and the classic trainer. The 182 adds a bigger engine, a constant-speed prop, and the useful load to carry four adults with full fuel and bags — a genuine family hauler that costs more per hour to feed. Many owners step up from one to the other.',
    faqs: [
      { q: 'How much more capable is a Cessna 182 than a 172?', a: 'The 182 Skylane adds a 230 hp engine and a constant-speed prop (versus 180 hp and a fixed-pitch prop on the 172) and roughly 1,100 lb of useful load against about 880 lb — enough to carry four adults with full fuel and bags, which a 172 cannot always do.' },
      { q: 'Is a 182 much more expensive to operate than a 172?', a: 'Moderately, yes. The bigger engine burns more fuel and the constant-speed prop adds maintenance, so per-hour costs are higher. In exchange you get about 20 kt more cruise (~145 vs ~124 kt) and the extra load. Many owners step up from a 172 as their mission grows.' },
      { q: 'Should I buy a 172 or a 182?', a: 'Choose the 172 for training and light flying at the lowest cost; choose the 182 if you regularly fly four people, operate from higher or shorter fields, and want the extra useful load and speed.' },
    ],
  },
  {
    slug: 'cirrus-sr20-vs-cirrus-sr22',
    a: { makeSlug: 'cirrus', modelSlug: 'sr20' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Cirrus SR20 and SR22 share the same composite airframe, glass cockpit, and CAPS whole-airframe parachute, so a buyer is really choosing how much power and speed to pay for. The SR20’s smaller engine makes it the more attainable step-up and a common first Cirrus, with lower fuel and overhaul costs. The SR22’s 310 hp delivers markedly faster cruise and more useful load for serious cross-country flying — at a higher purchase price and running cost.',
    faqs: [
      { q: 'What is the difference between a Cirrus SR20 and SR22?', a: 'Mostly power. They share the same composite airframe, glass cockpit, and CAPS parachute, but the SR20 has about 215 hp (~155 kt cruise) while the SR22 has 310 hp (~183 kt) with more useful load.' },
      { q: 'Which Cirrus is cheaper to own?', a: 'The SR20. Its lower fuel burn and smaller engine to overhaul make it the more economical and attainable choice, and a common first Cirrus. The SR22 costs more to buy and run but flies faster and carries more.' },
      { q: 'Which is better for cross-country flying?', a: 'The SR22, thanks to its higher cruise speed and useful load. The SR20 is plenty for training and regional trips and gives the same glass panel and parachute for less money.' },
    ],
  },
  {
    slug: 'cirrus-sr22-vs-beechcraft-bonanza',
    a: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    b: { makeSlug: 'beechcraft', modelSlug: 'bonanza' },
    intro:
      'The Cirrus SR22 and the Beechcraft Bonanza are the two benchmark high-performance singles, and the decision splits along modern-composite versus classic-metal lines. The SR22 brings a parachute, a glass panel, fixed gear, and a car-like cabin in a newer composite airframe. The Bonanza is the storied retractable-gear traveler with top-tier build quality, ramp presence, and a six-seat cabin. Both are fast; expect premium upkeep either way, which is why both are so commonly co-owned.',
    faqs: [
      { q: 'Cirrus SR22 or Beechcraft Bonanza — which is faster?', a: 'They are close; both cruise in the 170s–180s kt on around 300–310 hp. The SR22 (~183 kt) edges the A36 Bonanza (~174 kt) on speed, while the Bonanza counters with retractable gear, a six-seat cabin, and classic build quality.' },
      { q: 'What is the biggest difference between them?', a: 'Philosophy. The SR22 is a modern composite single with fixed gear, a glass panel, and a CAPS whole-airframe parachute; the Bonanza is the storied metal retractable-gear traveler. One emphasizes modern safety technology, the other timeless build quality and cabin room.' },
      { q: 'Are they expensive to own?', a: 'Both are premium high-performance singles with premium upkeep — healthy fuel burn plus, on the Bonanza, retractable-gear maintenance, and on the SR22, the periodic CAPS parachute repack. That cost is exactly why both are so commonly co-owned.' },
    ],
  },
  {
    slug: 'cirrus-sr22-vs-cirrus-sr22t',
    a: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22t' },
    intro:
      'The Cirrus SR22 and the turbo-normalized SR22T are the same airframe with the same parachute and glass panel — the difference is altitude. The normally-aspirated SR22 is the simpler, less expensive choice that performs best down low. The SR22T adds a turbocharger and oxygen so it cruises in the high teens and flight levels, topping weather and crossing high terrain the SR22 cannot, in exchange for a higher fuel burn and a turbo-overhaul reserve. The right pick depends on whether you actually fly high and long.',
    faqs: [
      { q: 'What does the “T” in SR22T mean?', a: 'Turbo. The SR22T adds a turbocharger and oxygen to the same airframe, parachute, and glass panel, letting it cruise in the high teens and flight levels — up to around 213 kt at altitude — where the normally-aspirated SR22 cannot go.' },
      { q: 'Is the turbo worth it?', a: 'Only if you actually fly high and long. The SR22T tops weather and crosses high terrain better, but it burns more fuel and carries a turbo-overhaul reserve. A pilot who mostly flies low and short is usually better served by the simpler, cheaper SR22.' },
      { q: 'Do they cost the same to own?', a: 'No. The turbo SR22T has a higher fuel burn and the added turbo-overhaul reserve, so it costs more per hour than the normally-aspirated SR22 — the price of the altitude capability.' },
    ],
  },
  {
    slug: 'piper-cherokee-vs-piper-arrow',
    a: { makeSlug: 'piper', modelSlug: 'cherokee' },
    b: { makeSlug: 'piper', modelSlug: 'arrow' },
    intro:
      'The Piper Cherokee and the Piper Arrow are close cousins in the PA-28 family, so the comparison is about simplicity versus complexity. The fixed-gear Cherokee is one of the most economical and predictable singles to own — an ideal first airplane and first partnership. The Arrow adds retractable gear and a constant-speed prop, making it the classic complex-endorsement and commercial time-builder with a bit more speed, at a modest premium in insurance and maintenance.',
    faqs: [
      { q: 'What is the difference between a Piper Cherokee and an Arrow?', a: 'Complexity. Both are PA-28s, but the Cherokee is fixed-gear with a fixed-pitch prop while the Arrow adds retractable gear and a constant-speed prop, giving it a bit more speed (~137 vs ~120 kt) at a higher maintenance and insurance cost.' },
      { q: 'Which is cheaper to own?', a: 'The Cherokee. Fixed gear and simpler systems make it one of the most economical and predictable four-seat singles, ideal for a first airplane or partnership. The Arrow’s retractable gear adds inspection, insurance, and upkeep cost.' },
      { q: 'Why would I choose the Arrow?', a: 'For complex time. The Arrow is the classic complex-endorsement and commercial time-builder; if you want retractable-gear and constant-speed-prop experience plus a little more speed, it is the natural step up from a Cherokee.' },
    ],
  },
  {
    slug: 'cessna-182-vs-cirrus-sr22',
    a: { makeSlug: 'cessna', modelSlug: '182' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Cessna 182 Skylane and the Cirrus SR22 are both four-seat cross-country singles, but they represent two different eras. The high-wing 182 is a rugged, load-hauling, fixed-gear classic that flies into rough strips and carries a real family with bags. The SR22 is faster and more modern — composite airframe, glass panel, side-yoke, and a CAPS parachute — built for covering distance quickly. The 182 generally costs less to buy and run; the SR22 trades that for speed and technology.',
    faqs: [
      { q: 'Is the Cirrus SR22 faster than a Cessna 182?', a: 'Yes, noticeably. The SR22’s 310 hp gives ~183 kt cruise versus about 145 kt for the 230 hp Cessna 182. The 182 trades speed for rugged load-hauling ability and a lower price to buy and run.' },
      { q: 'Which is cheaper to own, a 182 or an SR22?', a: 'The 182, generally. Its fixed gear and simpler systems keep operating and maintenance costs below the SR22, which adds glass-panel upkeep and the CAPS parachute repack. The SR22’s premium buys speed and modern technology.' },
      { q: 'Which is the better family cross-country airplane?', a: 'Both seat four comfortably. Choose the 182 for rugged short- and rough-field capability, big useful load, and lower cost; choose the SR22 for speed, a glass panel, and the CAPS parachute on longer trips.' },
    ],
  },
  {
    slug: 'mooney-m20-vs-cirrus-sr22',
    a: { makeSlug: 'mooney', modelSlug: 'm20' },
    b: { makeSlug: 'cirrus', modelSlug: 'sr22' },
    intro:
      'The Mooney M20 and the Cirrus SR22 are two very different answers to the same question: how do I cross the country quickly in a single? The Mooney is the efficiency benchmark — a low, slick retractable that posts ~160 kt on a 200 hp engine and modest fuel burn, in a deliberately snug cabin. The SR22 throws 310 hp and a wide composite cabin at the problem, cruising faster (~183 kt) with a glass panel and a CAPS whole-airframe parachute, but burning far more fuel. One wins on miles-per-gallon; the other on speed, space, and technology.',
    faqs: [
      { q: 'Which is more fuel-efficient, a Mooney M20 or a Cirrus SR22?', a: 'The Mooney, by a wide margin. Its 200 hp engine and slick, low-drag airframe deliver ~160 kt on far less fuel than the SR22’s 310 hp, which trades that economy for ~183 kt cruise and a roomier cabin.' },
      { q: 'Is the Cirrus SR22 faster than a Mooney M20?', a: 'Yes. The SR22 cruises around 183 kt against roughly 160 kt for the M20. The Mooney closes much of the real-world gap on fuel burn and range, but the SR22 is the faster airplane outright and carries more.' },
      { q: 'Which has the bigger cabin?', a: 'The SR22. Its wide composite cabin seats four to five with easier entry, while the Mooney’s low, tightly cowled fuselage is famously snug. The Mooney trades cabin room for the efficiency that defines it; the SR22 trades fuel for space and the CAPS parachute.' },
    ],
  },
  {
    slug: 'mooney-m20-vs-beechcraft-bonanza',
    a: { makeSlug: 'mooney', modelSlug: 'm20' },
    b: { makeSlug: 'beechcraft', modelSlug: 'bonanza' },
    intro:
      'The Mooney M20 and the Beechcraft Bonanza are both classic metal retractable-gear travelers, but they aim at different owners. The Mooney is the efficiency champion — ~160 kt on a 200 hp engine and a low fuel burn, in a tight four-seat cabin built to go far on a budget. The Bonanza is the benchmark high-performance single: 300 hp, ~174 kt, a roomy four-to-six-seat cabin, and top-of-class build quality and ramp presence, at a higher purchase and running cost. The Mooney maximizes miles per gallon; the Bonanza maximizes cabin, load, and prestige.',
    faqs: [
      { q: 'Mooney M20 or Beechcraft Bonanza — which is cheaper to own?', a: 'The Mooney, generally. Its 200 hp engine sips far less fuel than the Bonanza’s 300 hp, and both carry the retractable-gear inspection and insurance line. The Bonanza costs more to buy and feed in exchange for a bigger cabin, more load, and more speed.' },
      { q: 'Which is faster, the M20 or the Bonanza?', a: 'The Bonanza, at about 174 kt versus roughly 160 kt for the M20 — but the Mooney achieves its speed on a much smaller engine, so the gap on fuel burn runs the other way. Both are genuine ~1,000 nm-class cross-country singles.' },
      { q: 'Which has more cabin and useful load?', a: 'The Bonanza. Its four-to-six-seat cabin and ~1,050 lb useful load outclass the Mooney’s snug four-seat layout, making the Bonanza the better choice for carrying people and bags while the Mooney wins on efficiency.' },
    ],
  },
  {
    slug: 'piper-comanche-vs-piper-arrow',
    a: { makeSlug: 'piper', modelSlug: 'comanche' },
    b: { makeSlug: 'piper', modelSlug: 'arrow' },
    intro:
      'The Piper Comanche and the Piper Arrow are both low-wing retractable-gear Pipers, but they come from different eras and missions. The PA-24 Comanche is the older, faster traveler — 250 hp, ~160 kt, and big tanks for genuine long-leg range — with a dedicated type community supporting an out-of-production airframe. The PA-28R Arrow is the simpler, more plentiful complex trainer: 200 hp, ~137 kt, and the classic stepping-stone to a retractable-gear and constant-speed-prop endorsement. The Comanche is more airplane for serious travel; the Arrow is easier to insure, support, and step up into.',
    faqs: [
      { q: 'Is the Piper Comanche faster than the Arrow?', a: 'Yes. The 250 hp Comanche cruises around 160 kt against about 137 kt for the 200 hp Arrow, and its larger optional tanks give longer legs. The Arrow trades that speed for simpler ownership and easier parts and insurance.' },
      { q: 'Which is easier and cheaper to own?', a: 'The Arrow. It is more plentiful, simpler, and still in widespread training use, so parts, mechanics, and insurance are easier to come by. The Comanche has been out of production for decades, so some parts run through type clubs and specialists — a knowledgeable mechanic and a shared maintenance kitty matter.' },
      { q: 'Which should I choose?', a: 'Choose the Arrow for a forgiving, well-supported first complex airplane or commercial time-builder. Choose the Comanche if you want more speed, range, and capability for the money and will join its active type community to keep it well maintained.' },
    ],
  },
  {
    slug: 'beechcraft-bonanza-vs-beechcraft-baron',
    a: { makeSlug: 'beechcraft', modelSlug: 'bonanza' },
    b: { makeSlug: 'beechcraft', modelSlug: 'baron' },
    intro:
      'The Beechcraft Bonanza and Baron are siblings — the Baron is essentially the twin-engine evolution of the Bonanza — so this is the classic single-versus-twin decision. The A36 Bonanza is the benchmark high-performance single: 300 hp, ~174 kt, six seats, and the lowest cost of the two to buy and run. The Baron 58 adds a second 300 hp engine for redundancy and ~200 kt cruise with a much bigger useful load and range, at roughly double the fuel, two overhaul reserves, and twin-rated insurance. You are really choosing whether a second engine is worth the cost.',
    faqs: [
      { q: 'What is the difference between a Bonanza and a Baron?', a: 'The Baron is the twin-engine version of the Bonanza lineage. The A36 Bonanza is a 300 hp single cruising ~174 kt; the Baron 58 has two 300 hp engines (600 hp total), cruises around 200 kt, and carries far more — with the cost and complexity of a second engine.' },
      { q: 'Is the Baron much more expensive to own than a Bonanza?', a: 'Considerably. The Baron burns roughly twice the fuel, carries two engines to overhaul, and needs a multi-engine rating and twin insurance, so it costs far more to run solo than a Bonanza — which is exactly why Barons are so commonly co-owned across several partners.' },
      { q: 'Should I step up from a Bonanza to a Baron?', a: 'Step up if you want twin-engine redundancy for night, weather, or over-water flying and routinely fill six seats with bags over long distances. If your mission fits a single, the Bonanza delivers most of the cabin and speed for far less money.' },
    ],
  },
  {
    slug: 'cessna-150-vs-cessna-172',
    a: { makeSlug: 'cessna', modelSlug: '150' },
    b: { makeSlug: 'cessna', modelSlug: '172' },
    intro:
      'The Cessna 150 and Cessna 172 are the two airplanes most pilots learn in, so the comparison is really about how much airplane you need first. The two-seat 150 is the cheapest practical way into ownership — a 100 hp trainer that sips fuel and is cheap to maintain, but tops out around 100 kt and carries only two people and light bags. The four-seat 172 Skyhawk adds an 80 hp-bigger engine, real back seats, more useful load, and ~124 kt cruise, making it the do-everything family trainer at a modestly higher running cost. Many owners start in a 150 and step up to a 172.',
    faqs: [
      { q: 'What is the difference between a Cessna 150 and a 172?', a: 'Size and power. The 150 is a two-seat, 100 hp trainer cruising ~100 kt; the 172 Skyhawk is a four-seat, 180 hp airplane cruising ~124 kt with much more useful load. Both are high-wing, fixed-gear, and famously easy to fly and support.' },
      { q: 'Which is cheaper to own, a 150 or a 172?', a: 'The 150. Its small 100 hp engine has among the lowest fuel and operating costs in the fleet, making it the cheapest practical way into aircraft ownership. The 172 costs a bit more to run in exchange for two more seats, more load, and more speed.' },
      { q: 'Should I buy a 150 or a 172?', a: 'Choose the 150 to build hours and fly locally at the lowest possible cost with one passenger. Choose the 172 if you need to carry up to four people, want more useful load and cross-country speed, and want one airplane that does it all.' },
    ],
  },
  {
    slug: 'cessna-182-vs-beechcraft-bonanza',
    a: { makeSlug: 'cessna', modelSlug: '182' },
    b: { makeSlug: 'beechcraft', modelSlug: 'bonanza' },
    intro:
      'The Cessna 182 Skylane and the Beechcraft Bonanza are both four-seat-plus cross-country singles, but they sit a class apart in speed and price. The high-wing 182 is a rugged, fixed-gear hauler that carries four adults with bags, flies into rougher strips, and stays relatively simple and affordable to own. The Bonanza is the benchmark high-performance single — 300 hp, retractable gear, a four-to-six-seat cabin, top-tier build quality and ~174 kt cruise — at a higher purchase price and premium upkeep. One maximizes capability per dollar; the other maximizes speed, cabin, and prestige.',
    faqs: [
      { q: 'Is a Beechcraft Bonanza faster than a Cessna 182?', a: 'Yes, by a clear margin. The 300 hp Bonanza cruises around 174 kt against about 145 kt for the 230 hp Cessna 182. The 182 trades that speed for fixed-gear simplicity, rugged short-field ability, and lower cost.' },
      { q: 'Which is cheaper to own, a 182 or a Bonanza?', a: 'The 182, generally. Its fixed gear and simpler systems keep maintenance and insurance below the Bonanza, whose retractable gear, bigger engine, and premium parts raise upkeep — costs many Bonanza owners share through co-ownership.' },
      { q: 'Which should I choose?', a: 'Choose the 182 for rugged, economical four-seat hauling from shorter or rougher fields; choose the Bonanza for roughly 30 kt more speed, a larger cabin, and top-class build quality if the higher running cost fits your mission.' },
    ],
  },
  {
    slug: 'mooney-m20-vs-piper-comanche',
    a: { makeSlug: 'mooney', modelSlug: 'm20' },
    b: { makeSlug: 'piper', modelSlug: 'comanche' },
    intro:
      'The Mooney M20 and the Piper Comanche are two efficient, four-seat retractable-gear travelers that post nearly identical ~160 kt cruise and ~1,000 nm range — but they get there differently. The Mooney does it on just 200 hp, with a low, slick airframe and a famously snug cabin, making it the fuel-economy benchmark. The Comanche uses a bigger 250 hp engine for a much larger useful load and a roomier cabin, with optional long-range tanks, at the cost of more fuel and a parts supply that runs through type clubs since it left production decades ago. One wins on miles per gallon; the other on load and cabin.',
    faqs: [
      { q: 'Mooney M20 or Piper Comanche — which is more fuel-efficient?', a: 'The Mooney. It matches the Comanche’s ~160 kt cruise on just 200 hp versus the Comanche’s 250 hp, so it burns noticeably less fuel for the same speed. The Comanche spends that extra power on a much bigger useful load.' },
      { q: 'Which carries more?', a: 'The Comanche, by a wide margin — about 1,250 lb of useful load against roughly 900 lb for the Mooney, plus a roomier cabin and optional long-range tanks. The Mooney trades cabin and load for the efficiency that defines it.' },
      { q: 'Which is easier to own?', a: 'The Mooney has the broader, more current parts supply, while the Comanche has been out of production for decades, so some parts come through type clubs and specialists. Both are retractables that add a gear inspection and an insurance line, so a shared maintenance kitty helps on either.' },
    ],
  },
  {
    slug: 'piper-saratoga-vs-cessna-182',
    a: { makeSlug: 'piper', modelSlug: 'saratoga' },
    b: { makeSlug: 'cessna', modelSlug: '182' },
    intro:
      'The Piper Saratoga and the Cessna 182 Skylane are both family haulers, but they answer different questions about how much cabin you need. The Saratoga is the six-seat flagship of the PA-32 line — 300 hp, a genuine third row, and around 1,350 lb of useful load to actually fill it — a true big-cabin IFR traveler. The 182 is the four-seat workhorse: a high-wing, fixed-gear single that carries four adults with bags simply and affordably. The Saratoga gives you two more seats, more speed, and more load; the 182 gives most families everything they need for far less fuel.',
    faqs: [
      { q: 'What is the main difference between a Saratoga and a 182?', a: 'Cabin size. The Saratoga is a six-seat PA-32 with about 1,350 lb of useful load and a third row, while the 182 is a four-seat airplane with roughly 1,100 lb. The Saratoga is the choice when you regularly carry more than four people.' },
      { q: 'Is the Saratoga much more expensive to operate than a 182?', a: 'Yes. Its 300 hp engine and 102-gallon fuel system burn considerably more than the 230 hp 182, which is exactly why big-cabin Saratogas are so often co-owned across a few families. The 182 is cheaper to buy and feed.' },
      { q: 'Which is faster?', a: 'The Saratoga, at about 160 kt versus roughly 145 kt for the 182 — and it carries more while doing it. The 182 narrows the real-world gap on fuel cost and simplicity, especially in its fixed-gear form.' },
    ],
  },
  {
    slug: 'cessna-180-vs-cessna-182',
    a: { makeSlug: 'cessna', modelSlug: '180' },
    b: { makeSlug: 'cessna', modelSlug: '182' },
    intro:
      'The Cessna 180 Skywagon and the Cessna 182 Skylane are mechanically close cousins — the same ~230 hp class, similar ~145 kt cruise and useful load — so the real decision is the landing gear. The 180 is a conventional-gear (tailwheel) hauler that built Cessna’s backcountry reputation: rough-strip and float capable, durable, and famous for holding its value, but demanding genuine tailwheel proficiency. The 182 is the nosewheel Skylane — easier to fly and insure, far more plentiful, and the default family IFR cross-country single. Same basic airplane, two very different missions.',
    faqs: [
      { q: 'What is the difference between a Cessna 180 and a 182?', a: 'Mainly the landing gear. Both are high-wing singles around 230 hp with similar ~145 kt cruise and useful load, but the 180 is a conventional-gear (tailwheel) Skywagon and the 182 is the nosewheel Skylane. The tailwheel is the 180’s whole point — and its main learning curve.' },
      { q: 'Which is better for backcountry or float flying?', a: 'The 180. Its tailwheel gear, durable airframe, and float capability make it a backcountry and bush favorite, where the nosewheel 182 is happier on improved runways as a stable IFR cross-country airplane.' },
      { q: 'Which is easier and cheaper to insure?', a: 'The 182, generally. Its nosewheel is more forgiving and far more pilots are current in it, so it is easier to insure and transition into. The 180 needs genuine tailwheel proficiency and a tailwheel insurance policy.' },
    ],
  },
  {
    slug: 'piper-cub-vs-bellanca-citabria',
    a: { makeSlug: 'piper', modelSlug: 'cub' },
    b: { makeSlug: 'bellanca', modelSlug: 'citabria' },
    intro:
      'The Piper Cub and the Bellanca Citabria are the two classic fabric-covered, tandem-seat taildraggers pilots dream about — and the choice is about how much you want them to do. The J-3 Cub is the icon: 65 hp, ~65 kt, tiny tanks, and pure low-and-slow simplicity, bought with the heart as much as the head. The Citabria adds a 150 hp engine, ~105 kt cruise, more range, and real aerobatic capability (its name is "airbatic" spelled backward), making it a more versatile tailwheel and basic-aerobatics trainer. Both teach stick-and-rudder flying; the Citabria simply does more of it, faster.',
    faqs: [
      { q: 'Is the Citabria faster than a Piper Cub?', a: 'Yes, considerably. The 150 hp Citabria cruises around 105 kt with usable range, while the 65 hp J-3 Cub ambles at about 65 kt on tiny tanks. The Cub is a local-fun classic; the Citabria can actually travel a bit.' },
      { q: 'Which is better for learning tailwheel or aerobatics?', a: 'Both are excellent tailwheel trainers, but the Citabria is aerobatic-capable and has the power for basic aerobatics and spin training, while the Cub is pure low-and-slow stick-and-rudder fun without the aerobatic envelope.' },
      { q: 'Which is cheaper to own?', a: 'Both are simple fabric taildraggers whose main costs are fabric upkeep and tailwheel-rated insurance. The Cub’s tiny 65 hp engine and 12-gallon tank make it the cheaper of the two to feed; the Citabria burns more for its extra speed and capability.' },
    ],
  },
  {
    slug: 'cessna-172-vs-grumman-aa-5',
    a: { makeSlug: 'cessna', modelSlug: '172' },
    b: { makeSlug: 'grumman', modelSlug: 'aa-5' },
    intro:
      'The Cessna 172 and the Grumman AA-5 (Cheetah/Tiger) are both fixed-gear four-seat singles, so the comparison comes down to ubiquity versus sportiness. The 172 is the most-produced airplane ever — forgiving, easy to insure, and supported by parts and instructors everywhere, which is why it is the default trainer and first airplane. The low-drag Grumman, with its sliding canopy and slick airframe, is quicker for the same horsepower and feels sportier to fly, but rides on a much smaller fleet and support network. One is the safe, universally-supported choice; the other trades a little support for speed and character.',
    faqs: [
      { q: 'Is the Grumman Tiger faster than a Cessna 172?', a: 'Yes. The 180 hp AA-5 Tiger cruises around 139 kt against about 124 kt for the 180 hp Cessna 172, thanks to the Grumman’s low-drag airframe and sliding canopy — meaningfully more speed on the same power and fixed gear.' },
      { q: 'Which is easier to own and resell?', a: 'The 172, by a wide margin. As the most-produced aircraft ever it has unmatched parts, mechanic, and instructor support and is the easiest single to insure and resell. The Grumman flies on a smaller fleet, so plan for a more specialized support network in exchange for its speed and character.' },
      { q: 'Which is the better first four-seater?', a: 'For most new owners the 172, for its forgiving handling, easy insurance, and universal support. The AA-5 suits a pilot who wants a fun, simple, economical traveler with more speed — the 180 hp Tiger is the faster climber, the 150 hp Cheetah the more economical, so pick by mission and budget.' },
    ],
  },
  {
    slug: 'grumman-aa-5-vs-piper-cherokee',
    a: { makeSlug: 'grumman', modelSlug: 'aa-5' },
    b: { makeSlug: 'piper', modelSlug: 'cherokee' },
    intro:
      'The Grumman AA-5 (Cheetah/Tiger) and the Piper Cherokee (PA-28) are both fixed-gear four-seat singles around 180 hp, so the choice is really speed versus load and support. The slick, sliding-canopy Grumman is the quicker of the two for the same power and has a sporty feel. The low-wing Cherokee carries more and rides on one of the largest parts-and-instructor networks in aviation, second only to the 172. Both are simple and economical to own; you are choosing between a little more speed or a little more load and support.',
    faqs: [
      { q: 'What is the difference between a Grumman Tiger and a Piper Cherokee?', a: 'Both are fixed-gear 180 hp four-seaters, but the Grumman AA-5’s low-drag airframe and sliding canopy make it noticeably faster — about 139 kt cruise (Tiger) versus roughly 120 kt for the PA-28-180 — while the Cherokee offers more useful load and a much larger support network.' },
      { q: 'Which one carries more?', a: 'The Cherokee — about 1,000 lb of useful load against roughly 900 lb for the AA-5 — and it is among the most common, easiest-to-support four-seat trainers after the 172. The Grumman trades a little load for more speed on the same power.' },
      { q: 'Which is easier and cheaper to own?', a: 'Both are simple, economical fixed-gear singles. The Cherokee’s edge is its enormous parts and mechanic network, which keeps maintenance predictable and resale easy. The Grumman is also inexpensive to run — especially the 150 hp Cheetah — but flies on a smaller fleet, so factor in a more specialized support base.' },
    ],
  },
  {
    slug: 'cessna-150-vs-piper-cub',
    a: { makeSlug: 'cessna', modelSlug: '150' },
    b: { makeSlug: 'piper', modelSlug: 'cub' },
    intro:
      'The Cessna 150 and the Piper J-3 Cub are both two-seat classics, but they answer very different questions. The 150 is the practical, nosewheel metal trainer — about 100 kt on a fuel-sipping 100 hp engine, the cheapest practical way into ownership and hour-building, with parts everywhere. The Cub is the iconic fabric, tandem-seat taildragger: 65 hp, around 65 kt, tiny tanks, and pure low-and-slow charm, usually bought with the heart as much as the head. One is the sensible everyday trainer; the other is a stick-and-rudder classic you keep flying for the joy of it.',
    faqs: [
      { q: 'Cessna 150 or Piper Cub for learning to fly?', a: 'Most students train in the 150: it has a forgiving nosewheel, cruises around 100 kt, carries more range, and is the cheapest practical way into ownership. The J-3 Cub is a tailwheel taildragger flown low and slow at about 65 kt — wonderful for stick-and-rudder skills and a tailwheel endorsement, but not a practical everyday trainer.' },
      { q: 'Which is cheaper to own?', a: 'Both are inexpensive. The 100 hp Cessna 150 sips fuel and is all-metal with huge parts support, giving it among the lowest operating costs in the fleet. The 65 hp Cub burns even less but adds fabric upkeep and tailwheel-rated insurance, and is often bought as a classic to keep flying rather than as a budget calculation.' },
      { q: 'Can either fly cross-country?', a: 'Not really. The 150 manages short hops at about 100 kt with roughly 420 nm of range but a cramped two-seat cabin; the Cub, at about 65 kt with around 190 nm range on 12 gallons, is a local-fun airplane. Both are two-seats-and-light-bags machines, not travelers.' },
    ],
  },
]

const BY_SLUG = new Map(COMPARISONS.map((c) => [c.slug, c]))

export function getComparison(slug: string): Comparison | undefined {
  return BY_SLUG.get(slug)
}

export function getAllComparisonSlugs(): string[] {
  return COMPARISONS.map((c) => c.slug)
}

/** Resolve a ModelRef to its full curated SeoMakeModel (with specTable/highlights),
 *  or null if it isn't curated (should never happen for a vetted COMPARISONS entry). */
export function resolveComparisonModel(ref: ModelRef): SeoMakeModel | null {
  return getMakeModel(ref.makeSlug, ref.modelSlug)
}

/** Curated comparisons that feature a given model family (either side) — used to
 *  link from the model hub page into this family. */
export function comparisonsForModel(makeSlug: string, modelSlug: string): Comparison[] {
  const m = makeSlug.toLowerCase()
  const md = modelSlug.toLowerCase()
  return COMPARISONS.filter(
    (c) =>
      (c.a.makeSlug === m && c.a.modelSlug === md) ||
      (c.b.makeSlug === m && c.b.modelSlug === md)
  )
}

/** Short display label for a comparison, e.g. "Cessna 172 vs Cirrus SR22".
 *  Returns null if either side fails to resolve (so callers can skip it). */
export function comparisonLabel(c: Comparison): string | null {
  const a = resolveComparisonModel(c.a)
  const b = resolveComparisonModel(c.b)
  if (!a || !b) return null
  return `${a.make} ${a.model} vs ${b.make} ${b.model}`
}

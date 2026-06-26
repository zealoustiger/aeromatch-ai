// Curated "mission" landing pages for `/aircraft/mission/[mission]`.
//
// Each mission is a real, high-intent buyer search ("glass cockpit aircraft for
// sale", "tailwheel aircraft for sale", …) that maps onto the EXISTING
// `fetchAircraftPage` filters — no new query logic, no new DB columns. This is a
// FIXED, hand-curated set (like the guides), not a programmatic explosion: every
// page carries substantively-unique editorial guidance PLUS the live grid of real
// matching listings, so none is a thin/doorway page.
//
// The `filters` map onto the same keys `fetchAircraftPage` already understands:
//   q       → title/description keyword (ilike OR) — for equipment/type intents
//   max_tt  → airframe total time ceiling (lte ttaf) — for the low-time intent
// Keep these honest: only filters that genuinely select the named kind of aircraft.

export interface MissionFilters {
  q?: string
  max_tt?: string
  min_year?: string
  max_price?: string
}

export interface Mission {
  /** URL slug under /aircraft/mission/. */
  slug: string
  /** Short label for chips/links, e.g. "Glass cockpit". */
  label: string
  /** Page H1. */
  h1: string
  /** Absolute <title> (bypasses the "%s | ClubHanger" template). */
  metaTitle: string
  metaDescription: string
  /** One-line sub-header under the H1. */
  blurb: string
  /** 2-3 paragraphs of unique buyer guidance — distinct per mission. */
  intro: string[]
  /**
   * Curated, evergreen Q&As for this mission. Rendered as a visible accordion
   * AND emitted as FAQPage JSON-LD, so the visible text must match the structured
   * data 1:1. No fabricated stats / live counts → never goes stale. Distinct in
   * wording from `intro` above.
   */
  faqs: { q: string; a: string }[]
  /** Existing fetchAircraftPage filter keys applied to the live listing grid. */
  filters: MissionFilters
}

export const MISSIONS: Mission[] = [
  {
    slug: 'glass-cockpit',
    label: 'Glass cockpit',
    h1: 'Glass Cockpit Aircraft for Sale',
    metaTitle: 'Glass Cockpit Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse general aviation aircraft for sale with glass cockpit avionics — Garmin G1000, Aspen, and similar integrated displays. Aggregated from across the web.',
    blurb: 'Aircraft equipped with integrated digital flight displays.',
    intro: [
      'A glass cockpit replaces the traditional cluster of mechanical "steam gauge" instruments with one or more large digital displays. Integrated suites like the Garmin G1000, Avidyne Entegra, or an Aspen Evolution retrofit put your attitude, navigation, engine data, traffic, and weather on the same screens — which is why glass-panel aircraft are popular with pilots who fly cross-country and in instrument conditions, where the reduced scan and built-in situational awareness genuinely lower the workload.',
      'Glass also tends to hold its value and broaden the buyer pool at resale, but the panel is where a lot of the money lives, so it deserves close attention. Confirm the navigators are WAAS-capable and ADS-B Out compliant, ask when the databases were last current, and find out whether the displays are factory-integrated or a later retrofit — retrofits vary widely in capability and in how cleanly they were installed.',
      'The listings below are the aircraft in our inventory whose title or description calls out glass-panel avionics. Always verify the exact equipment on the source listing and, ideally, in the aircraft logs before you buy — avionics descriptions in classified listings are a starting point, not a guarantee.',
    ],
    faqs: [
      {
        q: 'What counts as a glass cockpit?',
        a: 'A glass cockpit uses one or more electronic flight displays in place of individual mechanical gauges. It can be a factory-integrated suite such as the Garmin G1000 or Avidyne Entegra, or a retrofit like an Aspen Evolution or a Garmin G3X/G5 panel. The common thread is that primary flight, navigation, and often engine information are shown on digital screens rather than round dials.',
      },
      {
        q: 'Is a glass-panel aircraft worth the extra cost?',
        a: 'For pilots who fly cross-country or in instrument conditions, the reduced scan, moving-map awareness, and integrated traffic and weather can genuinely lower workload, and glass tends to broaden the resale buyer pool. For a fair-weather local flyer it may be more capability than you need. Weigh how you actually fly against the price premium and the cost of keeping the avionics current.',
      },
      {
        q: 'What should I check on the avionics before buying?',
        a: 'Confirm the navigator is WAAS-capable and that ADS-B Out is installed and compliant, ask when the navigation databases were last updated, and find out whether the panel is factory-integrated or a later retrofit. Retrofits vary widely in capability and installation quality, so review the avionics logbook entries and any STC paperwork.',
      },
      {
        q: 'Do I need extra training to fly glass?',
        a: 'Often yes. Transitioning from steam gauges to an integrated display is a real learning curve, and many insurers want to see specific make-and-model avionics training before they will quote a favorable rate. Budget for transition instruction, especially if you are also new to the airframe.',
      },
    ],
    filters: { q: 'glass' },
  },
  {
    slug: 'ifr',
    label: 'IFR-equipped',
    h1: 'IFR-Equipped Aircraft for Sale',
    metaTitle: 'IFR-Equipped Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse IFR-equipped general aviation aircraft for sale — instrument-capable singles and twins for serious cross-country travel. Aggregated from across the web.',
    blurb: 'Instrument-capable aircraft for all-weather cross-country flying.',
    intro: [
      'An IFR-equipped aircraft is set up to be flown under Instrument Flight Rules — in cloud and low visibility — rather than only in good visual conditions. In practice that means a certified instrument navigation system, the required flight instruments, and increasingly a coupled autopilot to fly approaches and hold headings while you manage the flight. For pilots who actually want to use an aircraft for travel, IFR capability is what turns a fair-weather toy into dependable transportation.',
      'Equipment alone is not the whole story. For the aircraft to be legal in the system its pitot-static and transponder checks must be current, and any GPS used for IFR navigation has to be an approved unit with up-to-date databases. Ask about the most recent avionics certifications, whether ADS-B Out is installed, and what the autopilot can and cannot do — a two-axis autopilot with approach coupling is a very different airplane to hand-fly than a wing-leveler.',
      'The listings below are the aircraft in our inventory described as IFR-capable. Treat the description as a lead and confirm the panel, certifications, and logbooks on the source listing before making an offer.',
    ],
    faqs: [
      {
        q: 'What makes an aircraft IFR-equipped?',
        a: 'At a minimum it carries the instruments and a certified navigation system required to fly under Instrument Flight Rules, with current pitot-static and transponder checks. In practice most buyers also want an IFR-approved GPS with up-to-date databases and an autopilot capable of holding headings and flying approaches, since that is what makes instrument flying manageable single-pilot.',
      },
      {
        q: 'Is an IFR aircraft a good first airplane?',
        a: 'It can be, even if you are not yet instrument-rated — an IFR-capable aircraft gives you room to grow into the rating, and the equipment is useful for situational awareness in visual flight too. Just price in the cost of keeping the avionics certified and current, and do not assume you need to use the IFR capability immediately.',
      },
      {
        q: 'What certifications should be current on an IFR aircraft?',
        a: 'Ask for the most recent pitot-static and transponder certification dates (commonly required every 24 calendar months for IFR), confirm any GPS used for IFR is an approved unit with current databases, and verify ADS-B Out compliance. Check the avionics logbook for the supporting entries rather than relying on the listing text.',
      },
      {
        q: 'Does IFR-equipped mean the autopilot flies approaches?',
        a: 'Not necessarily. Capability ranges from a simple wing-leveler to a two-axis autopilot with altitude hold and coupled approaches. A coupled autopilot is a very different airplane to fly single-pilot in the clouds than a basic one, so confirm exactly what the installed system can do before you buy.',
      },
    ],
    filters: { q: 'IFR' },
  },
  {
    slug: 'tailwheel',
    label: 'Tailwheel',
    h1: 'Tailwheel Aircraft for Sale',
    metaTitle: 'Tailwheel Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse tailwheel (conventional-gear) aircraft for sale — taildraggers for backcountry, bush, and stick-and-rudder flying. Aggregated from across the web.',
    blurb: 'Conventional-gear taildraggers for backcountry and stick-and-rudder flying.',
    intro: [
      'A tailwheel aircraft — a "taildragger" — carries its third wheel under the tail instead of the nose. That conventional-gear layout sits behind much of backcountry and bush flying: it handles rough, unimproved strips well, keeps the propeller higher off the ground, and rewards precise stick-and-rudder technique. Classic taildraggers also have a devoted following simply because they are a joy to fly.',
      'The trade-off is on the ground. Tailwheel aircraft are less forgiving during takeoff and landing and can ground-loop if mishandled, so a tailwheel endorsement is required and insurers will look closely at your time-in-type and recent experience. If you are stepping into one for the first time, budget for transition training and expect the insurance conversation to focus on it.',
      'The listings below are the aircraft in our inventory described as tailwheel or conventional-gear. Confirm the gear configuration, recent damage history, and any required endorsements on the source listing and in the logs before you commit.',
    ],
    faqs: [
      {
        q: 'Do I need a tailwheel endorsement?',
        a: 'Yes. To act as pilot in command of a tailwheel aircraft you need a one-time logbook endorsement from an instructor after training in takeoffs, landings, and ground handling. There is no expiration on the endorsement itself, but insurers will still look at your recent tailwheel experience.',
      },
      {
        q: 'Why are tailwheel aircraft harder to land?',
        a: 'With the main wheels ahead of the center of gravity, a taildragger is directionally less stable on the ground than a nosewheel aircraft and can ground-loop if a swerve is not corrected promptly. That is exactly why they reward precise stick-and-rudder technique, and why transition training matters before you fly one solo.',
      },
      {
        q: 'What are tailwheel aircraft good for?',
        a: 'The conventional-gear layout handles rough, unimproved, and short backcountry strips well and keeps the propeller higher off the ground, which is why taildraggers dominate bush and backcountry flying. Many pilots also simply enjoy them for the hands-on flying experience and the classic types available.',
      },
      {
        q: 'Will insurance cost more for a taildragger?',
        a: 'Often, especially for a low-time-in-type pilot, because the ground-handling risk is higher. Underwriters typically focus on your total time, tailwheel time, and recent experience, and may require a number of dual hours before solo. Get an insurance quote before you commit to a purchase.',
      },
    ],
    filters: { q: 'tailwheel' },
  },
  {
    slug: 'low-time',
    label: 'Low-time',
    h1: 'Low-Time Aircraft for Sale',
    metaTitle: 'Low-Time Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse low-time general aviation aircraft for sale — airframes with under 1,500 hours total time. Aggregated from across the web.',
    blurb: 'Airframes with under 1,500 hours total time.',
    intro: [
      'A "low-time" aircraft has accumulated relatively few hours on the airframe over its life. The listings below are filtered to aircraft with under 1,500 hours total time (TTAF). Lower airframe time can mean less wear on the structure and a longer remaining service life, which is part of why low-time aircraft often command a premium — but total time is only one number, and a low figure is not automatically a bargain.',
      'Read the total airframe time alongside the engine time. An airframe with few hours can still have a high-time or run-out engine, or the reverse — a freshly overhauled engine on a high-time airframe. What matters for ownership cost is usually time since major overhaul (SMOH) and how the aircraft has been used and stored: an engine that has sat unflown for years can be in worse shape than one flown regularly, regardless of the hour count.',
      'Use the total-time figure here as a filter, then verify the engine times, overhaul history, and complete logbooks on the source listing before you buy. The numbers in aggregated classifieds are a starting point, not a substitute for the logs.',
    ],
    faqs: [
      {
        q: 'What counts as a low-time aircraft?',
        a: 'There is no official cutoff, but "low time" generally refers to a relatively low total time on the airframe (TTAF) for the type and age. The listings here are filtered to airframes under 1,500 hours total time. Treat that as a starting point and read it in the context of the aircraft’s age and how it has been used.',
      },
      {
        q: 'Is a low-time aircraft always a better buy?',
        a: 'Not automatically. Low airframe time can mean less structural wear and a longer remaining service life, which is why these aircraft often command a premium — but total time is only one number. An airframe with few hours can still have a run-out or neglected engine, so the value depends on the whole picture, not the headline figure.',
      },
      {
        q: 'How does airframe time relate to engine time?',
        a: 'They are independent. The engine may have been overhauled or replaced one or more times during the airframe’s life, so a low-TTAF aircraft can have a high-time engine, and a high-TTAF aircraft can have a freshly overhauled one. For ownership cost, time since major overhaul (SMOH) usually matters more than total airframe time.',
      },
      {
        q: 'Can an aircraft sit too long and become low-time in a bad way?',
        a: 'Yes. An engine that has sat unflown for years can corrode internally and be in worse condition than one flown regularly, regardless of the hour count. Look at how recently and how consistently the aircraft has been flown and stored, not just the low number on the tach.',
      },
    ],
    filters: { max_tt: '1500' },
  },
  {
    slug: 'experimental',
    label: 'Experimental',
    h1: 'Experimental Aircraft for Sale',
    metaTitle: 'Experimental Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse experimental amateur-built and kit-built aircraft for sale — Van\'s RV, CubCrafters, Kitfox, Zenith, and more. Aggregated from across the web.',
    blurb: 'Amateur-built and kit aircraft — Van\'s RV, CubCrafters, Kitfox, and more.',
    intro: [
      'Experimental Amateur-Built is an FAA certificate category for aircraft built from kits or scratch by individual builders rather than certified factories. It is the largest and fastest-growing part of general aviation by new registrations: Van\'s Aircraft RV series alone has produced more than ten thousand flying examples, and the category also includes CubCrafters EX and FX models, Kitfox, Zenith, Rans, Glastar, and hundreds of other designs. Many are powered by the same Lycoming and Continental engines found in certified aircraft; others run Rotax or even turbine powerplants that would never pass certified-category approval.',
      'The ownership case for experimental aircraft is built around two advantages: flexibility and maintenance access. Under FAR Part 43, the original builder of an amateur-built aircraft may obtain a Repairman Certificate and perform essentially all of their own maintenance and inspections — a benefit that can cut annual costs dramatically compared to taking a certified aircraft to an A&P for every squawk. Experimental aircraft can also run non-certified avionics such as the Garmin G3X or MGL glass suites at a fraction of the certified-equipment price, and they can be modified without an STC. The trade-off is that the aircraft cannot be used commercially, and insurance underwriters price the category somewhat differently from certified makes.',
      'The listings below are the aircraft in our inventory whose title or description includes the word "experimental." This captures the majority of experimental-category aircraft — most classified listings note the category in the title or body — but always confirm on the source listing and review the aircraft\'s airworthiness certificate. For a used experimental, the builder\'s log is the most important document: it records the entire construction with photos, signatures, and inspection sign-offs, and its completeness tells you a great deal about how carefully the aircraft was built.',
    ],
    faqs: [
      {
        q: 'What is an experimental amateur-built aircraft?',
        a: 'It is an aircraft certificated by the FAA under the Experimental Amateur-Built category, meaning it was built from a kit or plans by an individual rather than a certified manufacturer. The category covers a vast range — from two-seat sport planes like Van\'s RV-7 to four-seat cross-country aircraft like the RV-10 or CubCrafters Carbon Cub FX. The aircraft carries an "Experimental" airworthiness certificate rather than a Standard one and cannot be operated commercially.',
      },
      {
        q: 'What is a builder\'s log and why does it matter?',
        a: 'The builder\'s log is the construction record the builder maintained throughout the build — photos, notes, and inspection sign-offs at each major stage. It is the primary document that shows the aircraft was built correctly and that the builder did the majority of the work (a legal requirement for the Amateur-Built designation). A complete, well-documented log is a strong positive signal; large gaps or missing sections are a red flag to take seriously during a prepurchase inspection.',
      },
      {
        q: 'Can I maintain an experimental aircraft myself?',
        a: 'The original builder can apply for a Repairman Certificate, which allows them to perform essentially all maintenance and condition inspections on their specific aircraft. When an experimental is sold, the Repairman Certificate does not transfer — the new owner can petition for one (requiring FAA approval and a demonstration of building skills), but it is not guaranteed. That said, the A&P maintenance requirements for experimental aircraft are generally less restrictive than for certified makes, and many owners work with A&Ps who are comfortable with the category.',
      },
      {
        q: 'How is buying an experimental different from buying a certified aircraft?',
        a: 'The review process is similar — logbooks, annual condition inspection status, engine times — but the builder\'s log review is a step that does not exist for certified aircraft, and you should ideally have the inspection done by someone experienced with both the type and the experimental category. Insurance may be slightly more expensive or require more experience from the pilot, and the aircraft cannot be used for commercial operations. On the plus side, avionics and equipment options are wider and often cheaper, and maintenance costs can be lower with the right repairman arrangement.',
      },
    ],
    filters: { q: 'experimental' },
  },
  {
    slug: 'twin-engine',
    label: 'Twin-engine',
    h1: 'Twin-Engine Aircraft for Sale',
    metaTitle: 'Twin-Engine Aircraft for Sale | ClubHanger',
    metaDescription:
      'Browse twin-engine general aviation aircraft for sale — piston and turbine twins for IFR, over-water, and high-performance travel. Aggregated from across the web.',
    blurb: 'Multi-engine piston and turbine aircraft for high-performance travel and IFR.',
    intro: [
      'A twin-engine aircraft carries a second powerplant as both a safety margin and a performance upgrade. In practice that second engine buys you redundancy on long over-water, over-terrain, and single-pilot IFR legs — the ability to continue to a suitable airport if one engine fails rather than managing a forced landing. It also typically brings more horsepower, a faster cruise, higher useful load, and pressurization options that a comparably sized single cannot match. The classic piston twins — Cessna 310, 340, and 421; Beechcraft Baron and Duke; Piper Aztec and Seneca — remain popular on the used market for that combination of capability and relative affordability.',
      'The trade-off is the cost equation. Two engines mean two overhauls, two sets of cylinder inspections, and higher insurance premiums. Multi-engine insurance underwriters look closely at total time, multi-engine time, and instrument currency, and the training requirement — at minimum a multi-engine rating, ideally a full instrument-proficiency check in type — is real. Modern diesel twins like the Diamond DA42 have narrowed the fuel-cost gap compared to avgas piston twins, but the fixed-cost math still pushes most twin owners toward co-ownership rather than solo ownership.',
      'The listings below are the aircraft in our inventory whose title or description mentions a twin or multi-engine configuration. Always verify the engine model, times since overhaul, and propeller condition on the source listing and in the logs, and get a pre-buy inspection from someone experienced with the type before making an offer.',
    ],
    faqs: [
      {
        q: 'Do I need a multi-engine rating to fly a twin?',
        a: 'Yes. A multi-engine rating (added to a Private or Commercial certificate) is required to act as pilot in command of a multi-engine aircraft. It is not a standalone certificate — you add it as a category and class rating. Most training programs run 10–20 hours in the aircraft plus ground study, and many insurers want additional time-in-type beyond the rating minimums before they will quote a twin.',
      },
      {
        q: 'Is a twin actually safer than a high-performance single?',
        a: 'It depends on the situation and the pilot. A twin gives you the option to continue flying on one engine if the other fails — but engine failures are rare, and a mishandled engine-out in a piston twin can be more dangerous than a well-flown forced landing in a single. The safety benefit is most real when you are flying IFR, over-water, or over-terrain where a forced landing would be hazardous, and when you maintain your engine-out proficiency with regular training.',
      },
      {
        q: 'Why do most twin owners co-own rather than own solo?',
        a: 'Two engines bring two overhaul reserves, two annuals\' worth of cylinder inspections, and higher insurance premiums that easily exceed what a single costs to own. Co-ownership spreads those fixed costs across a group so each partner pays a manageable monthly number while still accessing the capability of a twin. It is the standard way the math works for the piston-twin market.',
      },
      {
        q: 'What is the difference between a piston twin and a turbine twin?',
        a: 'Piston twins (Cessna 310, Baron, Seneca, DA42) use reciprocating engines and represent most of the used market accessible to private pilots — they are faster and more capable than singles but require no special operating certificates. Turbine twins (King Air, TBM-style twins, older Citations) use turboprop or jet engines, carry much higher acquisition and operating costs, and require a turbine type rating; they are a different class of aircraft and operator.',
      },
    ],
    filters: { q: 'twin' },
  },
  {
    slug: 'stol',
    label: 'STOL / Backcountry',
    h1: 'STOL and Backcountry Aircraft for Sale',
    metaTitle: 'STOL Aircraft for Sale — Short Takeoff & Landing | ClubHanger',
    metaDescription:
      'Browse STOL and backcountry aircraft for sale — short-field specialists for bush strips, remote airstrips, and off-airport adventure flying. Aggregated from across the web.',
    blurb: 'Short-field specialists for bush strips and off-airport adventure flying.',
    intro: [
      'STOL — Short Takeoff and Landing — aircraft are purpose-built or purpose-modified for operating from short, rough, and unimproved strips far off the paved-airport grid. High-lift wings (often with leading-edge cuffs, drooped ailerons, and large Fowler flaps), light and powerful airframes, and tundra tires or floats let these aircraft use strips measured in hundreds of feet rather than thousands. The category is dominated by types like the CubCrafters Carbon Cub, Kitfox, Zenith CH-750, and backcountry-modified Super Cubs — but also includes certified Piper Cubs, Cessna 180 and 185 Skywagon variants on big tires, and even Cessna 172s with STOL kits.',
      'The backcountry community prizes three capabilities above all else: short-field performance (how little runway you really need), payload at that performance (how much gear you can carry), and rough-field durability (gear, prop, and airframe built to bounce through rocks and ruts). Tundra tires dramatically expand the operating envelope, but they also add drag and reduce cruise speed — most backcountry pilots consider that a worthy trade. If you plan to fly remote strips, study the specific performance numbers for the airplane and modification combination carefully: a modified stock 172 is a different animal from a factory Carbon Cub FX-3.',
      'The listings below are the aircraft in our inventory whose title or description mentions STOL, backcountry, bush, or short-field capability. Because not every backcountry-capable aircraft uses those specific terms, browse the experimental and tailwheel mission pages as well — many Van\'s RV, Super Cub, and Kitfox listings appear there too.',
    ],
    faqs: [
      {
        q: 'What makes an aircraft a true STOL aircraft?',
        a: 'True STOL aircraft combine high-lift wing designs (leading-edge cuffs, large flaps, drooped ailerons) with powerful engines and light airframes to achieve very short ground rolls — sometimes under 200 feet. The standard is demonstrated by the manufacturer or modifier, but in practice you want to see real-world short-field numbers from pilots who fly the specific type and modification combination, since spec-sheet figures assume an ideal strip.',
      },
      {
        q: 'Do I need a special license to fly backcountry strips?',
        a: 'No special certificate is required — a Private Pilot certificate is enough legally. But backcountry and bush flying involves real hazards: one-way strips, high terrain, density altitude, soft or rough surfaces, and limited abort options. Most experienced backcountry pilots recommend formal training at a backcountry-specific school before flying remote strips solo, regardless of total experience.',
      },
      {
        q: 'Is a STOL aircraft good for anything besides backcountry flying?',
        a: 'Yes. Short-field capability is useful at small airports with short runways, grass strips, and private airstrips that are inaccessible to most aircraft. Some backcountry types also make excellent aerial photography platforms and fire-patrol aircraft, and pilots who simply enjoy stick-and-rudder, low-and-slow flying often gravitate to the same types for the pure enjoyment of the flying.',
      },
      {
        q: 'What are tundra tires and do I need them?',
        a: 'Tundra tires are oversized, low-pressure tires (often 26–36 inches in diameter) that absorb the shock of rough surfaces and give much better flotation on soft or uneven ground. They are standard equipment for serious backcountry operations and come pre-fitted on most factory STOL aircraft. The trade-off is reduced cruise speed due to the added drag — typically 5–10 knots. On a grass-strip or paved-airport flier who never plans to use rough strips, they may not be worth it; on a real backcountry airplane, they are usually essential.',
      },
    ],
    filters: { q: 'stol' },
  },
]

/** Look up a mission by slug. Returns undefined for unknown slugs (→ 404). */
export function getMission(slug: string): Mission | undefined {
  return MISSIONS.find((m) => m.slug === slug)
}

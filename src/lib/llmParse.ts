import Anthropic from '@anthropic-ai/sdk'
import type { ParsedListing } from './parseListing'

// Structured schema Claude must fill. All fields nullable except share_type/title.
const SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    make: { type: ['string', 'null'], description: 'Manufacturer, e.g. Cessna, Cirrus, Piper, Mooney' },
    model: { type: ['string', 'null'], description: 'Model incl. variant, e.g. "182S", "SR22", "Screaming Eagle"' },
    year: { type: ['integer', 'null'] },
    home_airport: { type: ['string', 'null'], description: 'ICAO code; US airports start with K, e.g. KPAO' },
    city: { type: ['string', 'null'] },
    state: { type: ['string', 'null'], description: '2-letter US state code' },
    share_type: {
      type: 'string',
      enum: ['1/2', '1/3', '1/4', 'leaseback', 'dry_lease', 'other'],
    },
    buy_in_price: { type: ['integer', 'null'], description: 'Whole USD; "$70K each" -> 70000' },
    monthly_fixed: { type: ['integer', 'null'], description: 'Whole USD/month; "$320/mo" -> 320' },
    hourly_wet: { type: ['integer', 'null'], description: 'Whole USD/hour wet rate; "$250/hr" -> 250' },
    min_hours: { type: ['integer', 'null'], description: 'Minimum total pilot hours required' },
    ratings_required: {
      type: ['array', 'null'],
      items: { type: 'string' },
      description: 'e.g. ["PPL", "IFR"]',
    },
    contact_name: { type: ['string', 'null'] },
    contact_phone: { type: ['string', 'null'] },
    title: { type: 'string', description: 'Concise listing title, e.g. "1999 Mooney Screaming Eagle 1/3 Share at KPAO"' },
  },
  required: [
    'make', 'model', 'year', 'home_airport', 'city', 'state', 'share_type',
    'buy_in_price', 'monthly_fixed', 'hourly_wet', 'min_hours', 'ratings_required',
    'contact_name', 'contact_phone', 'title',
  ],
}

const SYSTEM = `You extract structured aircraft co-ownership/partnership listing fields from a free-text social post (Facebook, Craigslist, etc.).

Rules:
- Use null for anything not clearly stated. Do not guess prices or hours.
- Prices are whole USD integers: "$70K" or "70k" -> 70000, "$320/mo" -> 320, "$250/hour wet" -> 250.
- home_airport is the ICAO identifier. US airports are 4 letters starting with K (KPAO, KHWD, KSQL). If only a 3-letter code or airport name is given, convert to the ICAO if you know it, else null.
- Infer make from the model when the brand is omitted: "182S" -> Cessna, "SR22" -> Cirrus, "Cherokee"/"Archer" -> Piper, "RV-7" -> Van's, "DA40" -> Diamond, "M20"/"Ovation" -> Mooney, "Bonanza" -> Beechcraft.
- model should include the variant/marketing name when present (e.g. "Screaming Eagle", "Turbo", "SP").
- contact_name is the person to reach (often the poster). contact_phone is any phone number in the text.
- share_type: pick the closest of 1/2, 1/3, 1/4, leaseback, dry_lease, other.
- title: a concise, human listing title combining year, make, model, share type, and airport when known.`

/**
 * LLM-based extraction via Claude Haiku. Returns null when no API key is set
 * or the call fails, so callers can fall back to the heuristic parser.
 */
export async function llmParseListing(rawText: string): Promise<ParsedListing | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const text = rawText.trim()
  if (text.length < 10) return null

  try {
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM,
      tools: [
        {
          name: 'record_listing',
          description: 'Record the structured aircraft partnership listing fields.',
          input_schema: SCHEMA as Anthropic.Tool['input_schema'],
        },
      ],
      tool_choice: { type: 'tool', name: 'record_listing' },
      messages: [{ role: 'user', content: text }],
    })

    const block = res.content.find((b) => b.type === 'tool_use')
    if (!block || block.type !== 'tool_use') return null
    const f = block.input as Record<string, unknown>

    // Models sometimes emit a placeholder ("<UNKNOWN>", "N/A") instead of null.
    const str = (v: unknown): string | null => {
      if (typeof v !== 'string') return null
      const t = v.trim()
      if (!t || /^<?\s*(unknown|n\/?a|none|null|tbd|n\.a\.)\s*>?$/i.test(t)) return null
      return t
    }

    return {
      make: str(f.make) ?? 'Unknown',
      model: str(f.model) ?? 'Unknown',
      year: (f.year as number) ?? null,
      home_airport: str(f.home_airport),
      city: str(f.city),
      state: str(f.state),
      share_type: str(f.share_type) ?? 'other',
      buy_in_price: (f.buy_in_price as number) ?? null,
      monthly_fixed: (f.monthly_fixed as number) ?? null,
      hourly_wet: (f.hourly_wet as number) ?? null,
      contact_name: str(f.contact_name),
      title: str(f.title)?.slice(0, 140) || text.split('\n')[0].slice(0, 140),
      // extra fields the heuristic type doesn't carry — surfaced via the cast below
      ...(f.min_hours != null ? { min_hours: f.min_hours as number } : {}),
      ...(f.ratings_required != null ? { ratings_required: f.ratings_required as string[] } : {}),
      ...(str(f.contact_phone) ? { contact_phone: str(f.contact_phone) } : {}),
    } as ParsedListing & {
      min_hours?: number
      ratings_required?: string[]
      contact_phone?: string
    }
  } catch (e) {
    console.error('llmParseListing failed:', e)
    return null
  }
}

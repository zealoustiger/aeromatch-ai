import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface AircraftFacets {
  /** Makes that have active listings, most-listed first. */
  makes: string[]
  /** Models per make, alphabetical. Only makes with at least one real model appear. */
  modelsByMake: Record<string, string[]>
}

const EMPTY: AircraftFacets = { makes: [], modelsByMake: {} }

/**
 * Derive Make + Model filter options from the live `aircraft_for_sale` table.
 * Read-time aggregation over existing columns — no schema, no extra tables.
 * Makes are ordered by listing count (so scraper junk sinks to the bottom);
 * models are de-duped and sorted alphabetically within each make.
 */
export async function getAircraftFacets(): Promise<AircraftFacets> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return EMPTY

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('aircraft_for_sale')
      .select('make, model')
      .eq('status', 'active')
      .not('make', 'is', null)
      .limit(5000)

    if (error || !data) return EMPTY

    const counts = new Map<string, number>()
    const models = new Map<string, Set<string>>()

    for (const row of data) {
      const make = (row.make ?? '').trim()
      if (!make) continue
      counts.set(make, (counts.get(make) ?? 0) + 1)
      const model = (row.model ?? '').trim()
      if (model) {
        if (!models.has(make)) models.set(make, new Set())
        models.get(make)!.add(model)
      }
    }

    const makes = [...counts.keys()].sort((a, b) => {
      const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0)
      return diff !== 0 ? diff : a.localeCompare(b)
    })

    const modelsByMake: Record<string, string[]> = {}
    for (const [make, set] of models) {
      modelsByMake[make] = [...set].sort((a, b) => a.localeCompare(b))
    }

    return { makes, modelsByMake }
  } catch {
    return EMPTY
  }
}

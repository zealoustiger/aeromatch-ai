import { getMakeBySlug, getMakeModel, getStateBySlug, STATE_NAMES } from './seo'

/**
 * Derives a page-scoped alert target for `FooterAlertCapture` (rendered on
 * every page via the root layout) from the current pathname alone — no
 * search params, no DB call, so it stays safe to run on every render.
 *
 * Only resolves the exact path shapes `alert-digest`'s `parseSourcePath`
 * (src/app/api/cron/alert-digest/route.ts) already knows how to match against
 * real inventory (make/model/state hubs). Any other path — including ones
 * that merely *look* page-specific (`/aircraft/listing/[id]`,
 * `/aircraft/mission/[x]`, `/aircraft/compare/[x]`) but that `parseSourcePath`
 * can't resolve to a real filter — falls back to the universal `/` target
 * (`{ type: 'all' }`) rather than risk creating an alert that can never
 * match anything.
 */
export function deriveFooterAlertTarget(pathname: string): { sourcePath: string; context: string | null } {
  const clean = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/'
  const segs = clean.split('/').filter(Boolean)
  const fallback = { sourcePath: '/', context: null }

  if (segs[0] === 'aircraft') {
    // /aircraft/for-sale/[stateSlug]
    if (segs[1] === 'for-sale' && segs.length === 3) {
      const state = getStateBySlug(segs[2])
      return state ? { sourcePath: clean, context: `${state.name} listings` } : fallback
    }

    // /aircraft/[make]/[model]/[stateCode]
    if (segs.length === 4 && /^[a-z]{2}$/i.test(segs[3])) {
      const make = getMakeBySlug(segs[1])
      const stateName = STATE_NAMES[segs[3].toUpperCase()]
      if (!make || !stateName) return fallback
      const model = getMakeModel(segs[1], segs[2])
      const label = model ? `${model.make} ${model.model}` : make.name
      return { sourcePath: clean, context: `${label} listings in ${stateName}` }
    }

    // /aircraft/[make]/[model]
    if (segs.length === 3) {
      const make = getMakeBySlug(segs[1])
      if (!make) return fallback
      const model = getMakeModel(segs[1], segs[2])
      const label = model ? `${model.make} ${model.model}` : make.name
      return { sourcePath: clean, context: `${label} listings` }
    }

    // /aircraft/[make]
    if (segs.length === 2) {
      const make = getMakeBySlug(segs[1])
      return make ? { sourcePath: clean, context: `${make.name} listings` } : fallback
    }

    return fallback
  }

  if (segs[0] === 'partnerships') {
    // /partnerships/make/[makeSlug]
    if (segs[1] === 'make' && segs.length === 3) {
      const make = getMakeBySlug(segs[2])
      return make ? { sourcePath: clean, context: `${make.name} partnerships` } : fallback
    }

    // /partnerships/state/[stateCode]
    if (segs[1] === 'state' && segs.length === 3) {
      const stateName = STATE_NAMES[segs[2].toUpperCase()]
      return stateName ? { sourcePath: clean, context: `${stateName} partnerships` } : fallback
    }

    // /partnerships/near/[icao]
    if (segs[1] === 'near' && segs.length === 3 && /^[a-z0-9]{3,4}$/i.test(segs[2])) {
      return { sourcePath: clean, context: `partnerships near ${segs[2].toUpperCase()}` }
    }

    return fallback
  }

  return fallback
}

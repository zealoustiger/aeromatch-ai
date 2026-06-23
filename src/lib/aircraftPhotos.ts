/**
 * Verified Wikipedia Commons photos of real GA aircraft by make.
 * All public domain. Shown with "Not actual plane photo" badge when used as placeholders.
 */

const MAKE_PHOTOS: Record<string, string> = {
  cessna:
    'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cessna_172S_Skyhawk_SP%2C_Private_JP6817606.jpg',
  piper:
    'https://upload.wikimedia.org/wikipedia/commons/1/17/G-AVRZ_Piper_PA-28-180_Cherokee_C_at_Northrepps.jpg',
  cirrus:
    'https://upload.wikimedia.org/wikipedia/commons/9/9f/Cirrus_SR-22_G3_GTS_AN1594917.jpg',
  beechcraft:
    'https://upload.wikimedia.org/wikipedia/commons/4/48/Beech_Bonanza_Takeoff_%285517383917%29.jpg',
  mooney:
    'https://upload.wikimedia.org/wikipedia/commons/b/bf/Mooney.m20j.g-muni.arp.jpg',
  diamond:
    'https://upload.wikimedia.org/wikipedia/commons/a/a5/Diamond_DA40_%28N505JF%29.jpg',
  grumman:
    'https://upload.wikimedia.org/wikipedia/commons/5/52/Grumman.aa-5.traveller.g-bezf.arp.jpg',
  "van's":
    'https://upload.wikimedia.org/wikipedia/commons/7/7e/Vans.rv-7.g-kels.arp.jpg',
  "van's aircraft":
    'https://upload.wikimedia.org/wikipedia/commons/7/7e/Vans.rv-7.g-kels.arp.jpg',
}

const FALLBACK =
  'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cessna_172S_Skyhawk_SP%2C_Private_JP6817606.jpg'

export function getPlaceholderPhoto(make: string): string {
  return MAKE_PHOTOS[make.toLowerCase()] ?? FALLBACK
}

// Some aggregated listings store the *source site's own* "no photo" graphic as
// their first image (e.g. static.aircraftforsale.com/.../noimage-300x225.webp).
// Those aren't real plane photos — and their hosts aren't in next.config's image
// allowlist, so the Next image optimizer 400s on them. Treat them as no photo so
// we fall back to our own per-make placeholder (with the "Not actual plane photo"
// badge) instead of rendering a broken image + console error.
const SOURCE_PLACEHOLDER_RE = /no[\s._-]?image|placeholder|no[\s._-]?photo/i

export function isUsablePhoto(url: string | null | undefined): url is string {
  return !!url && !SOURCE_PLACEHOLDER_RE.test(url)
}

// First genuinely usable real photo from a listing's images, or null.
export function pickRealPhoto(images: string[] | null | undefined): string | null {
  return (images ?? []).find(isUsablePhoto) ?? null
}

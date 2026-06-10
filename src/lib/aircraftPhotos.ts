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

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Serve images straight from source rather than through Vercel's image
    // optimizer. The optimizer's monthly transformation cap was exhausted (every
    // /_next/image request 402'd: OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED),
    // which broke EVERY image site-wide — real listing photos AND placeholders.
    // Aggregated source photos are already reasonably sized (≤800x600 from the
    // CDNs), so unoptimized delivery is an acceptable trade for images that load.
    // Revert (or upgrade the Vercel plan) to re-enable WebP/AVIF + resizing.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'barnstormers.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'cdn.aircraftforsale.com' },
      { protocol: 'https', hostname: 'preview.redd.it' },
      { protocol: 'https', hostname: 'external-preview.redd.it' },
      { protocol: 'https', hostname: 'i.redd.it' },
      { protocol: 'https', hostname: 'khypdoyfhwtdwaelzzle.supabase.co' },
    ],
  },
}

export default nextConfig

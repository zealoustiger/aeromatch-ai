import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
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

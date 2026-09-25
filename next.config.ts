import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'refactored-robot-5g9rrq7jxv9vh79g4-3000.app.github.dev',
        'localhost:3000',
      ],
    },
  },
}

export default nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable API routes on Vercel
  // output: 'export', // This prevents API routes from working
  images: {
    // Remove unoptimized to enable Next.js image optimization
    // unoptimized: true,
    domains: ['www.triya.ai'],
    formats: ['image/avif', 'image/webp'],
  },
  basePath: '',
  assetPrefix: '',
  // Keep trailingSlash for consistency with existing URLs
  trailingSlash: true,
  
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com; frame-src 'self' https://www.youtube.com",
          },
        ],
      },
    ];
  },
  
  // Redirects for common typos
  async redirects() {
    return [
      {
        source: '/pracing',
        destination: '/contact',
        permanent: false,
      },
      {
        source: '/pricing',
        destination: '/contact',
        permanent: false,
      },
      {
        source: '/demo',
        destination: '/contact',
        permanent: false,
      },
      {
        source: '/ar',
        destination: '/',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable API routes on Vercel
  // output: 'export', // This prevents API routes from working
  images: {
    unoptimized: true,
  },
  basePath: '',
  assetPrefix: '',
  // Keep trailingSlash for consistency with existing URLs
  trailingSlash: true,
}

module.exports = nextConfig
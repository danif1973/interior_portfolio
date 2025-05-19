/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
  // Add security headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // Enable XSS protection in browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Control browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // Enable HSTS (force HTTPS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Enable DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              // Default restrictions
              "default-src 'self'",
              // Allow images from same origin, data URLs, and blobs (for image uploads)
              "img-src 'self' data: blob:",
              // Allow styles from same origin, inline styles, and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow scripts from same origin, inline scripts, and Google Fonts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
              // Allow fonts from same origin and Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Allow form submissions to same origin
              "form-action 'self'",
              // Allow frames from same origin
              "frame-ancestors 'self'",
              // Allow object sources from same origin
              "object-src 'none'",
              // Allow base URI to be same origin
              "base-uri 'self'",
              // Allow connect to same origin and Facebook (for social links)
              "connect-src 'self' https://www.facebook.com",
              // Allow media from same origin
              "media-src 'self'",
              // Allow worker sources from same origin
              "worker-src 'self' blob:",
              // Allow manifest from same origin
              "manifest-src 'self'",
              // Allow prefetch from same origin
              "prefetch-src 'self'",
              // Allow navigation to same origin and Facebook
              "navigate-to 'self' https://www.facebook.com",
              // Upgrade insecure requests
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig 
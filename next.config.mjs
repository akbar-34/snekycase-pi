/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/**',  // This means any path under the domain will be allowed
      },
    ],
  },
}

export default nextConfig

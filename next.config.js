/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/jobs',
        destination: 'https://www.jobsmato.com/',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig

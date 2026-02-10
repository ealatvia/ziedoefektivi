/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "splendid-sunshine-fb3754d635.strapiapp.com",
      "splendid-sunshine-fb3754d635.media.strapiapp.com",
      "placehold.co",
      "127.0.0.1",
      "localhost"
    ],
  },
  async redirects() {
    return [
    ];
  },
};

module.exports = nextConfig;

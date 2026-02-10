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
  // Weird, the page `/calculator` is blank with 304 response and with a header
  //     warning:	199 ApacheTrafficServer/10.1.0 Proxy received unexpected 304 response; content may be stale"
  // Internet says this helps. TODO: figure out and fix properly.
  // See https://github.com/vercel/next.js/discussions/55893#discussioncomment-7131799
  generateEtags: false,
};

module.exports = nextConfig;

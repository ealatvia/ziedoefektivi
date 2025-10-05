/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "res.cloudinary.com", // TODO: remove after clearing data from cloudinary links.
      "splendid-sunshine-fb3754d635.strapiapp.com",
      "splendid-sunshine-fb3754d635.media.strapiapp.com",
      "placehold.co",
      "127.0.0.1",
      "localhost"
    ],
  },
  async redirects() {
    return [
      {
        source: "/heategevused",
        destination: "/kuhu-annetada",
        permanent: false,
      },
      {
        source: "/meetod",
        destination: "/kuhu-annetada",
        permanent: false,
      },
      {
        source: "/tulumaks",
        destination: "/kkk",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

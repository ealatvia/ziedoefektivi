/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "res.cloudinary.com", // TODO: remove after clearing data from cloudinary links.
      "diplomatic-dream-7916d376b8.media.strapiapp.com"
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

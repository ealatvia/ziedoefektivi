module.exports = [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "splendid-sunshine-fb3754d635.strapiapp.com",
            "http://127.0.0.1:1337",
            "http://localhost:1337"
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "splendid-sunshine-fb3754d635.strapiapp.com",
            "http://127.0.0.1:1337",
            "http://localhost:1337"
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];

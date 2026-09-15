import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/** Origines autorisées à iframe le studio (/cms-admin) — backoffice HQ. */
function frameAncestors(): string {
  const extras = (process.env.CMS_FRAME_ANCESTORS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    "'self'",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ];
  return [...new Set([...defaults, ...extras])].join(" ");
}

const publicSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const studioEmbedHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: `frame-ancestors ${frameAncestors()}`,
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      // Studio embeddable dans le shell backoffice (pas de X-Frame-Options DENY)
      { source: "/cms-admin", headers: studioEmbedHeaders },
      { source: "/cms-admin/:path*", headers: studioEmbedHeaders },
      { source: "/:path*", headers: publicSecurityHeaders },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && process.env.DISABLE_WEBPACK_FS_CACHE !== "0") {
      config.cache = { type: "memory" as const };
    }
    if (dev && !isServer) {
      config.output = config.output ?? {};
      config.output.chunkLoadTimeout = 180_000;
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 30_000,
    pagesBufferLength: 4,
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next.js Cache Components rely on timer behavior that is not guaranteed under Bun.
  cacheComponents: false,
  partialPrefetching: false,
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "promptpay.io",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
//user_35scbbELfm7UluCcjDospqwm5Wh

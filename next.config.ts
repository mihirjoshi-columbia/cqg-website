import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The competition portal used to live under /cutc/apply; verification and
  // password-reset links already sent by email still point there.
  async redirects() {
    return [{ source: "/cutc/:path*", destination: "/ctt/:path*", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ],
  },
};

export default nextConfig;

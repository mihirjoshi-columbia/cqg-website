import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Resume uploads are Server Actions; Next's default 1 MB body cap rejected
  // any PDF over 1 MB (common for phone exports/scans). 4.5mb is Vercel's own
  // serverless request limit, so lib/resume-file.ts caps files at 4MB.
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/portfolio is a symlink pointing outside the repo in local dev;
  // keep the bundler's file tracing from following it (content is read with
  // plain fs at build time, it never needs to be traced into the output).
  outputFileTracingExcludes: {
    "*": ["./content/**"],
  },
};

export default nextConfig;

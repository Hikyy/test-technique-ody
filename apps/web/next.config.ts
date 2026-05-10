import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ody/ui", "@ody/i18n", "@ody/types"],
};

export default withNextIntl(nextConfig);

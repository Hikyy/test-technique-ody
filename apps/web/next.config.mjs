/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ody/ui", "@ody/sdk"],
  typedRoutes: false,
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify sets URL to the site's main address (https://trycreatively.space)
  // during the build; baked in here so server-side redirects never use the
  // internal deploy address (see lib/redirect.ts).
  env: {
    SITE_URL: process.env.URL || "",
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;

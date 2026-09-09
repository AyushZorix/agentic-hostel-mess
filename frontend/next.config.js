/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.21st.dev" },
      { protocol: "https", hostname: "me7aitdbxq.ufs.sh" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://familyverse-backend.up.railway.app",
  }
}
module.exports = nextConfig

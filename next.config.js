/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Add transpilePackages to ensure Phaser works correctly
  transpilePackages: ['phaser']
};

module.exports = nextConfig; 
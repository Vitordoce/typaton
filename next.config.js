/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Add transpilePackages to ensure Phaser works correctly
  transpilePackages: ['phaser'],
  // Add output configuration to generate the "out" directory for Vercel deployment
  output: 'export'
};

module.exports = nextConfig; 
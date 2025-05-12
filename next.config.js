/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Add transpilePackages to ensure Phaser works correctly
  transpilePackages: ['phaser'],
  // Add output configuration to generate the "out" directory for Vercel deployment
  output: 'export',
  // Specify the output directory explicitly
  distDir: 'out'
};

module.exports = nextConfig; 
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Add transpilePackages to ensure Phaser works correctly
  transpilePackages: ['phaser'],
  // Add output configuration to generate static export
  output: 'export'
};

module.exports = nextConfig; 
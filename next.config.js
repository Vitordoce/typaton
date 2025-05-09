/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Add transpilePackages to ensure Phaser works correctly
  transpilePackages: ['phaser'],
  // Configure the build output directory
  output: 'export'
};

module.exports = nextConfig; 
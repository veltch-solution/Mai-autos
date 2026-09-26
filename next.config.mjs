/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the sandbox / preview proxy host to talk to the dev server
  allowedDevOrigins: ['*.e2b.app', 'localhost', '127.0.0.1'],
};

export default nextConfig;

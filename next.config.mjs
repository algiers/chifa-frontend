const nextConfig = {
  // Exclude Supabase Edge Functions from build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // Ignore Deno-specific files during server build
      config.externals.push(/^https?:\/\//);
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
};

export default nextConfig;

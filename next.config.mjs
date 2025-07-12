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
  },
  images: {
    domains: [
      'frontend.frp.youcef.xyz',
      'agent.frp.youcef.xyz',
      'litellm.frp.youcef.xyz',
      'api.frp.youcef.xyz',
      'streamlit.frp.youcef.xyz',
    ],
  },
  // Optimisations pour résoudre les problèmes d'hydratation
  reactStrictMode: false, // Désactiver temporairement pour éviter les doubles rendus
  swcMinify: true,
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://frontend.frp.youcef.xyz',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

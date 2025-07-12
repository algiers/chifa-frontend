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
        ],
      },
    ];
  },
};

export default nextConfig;

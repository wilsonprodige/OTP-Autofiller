const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  publicPath: './',           
  outputDir: 'dist',          
  filenameHashing: false,    
  transpileDependencies: true,

  pwa: {
    workboxOptions: {
      runtimeCaching: [
        {
          urlPattern: ({ url }) => {
            // Only cache http(s) requests, skip chrome-extension://
            return url.protocol === 'http:' || url.protocol === 'https:';
          },
          handler: 'NetworkFirst',
          options: {
            cacheName: 'http-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
          },
        },
      ],
    },
  }
})
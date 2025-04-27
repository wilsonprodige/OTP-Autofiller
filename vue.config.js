const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  publicPath: './',           
  outputDir: 'dist',          
  filenameHashing: false,    
  transpileDependencies: true,

  configureWebpack: {
    entry: {
      app: './src/main.js', 
      floatingBtn: './src/floating-btn.js' 
    },
    output: {
      filename: 'js/[name].js'
    }
  },
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].excludeChunks = ['floatingBtn']
      return args
    })

    config.module
    .rule('vue')
    .use('vue-loader')
    .tap(options => ({
      ...options,
      isServerBuild: false
    }))
  },

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
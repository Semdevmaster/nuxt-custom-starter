// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 5,
  },
  experimental: {
    nitroAutoImports: true,
  },
  compatibilityDate: '2026-07-18',
  nitro: {
    preset: 'bun',
  },
})

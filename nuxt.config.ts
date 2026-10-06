// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxtjs/supabase',
  ],

  // Folders organise components but don't prefix their names (<DayMoodChart>, not <ChartsDayMoodChart>).
  // Component names must therefore be unique across folders.
  components: [
    { path: '~/components', pathPrefix: false },
  ],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#0B0B0C' },
        { name: 'color-scheme', content: 'dark' },
      ],
    },
  },

  css: [
    '@fortawesome/fontawesome-svg-core/styles.css',
    '~/assets/scss/_style.scss',
  ],

  devServer: {
    port: 3001,
  },

  compatibilityDate: '2025-07-15',

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Tokens, mixins and breakpoints only — this outputs no CSS.
          additionalData: '@use "~/assets/scss/abstracts" as *;\n',
        },
      },
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  // Exact families/weights/styles loaded by the design files. Self-hosted at build time.
  fonts: {
    families: [
      { name: 'Geist', provider: 'google', weights: [300, 400, 500, 600] },
      { name: 'Geist Mono', provider: 'google', weights: [400, 500] },
      { name: 'Inria Serif', provider: 'google', weights: [300, 400, 700] },
      { name: 'Newsreader', provider: 'google', weights: [300, 400], styles: ['normal', 'italic'] },
    ],
  },

  // Credentials come from NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_KEY (.env).
  supabase: {
    types: '~/types/database.types.ts',
    // Every route needs a session except these (the login and callback pages are implied).
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/signup', '/forgot-password', '/reset-password'],
      saveRedirectToCookie: true,
    },
  },
})

// https://nuxt.com/docs/api/configuration/nuxt-config

// Supabase is only wired up once credentials exist; until then the app runs
// on local fixtures (see PLAN.md, phases 2–3).
const hasSupabase = Boolean(
  (process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
  && (process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY),
)

if (!hasSupabase) {
  console.warn('[ascent] Supabase env vars not set — running without @nuxtjs/supabase. See .env.example.')
}

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    // Options are passed inline so the config still type-checks while the module is off.
    // redirect: turned on in phase 3 with the auth pages.
    // types: generated with `supabase gen types` once the first migration exists.
    ...(hasSupabase ? [['@nuxtjs/supabase', { redirect: false, types: false }] as [string, object]] : []),
  ],

  components: [
    // Generic primitives are used everywhere, so they skip the folder prefix (<BaseButton>, not <UiBaseButton>).
    { path: '~/components/ui', pathPrefix: false },
    '~/components',
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
})

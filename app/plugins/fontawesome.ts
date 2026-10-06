import { config } from '@fortawesome/fontawesome-svg-core'

// Font Awesome's CSS is loaded through nuxt.config `css` so it is present during SSR.
config.autoAddCss = false

export default defineNuxtPlugin(() => {})

// Auth pages (log in, sign up, forgot password) send signed-in users home.
export default defineNuxtRouteMiddleware(() => {
  if (useSupabaseSession().value) return navigateTo('/')
})

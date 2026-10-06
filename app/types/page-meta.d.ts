declare module '#app' {
  interface PageMeta {
    /** Auth layout: which top-right link to show ("New here?" / "Have an account?"). */
    authSwitch?: 'login' | 'signup'
  }
}

export {}

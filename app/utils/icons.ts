// The only file that imports Font Awesome icon packages.
// Components refer to icons by these semantic names via <AppIcon name="…" />.
// To move to Pro: install the @fortawesome/pro-* packages (token via env, see
// .npmrc.example) and swap the imports below — no component changes needed.
import {
  faArrowLeft,
  faArrowRight,
  faArrowRightFromBracket,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faGear,
  faMagnifyingGlass,
  faPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons'

export const icons = {
  'arrow-left': faArrowLeft,
  'arrow-right': faArrowRight,
  'check': faCheck,
  'chevron-left': faChevronLeft,
  'chevron-right': faChevronRight,
  'close': faXmark,
  'eye': faEye,
  'eye-off': faEyeSlash,
  'plus': faPlus,
  'search': faMagnifyingGlass,
  'settings': faGear,
  'sign-out': faArrowRightFromBracket,
} as const

export type IconName = keyof typeof icons

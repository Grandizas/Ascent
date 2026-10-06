// The only file that imports Font Awesome icon packages.
// Components refer to icons by these semantic names via <AppIcon name="…" />.
// Pro Light matches the design's thin 1.5px line work. Pro packages install
// from the Font Awesome registry (see .npmrc); add another style
// package here only when an icon needs it.
import {
  faArrowLeft,
  faArrowRight,
  faArrowRightFromBracket,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faEye,
  faEyeSlash,
  faGear,
  faMagnifyingGlass,
  faPlus,
  faXmark,
} from '@fortawesome/pro-light-svg-icons'

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

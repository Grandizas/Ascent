// The only file that imports Font Awesome icon packages.
// Components refer to icons by these semantic names via <AppIcon name="…" />.
// Pro Light matches the design's thin 1.5px line work. Pro packages install
// from the Font Awesome registry (see .npmrc); add another style
// package here only when an icon needs it.
import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowRightFromBracket,
  faArrowUp,
  faBookOpen,
  faChartLine,
  faChartSimple,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faEye,
  faEyeSlash,
  faGear,
  faMagnifyingGlass,
  faMountain,
  faPlus,
  faSun,
  faXmark,
} from '@fortawesome/pro-light-svg-icons'

export const icons = {
  'arrow-down': faArrowDown,
  'arrow-left': faArrowLeft,
  'arrow-right': faArrowRight,
  'arrow-up': faArrowUp,
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
  // Mobile tab bar (PLAN.md Q3: Font Awesome replaces the design's CSS glyphs).
  'tab-today': faSun,
  'tab-timeline': faChartLine,
  'tab-journeys': faMountain,
  'tab-insights': faChartSimple,
  'tab-journal': faBookOpen,
} as const

export type IconName = keyof typeof icons

import type { ComponentType } from 'react'
import {
  DashboardIcon,
  JourneyIcon,
  PlusIcon,
  PortfolioIcon,
  ProfileIcon,
  type IconProps,
} from '../components/icons'

export interface NavItem {
  to: string
  label: string
  /** Shorter label for the phone bottom bar. */
  shortLabel: string
  Icon: ComponentType<IconProps>
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/tracker', label: 'Dashboard', shortLabel: 'Dashboard', Icon: DashboardIcon },
  { to: '/tracker/new', label: 'New application', shortLabel: 'New', Icon: PlusIcon },
  { to: '/tracker/journey', label: 'Journey', shortLabel: 'Journey', Icon: JourneyIcon },
  { to: '/tracker/profile', label: 'Profile', shortLabel: 'Profile', Icon: ProfileIcon },
  { to: '/admin', label: 'Admin', shortLabel: 'Admin', Icon: PortfolioIcon },
]

/** Application and interview pages belong to the Dashboard section. */
export function isNavActive(to: string, pathname: string): boolean {
  if (to === '/tracker') {
    return (
      pathname === '/tracker' ||
      pathname.startsWith('/tracker/applications') ||
      pathname.startsWith('/tracker/interview')
    )
  }
  return pathname === to
}

export function pageTitle(pathname: string): string {
  if (pathname.startsWith('/tracker/applications')) return 'Application'
  if (pathname.startsWith('/tracker/interview')) return 'Interview prep'
  if (pathname === '/tracker/new') return 'New application'
  if (pathname === '/tracker/journey') return 'Journey'
  if (pathname === '/tracker/profile') return 'Profile'
  if (pathname === '/admin') return 'Admin'
  if (pathname === '/login') return 'Sign in'
  return 'Dashboard'
}

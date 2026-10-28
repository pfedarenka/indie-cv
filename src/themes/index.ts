import { useSyncExternalStore } from 'react'
import type { AppDef } from '../apps/registry'
import { dungeon } from './dungeon'
import type { Theme } from './types'
import { vapor } from './vapor'

// All aesthetics, in picker order. The first one is the default.
export const themes: Theme[] = [vapor, dungeon]

const STORAGE_KEY = 'pavel98-theme'

function initialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return themes.find((t) => t.id === saved) ?? themes[0]
  } catch {
    return themes[0]
  }
}

let current = initialTheme()
const listeners = new Set<() => void>()
document.documentElement.dataset.theme = current.id

export function setTheme(id: string) {
  const next = themes.find((t) => t.id === id)
  if (!next || next === current) return
  current = next
  document.documentElement.dataset.theme = next.id
  try {
    localStorage.setItem(STORAGE_KEY, next.id)
  } catch {
    // storage blocked: the choice just won't be remembered
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useTheme = () => useSyncExternalStore(subscribe, () => current)

// Window / icon names can be overridden per theme.
export const appLabel = (app: AppDef, theme: Theme) => theme.apps[app.id]?.label ?? app.label
export const appTitle = (app: AppDef, theme: Theme) => theme.apps[app.id]?.title ?? app.title
export const appIcon = (app: AppDef, theme: Theme) => theme.apps[app.id]?.icon ?? app.icon

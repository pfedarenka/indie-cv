import type { AppId } from './registry'

// Lets one app open another (e.g. the sequencer's "FX Rack" button) without
// threading callbacks through the window manager. App.tsx listens for it.
export const OPEN_APP_EVENT = 'pavel98:open-app'

export function openApp(id: AppId) {
  window.dispatchEvent(new CustomEvent<AppId>(OPEN_APP_EVENT, { detail: id }))
}

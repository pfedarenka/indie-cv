import { useSyncExternalStore } from 'react'

// The FX rack: effect modules, the knob on each, and the patch cables between them.
// Lives outside React so the sequencer (which owns the audio engine) and the rack
// window (which edits it) can share it while being separate windows.

// Knobs, each 0..1. The defaults reproduce the original lo-fi sound.
export type Fx = { filter: number; echo: number; space: number; wobble: number; crush: number }
export const DEFAULT_FX: Fx = { filter: 0.57, echo: 0.42, space: 0.5, wobble: 0.3, crush: 0.5 }

export type ModuleId = 'seq' | 'tape' | 'filter' | 'crush' | 'echo' | 'space' | 'out'
export type Cable = { from: ModuleId; to: ModuleId }

export type ModuleDef = {
  id: ModuleId
  label: string
  hint: string
  knob?: keyof Fx
  hasIn: boolean
  hasOut: boolean
}

export const MODULES: ModuleDef[] = [
  { id: 'seq', label: 'SEQ OUT', hint: 'the sequencer', hasIn: false, hasOut: true },
  { id: 'tape', label: 'TAPE', hint: 'wobbly pitch', knob: 'wobble', hasIn: true, hasOut: true },
  { id: 'filter', label: 'FILTER', hint: 'dark ↔ bright', knob: 'filter', hasIn: true, hasOut: true },
  { id: 'crush', label: 'CRUSH', hint: 'fewer bits', knob: 'crush', hasIn: true, hasOut: true },
  { id: 'echo', label: 'ECHO', hint: 'delay repeats', knob: 'echo', hasIn: true, hasOut: true },
  { id: 'space', label: 'SPACE', hint: 'reverb room', knob: 'space', hasIn: true, hasOut: true },
  { id: 'out', label: 'SPEAKERS', hint: 'what you hear', hasIn: true, hasOut: false },
]

// CRUSH is left unpatched as a spare to play with.
export const DEFAULT_CABLES: Cable[] = [
  { from: 'seq', to: 'tape' },
  { from: 'tape', to: 'filter' },
  { from: 'filter', to: 'echo' },
  { from: 'echo', to: 'space' },
  { from: 'space', to: 'out' },
]

// Each input takes one cable: plugging into a busy input replaces what was there.
export function plug(cables: Cable[], from: ModuleId, to: ModuleId) {
  return [...cables.filter((c) => c.to !== to), { from, to }]
}

// Whether a cable from `from` may go into input `to` (counting the replacement above).
export function canPlug(cables: Cable[], from: ModuleId, to: ModuleId) {
  return from !== to && !createsLoop(cables.filter((c) => c.to !== to), from, to)
}

// Web Audio mutes feedback loops without a delay in them, so loops are refused.
export function createsLoop(cables: Cable[], from: ModuleId, to: ModuleId) {
  const seen = new Set<ModuleId>()
  const stack = [to]
  while (stack.length) {
    const id = stack.pop()!
    if (id === from) return true
    if (seen.has(id)) continue
    seen.add(id)
    for (const c of cables) if (c.from === id) stack.push(c.to)
  }
  return false
}

export type RackState = { fx: Fx; cables: Cable[] }

let state: RackState = { fx: DEFAULT_FX, cables: DEFAULT_CABLES }
const listeners = new Set<() => void>()

export const rack = {
  get: () => state,
  set(patch: Partial<RackState>) {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export const useRack = () => useSyncExternalStore(rack.subscribe, rack.get)

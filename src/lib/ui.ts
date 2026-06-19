/**
 * Shared iOS-style "glass" className tokens.
 * Translucent surfaces + backdrop blur, with the UW-gold accent on focus.
 */

export const glass =
  "border border-white/[0.08] bg-white/[0.04] backdrop-blur-md"

export const glassCard = `rounded-2xl ${glass} shadow-2xl`

export const glassInput =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none backdrop-blur-md transition focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed"

export const glassButton =
  "rounded-lg border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-zinc-200 transition hover:border-yellow-500/30 hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"

export const goldButton =
  "rounded-lg bg-yellow-400 font-bold text-black shadow-lg shadow-yellow-400/10 transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed"

export const labelText =
  "block text-xs font-semibold uppercase tracking-widest text-zinc-400"

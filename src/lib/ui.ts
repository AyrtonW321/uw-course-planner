/**
 * Shared iOS "Liquid Glass" className tokens.
 * The visual material lives in index.css (.glass / .glass-input / .btn-gold);
 * these tokens compose it with Tailwind layout/typography utilities.
 */

export const glass = "glass"

export const glassCard = "rounded-2xl glass"

export const glassInput =
  "w-full rounded-xl glass-input px-4 py-2.5 text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"

export const glassButton =
  "rounded-xl glass glass-hover text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"

export const goldButton =
  "rounded-xl btn-gold font-bold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed"

export const labelText =
  "block text-xs font-semibold uppercase tracking-widest text-zinc-400"

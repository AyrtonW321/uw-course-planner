export { cn } from "./utils"

/** Full-bleed page canvas — same token everywhere; glass panels and the
 * constellation backdrop are what differentiate marketing from /app. */
export const voidBg = "bg-void min-h-screen"
export const appBg = voidBg

/** Shared full-bleed container. Fluid width, soft cap, responsive gutters. */
export const pageContainer = "w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8"

/** Glass card — the professional tier: flat tint, one specular edge,
 * hairline border. 12px radius (down from the old 24px). */
export const cardSurface = "glass rounded-[var(--radius-card)]"

/** Flat input surface — no blur (legibility over material for typed text),
 * 8px radius, gold focus ring. */
export const inputSurface =
  "w-full rounded-[var(--radius-input)] border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-bone outline-none placeholder:text-ash focus:border-gold/60 focus:ring-2 focus:ring-gold/15 disabled:opacity-50 disabled:cursor-not-allowed"

/** Secondary/ghost button — pill shape, hairline border, no fill. */
export const subtleButton =
  "rounded-full border border-white/[0.1] bg-white/[0.03] text-fog transition hover:border-gold/30 hover:bg-white/[0.06] hover:text-bone disabled:opacity-50 disabled:cursor-not-allowed"

/** Primary action — solid gold pill, the only filled surface in the app. */
export const primaryButton =
  "rounded-full bg-gold font-medium text-black transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"

/** Type scale. Switzer for display sizes, weight capped at 500 — hierarchy
 * comes from scale and tracking, never from bold. */
export const display =
  "font-heading text-[44px] sm:text-[56px] lg:text-display font-normal leading-[1.1] tracking-[-0.022em] text-bone"
export const headingLg =
  "font-heading text-[36px] sm:text-heading-lg font-normal leading-[1.1] tracking-[-0.022em] text-bone"
export const heading = "font-heading text-heading font-normal leading-[1.15] tracking-[-0.022em] text-bone"
export const headingSm = "font-heading text-heading-sm font-normal leading-[1.2] tracking-[-0.011em] text-bone"
export const subheading = "font-heading text-subheading font-normal leading-[1.25] text-bone"
export const headingXs = "text-heading-xs font-medium leading-[1.3] text-bone"
export const bodyLg = "text-body-lg leading-relaxed text-mist"
export const body = "text-body leading-relaxed text-fog"
export const caption = "text-caption text-fog"
export const eyebrow = "text-eyebrow font-medium uppercase tracking-[0.08em] text-gold"

/** Course code treatment (CS 135, MATH 137, ...). */
export const courseCode = "font-mono text-bone"

export const labelText = "block text-xs font-medium uppercase tracking-wide text-fog"

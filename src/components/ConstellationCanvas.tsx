import { useEffect, useRef, useState } from "react"
import { PREREQS } from "../lib/requirements"

interface Node {
  code: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

const GOLD = "250, 204, 21"
const MAX_NODES = 70

type Props = {
  /** Peak node/edge opacity multiplier, 0-1. Marketing pages want full
   * strength; the /app backdrop wants ~0.07 so glass panels refract it
   * without competing with foreground content. */
  opacity?: number
  /** Below this viewport width the canvas doesn't mount at all — battery
   * cost isn't worth it on mobile, callers should show a static CSS wash
   * instead (see .ambient-wash in index.css). */
  minWidthPx?: number
  className?: string
}

/** Real prereq edges (course -> prereq code), deduped, capped. */
function buildEdges(): { nodes: string[]; edges: [string, string][] } {
  const edges: [string, string][] = []
  const seen = new Set<string>()
  for (const [course, reqs] of Object.entries(PREREQS)) {
    for (const req of reqs) {
      seen.add(course)
      seen.add(req.code)
      edges.push([course, req.code])
    }
    if (seen.size >= MAX_NODES) break
  }
  return { nodes: [...seen].slice(0, MAX_NODES), edges }
}

/**
 * Signature visual: the real CS prerequisite graph, drifting in gold on
 * black. Nodes are courses; edges are actual prereq relationships — not
 * decorative proximity lines.
 */
export default function ConstellationCanvas({ opacity = 1, minWidthPx = 0, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= minWidthPx
  )

  useEffect(() => {
    if (minWidthPx <= 0) return
    const mq = window.matchMedia(`(min-width: ${minWidthPx}px)`)
    const onChange = () => setVisible(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [minWidthPx])

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId = 0
    let paused = document.hidden
    const { nodes: codes, edges } = buildEdges()
    const nodes = new Map<string, Node>()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    for (const code of codes) {
      nodes.set(code, {
        code,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.6 + 1,
      })
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!reducedMotion) {
        for (const n of nodes.values()) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < 0) n.x = canvas.width
          if (n.x > canvas.width) n.x = 0
          if (n.y < 0) n.y = canvas.height
          if (n.y > canvas.height) n.y = 0
        }
      }

      for (const [course, prereq] of edges) {
        const a = nodes.get(course)
        const b = nodes.get(prereq)
        if (!a || !b) continue
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const alpha = Math.max(0.04, 0.22 - dist / 4000) * opacity
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(${GOLD}, ${alpha})`
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      for (const n of nodes.values()) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${GOLD}, ${0.75 * opacity})`
        ctx.fill()
      }

      if (!reducedMotion && !paused) animId = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      paused = document.hidden
      if (!paused && !reducedMotion && !animId) draw()
    }
    document.addEventListener("visibilitychange", onVisibility)

    draw()

    return () => {
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [visible, opacity])

  if (!visible) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? "pointer-events-none fixed inset-0 z-0"}
    />
  )
}

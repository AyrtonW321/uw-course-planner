import { useEffect, useRef, useState } from "react"
import type { Content } from "firebase/ai"
import { useAdvisorTools } from "../lib/advisor/tools"
import { runAdvisorTurn } from "../lib/advisor/agent"
import type { ChatMessage } from "../lib/advisor/types"
import { errorMessage } from "../lib/errors"
import { cardSurface, headingSm, inputSurface, primaryButton } from "../lib/ui"

const STARTERS = [
  "What should I take next term?",
  "Am I on track to graduate?",
  "I'm interested in machine learning — which electives fit best?",
  "Do I meet the prerequisites for AMATH 449?",
]

// Chat is ephemeral by design (not part of the user's Firestore doc), but a refresh
// shouldn't silently discard the conversation — keep it in sessionStorage instead.
const SESSION_KEY = "advisor-chat"

function loadSession(): { messages: ChatMessage[]; history: Content[] } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return { messages: [], history: [] }
    const parsed = JSON.parse(raw)
    return { messages: parsed.messages ?? [], history: parsed.history ?? [] }
  } catch {
    return { messages: [], history: [] }
  }
}

export default function AdvisorPage() {
  const { declarations, execute } = useAdvisorTools()
  const [session] = useState(loadSession)
  const [messages, setMessages] = useState<ChatMessage[]>(session.messages)
  const [history, setHistory] = useState<Content[]>(session.history)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, busy])

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ messages, history }))
    } catch {
      // sessionStorage unavailable (e.g. private browsing quota) — chat just won't survive a refresh.
    }
  }, [messages, history])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setInput("")
    setError(null)
    setMessages((m) => [...m, { role: "user", text: q }])
    setBusy(true)
    try {
      const { text: reply, history: next } = await runAdvisorTurn({
        history,
        userText: q,
        declarations,
        execute,
      })
      setHistory(next)
      setMessages((m) => [...m, { role: "model", text: reply }])
    } catch (err) {
      setError(errorMessage(err, "The advisor is unavailable right now."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col">
      <div className="mb-4">
        <h1 className={headingSm}>Academic Advisor</h1>
        <p className="mt-1 text-sm text-fog">
          Ask about courses, prerequisites, degree progress, or what fits your interests. Advice is
          grounded in your plan and the live catalog — always confirm graduation-critical choices
          with your official advisor.
        </p>
      </div>

      {/* Transcript */}
      <div className={`${cardSurface} flex-1 overflow-y-auto p-4`}>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-lg font-medium text-gold">
              AI
            </div>
            <p className="max-w-sm text-sm text-fog">
              I can reason over your plan, grades, requirements, and real course content. Try one of
              these:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-fog transition hover:border-gold/30 hover:text-gold"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul role="log" aria-live="polite" aria-relevant="additions" className="space-y-4">
            {messages.map((m, i) => (
              <li key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-gold text-black"
                      : "border border-white/[0.08] bg-white/[0.04] text-mist"
                  }`}
                >
                  {m.text}
                </div>
              </li>
            ))}
            {busy && (
              <li className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                  <span className="sr-only">Advisor is typing…</span>
                  <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash [animation-delay:-0.2s]" />
                  <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash [animation-delay:-0.1s]" />
                  <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-ash" />
                </div>
              </li>
            )}
            <div ref={endRef} />
          </ul>
        )}
      </div>

      {error && (
        <div role="alert" aria-live="polite" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="mt-3 flex items-end gap-2"
      >
        <textarea
          aria-label="Message to advisor"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          rows={1}
          placeholder="Ask your advisor…"
          className={`${inputSurface} max-h-40 flex-1 resize-none`}
        />
        <button type="submit" disabled={busy || !input.trim()} className={`${primaryButton} px-5 py-2.5 text-sm`}>
          Send
        </button>
      </form>
    </div>
  )
}

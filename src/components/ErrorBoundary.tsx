import { Component, type ErrorInfo, type ReactNode } from "react"
import { cardSurface, primaryButton } from "../lib/ui"

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Catches render/runtime errors so a single failure doesn't white-screen the
 * whole app. Shows a recoverable fallback instead.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook a real error reporter (e.g. Sentry) in here later.
    console.error("Uncaught error:", error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-4 text-center">
        <div className={`${cardSurface} max-w-md p-8`}>
          <h1 className="text-xl font-normal text-bone">Something went wrong</h1>
          <p className="mt-2 text-sm text-ash">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`${primaryButton} mt-6 px-5 py-2.5 text-sm`}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}

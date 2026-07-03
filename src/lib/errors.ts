/** Safely read a message from an unknown thrown value. */
export function errorMessage(e: unknown, fallback = "Something went wrong."): string {
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as Record<string, unknown>).message
    if (typeof m === "string" && m.trim()) return m
  }
  return fallback
}

/** Read a Firebase-style error code (e.g. "auth/requires-recent-login"). */
export function errorCode(e: unknown): string | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    return String((e as Record<string, unknown>).code)
  }
  return undefined
}

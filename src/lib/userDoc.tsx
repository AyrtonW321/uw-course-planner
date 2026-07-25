import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { doc, onSnapshot, setDoc, type DocumentData } from "firebase/firestore"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth, db } from "./firebase"

/**
 * Single source of truth for the signed-in user's Firestore document.
 * ------------------------------------------------------------------
 * Subscribes to `users/{uid}` once with onSnapshot and shares the data with
 * every consumer (profile, timetable, degree plan, co-op). This replaces the
 * previous pattern where each hook independently getDoc'd the same document —
 * cutting redundant reads and keeping all views live and consistent after a
 * write (no stale state).
 */

type UserDocContextValue = {
  user: User | null
  authLoading: boolean
  data: DocumentData | null
  /** True until both auth state and the first snapshot have resolved. */
  loading: boolean
  /** Merge a partial into the user document (optimistic + persisted). */
  update: (partial: Record<string, unknown>) => Promise<void>
}

const UserDocContext = createContext<UserDocContextValue | null>(null)

export function UserDocProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [authLoading, setAuthLoading] = useState(true)
  const [data, setData] = useState<DocumentData | null>(null)
  const [docLoading, setDocLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setData(null)
      setDocLoading(false)
      return
    }
    setDocLoading(true)
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setData(snap.exists() ? snap.data() : {})
        setDocLoading(false)
      },
      () => {
        setData({})
        setDocLoading(false)
      }
    )
    return unsub
  }, [user, authLoading])

  const update = useCallback(
    async (partial: Record<string, unknown>) => {
      if (!user) return
      // Optimistic local merge; onSnapshot confirms with the server value.
      const prevData = data
      setData((prev) => ({ ...(prev ?? {}), ...partial }))
      try {
        await setDoc(doc(db, "users", user.uid), partial, { merge: true })
      } catch (err) {
        // Roll back the optimistic merge so the UI doesn't show unsaved changes as saved.
        setData(prevData)
        setSaveError(err instanceof Error ? err.message : "Failed to save changes")
        throw err
      }
    },
    [user, data]
  )

  const value = useMemo<UserDocContextValue>(
    () => ({ user, authLoading, data, loading: authLoading || docLoading, update }),
    [user, authLoading, data, docLoading, update]
  )

  return (
    <UserDocContext.Provider value={value}>
      {children}
      {saveError && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/90 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur"
        >
          <span>Couldn't save your changes: {saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-300 hover:text-white"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </UserDocContext.Provider>
  )
}

export function useUserDoc(): UserDocContextValue {
  const ctx = useContext(UserDocContext)
  if (!ctx) throw new Error("useUserDoc must be used within a UserDocProvider")
  return ctx
}

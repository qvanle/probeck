import { useCallback, useEffect, useState } from "react"

type State<T> = { status: "loading" } | { status: "error"; error: Error } | { status: "ready"; data: T }

/** Runs `load` once per `key`; `retry` re-runs it. `load` should be cheap to call again (the repo caches). */
export function useAsync<T>(load: () => Promise<T>, key: string) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ key: string; attempt: number; value: State<T> }>({
    key,
    attempt,
    value: { status: "loading" },
  })

  useEffect(() => {
    let live = true
    load().then(
      (data) => live && setState({ key, attempt, value: { status: "ready", data } }),
      (e) => live && setState({ key, attempt, value: { status: "error", error: e instanceof Error ? e : new Error(String(e)) } }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  // A result for a different key/attempt is stale: show loading instead.
  const current: State<T> = state.key === key && state.attempt === attempt ? state.value : { status: "loading" }
  return { ...current, retry }
}

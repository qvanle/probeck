import { useEffect, useState } from "react"

type Theme = "dark" | "light"
const KEY = "probeck.theme"

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // storage unavailable — fall through to default
  }
  return "light"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }
}

import { useSyncExternalStore } from "react"
import type { CategorySummary, CourseSummary, ExamSummary, Outcome } from "@/data/types"

/**
 * Progress lives only in this browser's localStorage (no backend, no account).
 * Clearing site data wipes it — that is deliberate.
 *
 * Shape is compact and versioned:
 *   answers: latest outcome per question  (drives mastery)
 *   totals:  lifetime answered / score    (drives accuracy)
 *   days:    local dates with activity    (drives the streak)
 */
type Code = "c" | "p" | "w"
type Stored = {
  v: 1
  answers: Record<string, { c: string; o: Code; t: number }>
  totals: { answered: number; score: number }
  days: string[]
}

const KEY = "probeck.history.v1"
const empty = (): Stored => ({ v: 1, answers: {}, totals: { answered: 0, score: 0 }, days: [] })
const CODE: Record<Outcome, Code> = { correct: "c", partial: "p", wrong: "w" }
const SCORE: Record<Code, number> = { c: 1, p: 0.5, w: 0 }

let state: Stored = load()
const listeners = new Set<() => void>()

function load(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Stored
      if (parsed?.v === 1) return parsed
    }
  } catch {
    // unavailable or corrupt — start empty
  }
  return empty()
}

function commit(next: Stored) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage full or blocked: keep working in memory for this tab
  }
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      state = load()
      cb()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function recordAnswer(examId: string, categoryId: string, questionId: string, outcome: Outcome) {
  const code = CODE[outcome]
  const day = today()
  commit({
    v: 1,
    answers: { ...state.answers, [`${examId}/${questionId}`]: { c: categoryId, o: code, t: Date.now() } },
    totals: { answered: state.totals.answered + 1, score: state.totals.score + SCORE[code] },
    days: state.days.includes(day) ? state.days : [...state.days, day].slice(-400),
  })
}

export function resetHistory() {
  commit(empty())
}

export type History = Stored
export const useHistory = (): History => useSyncExternalStore(subscribe, () => state)

// ---- derived stats ---------------------------------------------------------

export function categoryProgress(h: History, examId: string, cat: CategorySummary) {
  let answered = 0
  let score = 0
  for (const [key, a] of Object.entries(h.answers)) {
    if (a.c === cat.id && key.startsWith(`${examId}/`)) {
      answered++
      score += SCORE[a.o]
    }
  }
  return { answered, mastery: cat.questionCount ? Math.min(1, score / cat.questionCount) : 0 }
}

export function examProgress(h: History, exam: ExamSummary) {
  let answered = 0
  let score = 0
  for (const cat of exam.categories) {
    const p = categoryProgress(h, exam.id, cat)
    answered += p.answered
    score += p.mastery * cat.questionCount
  }
  return { answered, mastery: exam.questionCount ? score / exam.questionCount : 0 }
}

export function courseProgress(h: History, course: CourseSummary) {
  let answered = 0
  let score = 0
  for (const exam of course.exams) {
    const p = examProgress(h, exam)
    answered += p.answered
    score += p.mastery * exam.questionCount
  }
  return { answered, mastery: course.questionCount ? score / course.questionCount : 0 }
}

export function overallStats(h: History) {
  const accuracy = h.totals.answered ? Math.round((h.totals.score / h.totals.answered) * 100) : null
  // streak = consecutive days with activity, ending today (or yesterday, so it doesn't reset before you've practised)
  const days = new Set(h.days)
  const cursor = new Date()
  if (!days.has(today())) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  for (;;) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`
    if (!days.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return { answered: h.totals.answered, accuracy, streak }
}

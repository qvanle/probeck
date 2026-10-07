import type { ExamSummary, Question, Session } from "@/data/types"

export const MIXED_ID = "mixed"
const MIXED_SIZE = 12

/** Small deterministic PRNG, so a seed in the URL always reproduces the same mixed session. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const newSeed = () => Math.floor(Math.random() * 1_000_000_000)

export function buildSession(exam: ExamSummary, all: Question[], categoryId: string, seed: number): Session | null {
  if (categoryId === MIXED_ID) {
    const rand = mulberry32(seed)
    const pool = [...all]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return { id: MIXED_ID, title: `${exam.title} · mixed`, questions: pool.slice(0, MIXED_SIZE) }
  }
  const category = exam.categories.find((c) => c.id === categoryId)
  if (!category) return null
  const questions = all.filter((q) => q.categoryId === categoryId)
  return questions.length ? { id: category.id, title: category.title, questions } : null
}

export type Difficulty = 1 | 2 | 3

export type Choice = {
  id: string
  text: string
  correct: boolean
}

export type ChoiceQuestion = {
  id: string
  type: "single" | "multi"
  prompt: string
  code?: string
  /** Illustration shown with the prompt. `src` is relative to public/ (or an absolute URL). */
  image?: { src: string; alt: string }
  choices: Choice[]
  explanation: string
  difficulty: Difficulty
  /** Recall mode: show only the prompt first; options appear after the user reveals them. */
  recall?: boolean
}

export type Question = ChoiceQuestion

export type Category = {
  id: string
  title: string
  description: string
  questions: Question[]
  /** 0–1, derived from local progress */
  mastery: number
}

export type Exam = {
  id: string
  title: string
  description: string
  tags: string[]
  categories: Category[]
}

/** Outcome of one answered question in a session. */
export type Outcome = "correct" | "partial" | "wrong"

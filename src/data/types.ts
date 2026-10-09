export type Difficulty = 1 | 2 | 3

export type Choice = {
  id: string
  text: string
  correct: boolean
}

export type ChoiceQuestion = {
  id: string
  categoryId: string
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

/** From index.sqlite: enough to render the table of contents without loading any exam file. */
export type CategorySummary = {
  id: string
  title: string
  description: string
  questionCount: number
}

export type ExamSummary = {
  id: string
  courseId: string
  title: string
  description: string
  tags: string[]
  /** Bumped when the exam content changes; used to bust the browser cache. */
  version: number
  file: string
  questionCount: number
  categories: CategorySummary[]
}

/** The questions of one sitting: one category, or a seeded mix across the exam. */
export type Session = {
  id: string
  title: string
  questions: Question[]
}

/** Outcome of one answered question in a session. */
export type Outcome = "correct" | "partial" | "wrong"

/** A group of exams (e.g. "Database 101"); the home screen lists these. */
export type CourseSummary = {
  id: string
  title: string
  description: string
  exams: ExamSummary[]
  questionCount: number
}

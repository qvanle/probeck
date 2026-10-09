import { openDatabase, select } from "@/data/db"
import type { CourseSummary, ExamSummary, Question } from "@/data/types"

let examList: Promise<ExamSummary[]> | undefined

/** The table of contents: all exams and their categories, from index.sqlite. */
export function listExams(): Promise<ExamSummary[]> {
  examList ??= (async () => {
    const db = await openDatabase("index.sqlite", null)
    const cats = select<{ exam_id: string; id: string; title: string; description: string; question_count: number }>(
      db,
      "SELECT exam_id, id, title, description, question_count FROM category ORDER BY exam_id, sort",
    )
    return select<{
      id: string
      course_id: string
      title: string
      description: string
      tags: string
      version: number
      file: string
      question_count: number
    }>(db, "SELECT id, course_id, title, description, tags, version, file, question_count FROM exam ORDER BY sort").map((e) => ({
      id: e.id,
      courseId: e.course_id,
      title: e.title,
      description: e.description,
      tags: JSON.parse(e.tags) as string[],
      version: e.version,
      file: e.file,
      questionCount: e.question_count,
      categories: cats
        .filter((c) => c.exam_id === e.id)
        .map((c) => ({ id: c.id, title: c.title, description: c.description, questionCount: c.question_count })),
    }))
  })()
  examList.catch(() => (examList = undefined))
  return examList
}

/** Courses with their exams, from index.sqlite. */
export async function listCourses(): Promise<CourseSummary[]> {
  const [exams, db] = [await listExams(), await openDatabase("index.sqlite", null)]
  return select<{ id: string; title: string; description: string }>(
    db,
    "SELECT id, title, description FROM course ORDER BY sort",
  ).map((c) => {
    const own = exams.filter((e) => e.courseId === c.id)
    return { ...c, exams: own, questionCount: own.reduce((n, e) => n + e.questionCount, 0) }
  })
}

const questionCache = new Map<string, Promise<Question[]>>()

/** Every question of an exam, in authoring order, from that exam's own sqlite file. */
export function loadQuestions(exam: ExamSummary): Promise<Question[]> {
  const key = `${exam.id}@${exam.version}`
  let p = questionCache.get(key)
  if (!p) {
    p = (async () => {
      const db = await openDatabase(exam.file, exam.version)
      const choices = select<{ question_id: string; id: string; text: string; is_correct: number }>(
        db,
        "SELECT question_id, id, text, is_correct FROM choice ORDER BY question_id, idx",
      )
      const byQuestion = new Map<string, Question["choices"]>()
      for (const c of choices) {
        const list = byQuestion.get(c.question_id) ?? []
        list.push({ id: c.id, text: c.text, correct: c.is_correct === 1 })
        byQuestion.set(c.question_id, list)
      }
      return select<{
        id: string
        category_id: string
        type: Question["type"]
        difficulty: Question["difficulty"]
        prompt: string
        code: string | null
        image_src: string | null
        image_alt: string | null
        recall: number
        explanation: string
      }>(db, "SELECT * FROM question ORDER BY sort").map((q) => ({
        id: q.id,
        categoryId: q.category_id,
        type: q.type,
        difficulty: q.difficulty,
        prompt: q.prompt,
        code: q.code ?? undefined,
        image: q.image_src ? { src: q.image_src, alt: q.image_alt ?? "" } : undefined,
        recall: q.recall === 1,
        explanation: q.explanation,
        choices: byQuestion.get(q.id) ?? [],
      }))
    })()
    p.catch(() => questionCache.delete(key))
    questionCache.set(key, p)
  }
  return p
}

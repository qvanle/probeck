import { lazy, Suspense, useEffect, useMemo } from "react"
import { HashRouter, Navigate, Route, Routes, useMatch, useNavigate, useParams, useSearchParams } from "react-router"
import { AppShell } from "@/components/app-shell"
import { ErrorPanel, LoadingPanel } from "@/components/states"
import { loadQuestions, listCourses, listExams } from "@/data/repo"
import { MIXED_ID, buildSession, newSeed } from "@/data/session"
import type { CourseSummary, ExamSummary, Outcome } from "@/data/types"
import { recordAnswer } from "@/lib/history"
import { useAsync } from "@/lib/use-async"
import { ExamScreen } from "@/screens/exam"
import { CourseScreen } from "@/screens/course"
import { HomeScreen } from "@/screens/home"

// The quiz and results screens (and the syntax highlighter they pull in) are only needed once a session starts.
const QuizScreen = lazy(() => import("@/screens/quiz").then((m) => ({ default: m.QuizScreen })))
const ResultsScreen = lazy(() => import("@/screens/results").then((m) => ({ default: m.ResultsScreen })))

// Hash routing: refresh-safe and works on GitHub Pages without server rewrites.
//   #/                                       course list         (index.sqlite)
//   #/course/:courseId                       exam list           (index.sqlite)
//   #/exam/:examId                           categories           (index.sqlite)
//   #/exam/:examId/:categoryId               quiz session         (<exam>.sqlite, loaded now)
//   #/exam/:examId/mixed?seed=N              seeded mixed session
//   #/exam/:examId/:categoryId/results?r=cpw&t=42[&seed=N]   results (outcomes live in the URL)

const OUTCOME_CODE: Record<Outcome, string> = { correct: "c", partial: "p", wrong: "w" }
const CODE_OUTCOME = Object.fromEntries(Object.entries(OUTCOME_CODE).map(([o, c]) => [c, o])) as Record<string, Outcome>

const encodeOutcomes = (o: Outcome[]) => o.map((x) => OUTCOME_CODE[x]).join("")
const decodeOutcomes = (s: string, expected: number): Outcome[] | null => {
  const list = [...s].map((c) => CODE_OUTCOME[c])
  return list.length === expected && list.every(Boolean) ? list : null
}

function useCourses() {
  return useAsync(listCourses, "courses")
}

function useExams() {
  return useAsync(listExams, "exams")
}

/** Loads the exam list and resolves :examId; renders loading / error / redirect states. */
function WithExam({ children }: { children: (exam: ExamSummary) => React.ReactNode }) {
  const { examId } = useParams()
  const exams = useExams()
  if (exams.status === "loading") return <LoadingPanel label="Loading exams…" />
  if (exams.status === "error") return <ErrorPanel error={exams.error} onRetry={exams.retry} />
  const exam = exams.data.find((e) => e.id === examId)
  return exam ? <>{children(exam)}</> : <Navigate to="/" replace />
}

function HomeRoute() {
  const navigate = useNavigate()
  const courses = useCourses()
  if (courses.status === "loading") return <LoadingPanel label="Loading courses…" />
  if (courses.status === "error") return <ErrorPanel error={courses.error} onRetry={courses.retry} />
  return <HomeScreen courses={courses.data} onOpenCourse={(c: CourseSummary) => navigate(`/course/${c.id}`)} />
}

function CourseRoute() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const courses = useCourses()
  if (courses.status === "loading") return <LoadingPanel label="Loading exams…" />
  if (courses.status === "error") return <ErrorPanel error={courses.error} onRetry={courses.retry} />
  const course = courses.data.find((c) => c.id === courseId)
  if (!course) return <Navigate to="/" replace />
  return <CourseScreen course={course} onBack={() => navigate("/")} onOpenExam={(e) => navigate(`/exam/${e.id}`)} />
}

/** Opening an exam starts downloading its sqlite file in the background, so starting a session is instant. */
function Prefetch({ exam }: { exam: ExamSummary }) {
  useEffect(() => {
    loadQuestions(exam).catch(() => {}) // errors surface (with a retry) when a session actually needs the data
  }, [exam])
  return null
}

function ExamRoute() {
  const navigate = useNavigate()
  return (
    <WithExam>
      {(exam) => (
        <>
        <Prefetch exam={exam} />
        <ExamScreen
          exam={exam}
          onBack={() => navigate(`/course/${exam.courseId}`)}
          onStart={(c) => navigate(`/exam/${exam.id}/${c.id}`)}
          onStartMixed={() => navigate(`/exam/${exam.id}/${MIXED_ID}`)}
        />
        </>
      )}
    </WithExam>
  )
}

/** Resolves the exam, downloads its sqlite file, and builds the session for :categoryId. */
function WithSession({
  children,
}: {
  children: (args: { exam: ExamSummary; session: NonNullable<ReturnType<typeof buildSession>>; seed: number }) => React.ReactNode
}) {
  const { categoryId = "" } = useParams()
  const [params] = useSearchParams()
  const seed = Number(params.get("seed")) || 0

  return (
    <WithExam>
      {(exam) => (
        <SessionLoader exam={exam} categoryId={categoryId} seed={seed}>
          {(session) => children({ exam, session, seed })}
        </SessionLoader>
      )}
    </WithExam>
  )
}

function SessionLoader({
  exam,
  categoryId,
  seed,
  children,
}: {
  exam: ExamSummary
  categoryId: string
  seed: number
  children: (session: NonNullable<ReturnType<typeof buildSession>>) => React.ReactNode
}) {
  const questions = useAsync(() => loadQuestions(exam), `${exam.id}@${exam.version}`)
  const session = useMemo(
    () => (questions.status === "ready" ? buildSession(exam, questions.data, categoryId, seed) : null),
    [questions, exam, categoryId, seed],
  )

  if (questions.status === "loading") return <LoadingPanel label={`Loading ${exam.title}…`} />
  if (questions.status === "error") return <ErrorPanel error={questions.error} onRetry={questions.retry} />
  if (!session) return <Navigate to={`/exam/${exam.id}`} replace />
  return <>{children(session)}</>
}

function QuizRoute() {
  const navigate = useNavigate()
  const { categoryId } = useParams()
  const [params] = useSearchParams()

  // A mixed session needs a seed in the URL so refresh/share reproduces the same questions.
  if (categoryId === MIXED_ID && !params.get("seed")) return <Navigate to={`?seed=${newSeed()}`} replace />

  return (
    <WithSession>
      {({ exam, session, seed }) => (
        <QuizScreen
          key={`${session.id}:${seed}`}
          session={session}
          onExit={() => navigate(`/exam/${exam.id}`)}
          onAnswer={(q, outcome) => recordAnswer(exam.id, q.categoryId, q.id, outcome)}
          onFinish={(outcomes, seconds) => {
            const qs = new URLSearchParams({ r: encodeOutcomes(outcomes), t: String(seconds) })
            if (session.id === MIXED_ID) qs.set("seed", String(seed))
            // replace: Back from results shouldn't re-enter a finished session
            navigate(`/exam/${exam.id}/${session.id}/results?${qs}`, { replace: true })
          }}
        />
      )}
    </WithSession>
  )
}

function ResultsRoute() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  return (
    <WithSession>
      {({ exam, session }) => {
        const outcomes = decodeOutcomes(params.get("r") ?? "", session.questions.length)
        if (!outcomes) return <Navigate to={`/exam/${exam.id}`} replace />
        return (
          <ResultsScreen
            session={session}
            outcomes={outcomes}
            seconds={Number(params.get("t")) || 0}
            onRetry={() => navigate(`/exam/${exam.id}/${session.id}`)}
            onDone={() => navigate(`/exam/${exam.id}`)}
          />
        )
      }}
    </WithSession>
  )
}

function Shell() {
  const navigate = useNavigate()
  const inQuiz = useMatch("/exam/:examId/:categoryId") !== null
  return (
    <AppShell onHome={() => navigate("/")} fit={inQuiz}>
      <Suspense fallback={<LoadingPanel />}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/course/:courseId" element={<CourseRoute />} />
        <Route path="/exam/:examId" element={<ExamRoute />} />
        <Route path="/exam/:examId/:categoryId" element={<QuizRoute />} />
        <Route path="/exam/:examId/:categoryId/results" element={<ResultsRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AppShell>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}

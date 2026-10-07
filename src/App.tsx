import { HashRouter, Navigate, Route, Routes, useMatch, useNavigate, useParams, useSearchParams } from "react-router"
import { AppShell } from "@/components/app-shell"
import { exams } from "@/data/mock"
import type { Outcome } from "@/data/types"
import { ExamScreen } from "@/screens/exam"
import { HomeScreen } from "@/screens/home"
import { QuizScreen } from "@/screens/quiz"
import { ResultsScreen } from "@/screens/results"

// Hash routing: refresh-safe and works on GitHub Pages without server rewrites.
//   #/                              exam list
//   #/exam/:examId                  categories
//   #/exam/:examId/:categoryId      quiz session
//   #/exam/:examId/:categoryId/results?r=cpw&t=42   results (outcomes live in the URL)

const OUTCOME_CODE: Record<Outcome, string> = { correct: "c", partial: "p", wrong: "w" }
const CODE_OUTCOME = Object.fromEntries(Object.entries(OUTCOME_CODE).map(([o, c]) => [c, o])) as Record<
  string,
  Outcome
>

const encodeOutcomes = (o: Outcome[]) => o.map((x) => OUTCOME_CODE[x]).join("")
const decodeOutcomes = (s: string, expected: number): Outcome[] | null => {
  const list = [...s].map((c) => CODE_OUTCOME[c])
  return list.length === expected && list.every(Boolean) ? list : null
}

function useRouteData() {
  const { examId, categoryId } = useParams()
  const exam = exams.find((e) => e.id === examId)
  const category = exam?.categories.find((c) => c.id === categoryId)
  return { exam, category }
}

function HomeRoute() {
  const navigate = useNavigate()
  return <HomeScreen exams={exams} onOpenExam={(e) => navigate(`/exam/${e.id}`)} />
}

function ExamRoute() {
  const navigate = useNavigate()
  const { exam } = useRouteData()
  if (!exam) return <Navigate to="/" replace />
  return (
    <ExamScreen exam={exam} onBack={() => navigate("/")} onStart={(c) => navigate(`/exam/${exam.id}/${c.id}`)} />
  )
}

function QuizRoute() {
  const navigate = useNavigate()
  const { exam, category } = useRouteData()
  if (!exam || !category) return <Navigate to="/" replace />
  return (
    <QuizScreen
      category={category}
      onExit={() => navigate(`/exam/${exam.id}`)}
      onFinish={(outcomes, seconds) =>
        navigate(`/exam/${exam.id}/${category.id}/results?r=${encodeOutcomes(outcomes)}&t=${seconds}`, {
          replace: true, // back from results shouldn't re-enter a finished session
        })
      }
    />
  )
}

function ResultsRoute() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { exam, category } = useRouteData()
  if (!exam || !category) return <Navigate to="/" replace />

  const outcomes = decodeOutcomes(params.get("r") ?? "", category.questions.length)
  if (!outcomes) return <Navigate to={`/exam/${exam.id}`} replace />

  return (
    <ResultsScreen
      category={category}
      outcomes={outcomes}
      seconds={Number(params.get("t")) || 0}
      onRetry={() => navigate(`/exam/${exam.id}/${category.id}`)}
      onDone={() => navigate(`/exam/${exam.id}`)}
    />
  )
}

function Shell() {
  const navigate = useNavigate()
  const inQuiz = useMatch("/exam/:examId/:categoryId") !== null
  return (
    <AppShell onHome={() => navigate("/")} fit={inQuiz}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/exam/:examId" element={<ExamRoute />} />
        <Route path="/exam/:examId/:categoryId" element={<QuizRoute />} />
        <Route path="/exam/:examId/:categoryId/results" element={<ResultsRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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

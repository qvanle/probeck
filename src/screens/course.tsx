import { ArrowUpRightIcon, ChevronLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MasteryMeter, Stat } from "@/components/meters"
import { courseProgress, examProgress, useHistory } from "@/lib/history"
import type { CourseSummary, ExamSummary } from "@/data/types"

export function CourseScreen({
  course,
  onBack,
  onOpenExam,
}: {
  course: CourseSummary
  onBack: () => void
  onOpenExam: (exam: ExamSummary) => void
}) {
  const history = useHistory()
  const exams = course.exams
  const progress = courseProgress(history, course)

  return (
    <div className="flex flex-col gap-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="-ml-2.5 w-fit text-muted-foreground" onClick={onBack}>
          <ChevronLeftIcon /> All courses
        </Button>
        <div className="flex max-w-xl flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{course.title}</h1>
          <p className="text-pretty text-muted-foreground">{course.description}</p>
        </div>
        <div className="flex gap-10 border-y py-5">
          <Stat label="Exams" value={exams.length} />
          <Stat label="Questions" value={course.questionCount} />
          <Stat label="Mastery" value={Math.round(progress.mastery * 100)} unit="%" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="label-caps">Exams</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{exams.length} available</span>
        </div>


        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam, i) => {
            const progress = examProgress(history, exam)
            return (
              <button
                key={exam.id}
                type="button"
                onClick={() => onOpenExam(exam)}
                className="group relative flex flex-col gap-5 rounded-lg border bg-card p-5 text-left transition-all duration-200 outline-none hover:-translate-y-0.5 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between">
                  <span className="label-caps tabular-nums">EX · {String(i + 1).padStart(2, "0")}</span>
                  <ArrowUpRightIcon className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{exam.title}</h3>
                  <p className="line-clamp-2 text-[15px] text-muted-foreground">{exam.description}</p>
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                    <span>{exam.categories.length} categories</span>
                    <span className="size-0.5 rounded-full bg-muted-foreground" />
                    <span>{exam.questionCount} questions</span>
                  </div>
                  <MasteryMeter value={progress.mastery} />
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

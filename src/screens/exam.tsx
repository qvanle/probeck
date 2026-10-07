import { ChevronLeftIcon, ChevronRightIcon, ShuffleIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MasteryMeter, Stat } from "@/components/meters"
import { examMastery, examQuestionCount } from "@/data/mock"
import type { Category, Exam } from "@/data/types"

export function ExamScreen({
  exam,
  onBack,
  onStart,
}: {
  exam: Exam
  onBack: () => void
  onStart: (category: Category) => void
}) {
  return (
    <div className="flex flex-col gap-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="-ml-2.5 w-fit text-muted-foreground" onClick={onBack}>
          <ChevronLeftIcon /> All exams
        </Button>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-xl flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {exam.tags.map((t) => (
                <Badge key={t} variant="outline" className="rounded-md font-normal text-muted-foreground">
                  {t}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{exam.title}</h1>
            <p className="text-pretty text-muted-foreground">{exam.description}</p>
          </div>
          <Button size="lg" onClick={() => onStart(exam.categories[0])}>
            <ShuffleIcon /> Mixed session
          </Button>
        </div>

        <div className="flex gap-10 border-y py-5">
          <Stat label="Questions" value={examQuestionCount(exam)} />
          <Stat label="Categories" value={exam.categories.length} />
          <Stat label="Mastery" value={Math.round(examMastery(exam) * 100)} unit="%" />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Categories</h2>
        <ol className="flex flex-col overflow-hidden rounded-lg border bg-card">
          {exam.categories.map((c, i) => (
            <li key={c.id} className="border-b last:border-b-0">
              <button
                type="button"
                onClick={() => onStart(c)}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/50 sm:grid-cols-[auto_1fr_10rem_auto] sm:px-5"
              >
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2 font-medium">
                    {c.title}
                    {c.mastery === 0 && (
                      <Badge className="h-4.5 rounded-sm px-1.5 text-[10px] tracking-wider uppercase">New</Badge>
                    )}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {c.questions.length} questions · {c.description}
                  </span>
                </span>
                <MasteryMeter value={c.mastery} className="hidden sm:flex" />
                <ChevronRightIcon className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

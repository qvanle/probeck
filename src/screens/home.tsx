import { ArrowUpRightIcon } from "lucide-react"
import { MasteryMeter, Stat } from "@/components/meters"
import { examMastery, examQuestionCount } from "@/data/mock"
import type { Exam } from "@/data/types"

export function HomeScreen({ exams, onOpenExam }: { exams: Exam[]; onOpenExam: (exam: Exam) => void }) {
  return (
    <div className="flex flex-col gap-12 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="label-caps flex items-center gap-2">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            Session ready
          </span>
          <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            Probe what you know<span className="text-primary">.</span>
          </h1>
          <p className="max-w-lg text-pretty text-muted-foreground">
            Pick an exam, drill a category, and find the gaps before your interviewer does.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border">
          {[
            { label: "Answered", value: "214" },
            { label: "Accuracy", value: "73", unit: "%" },
            { label: "Streak", value: "6", unit: "d" },
          ].map((s) => (
            <div key={s.label} className="bg-card px-4 py-4 sm:px-6">
              <Stat {...s} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="label-caps">Exams</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{exams.length} available</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam, i) => (
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
                  <span>{examQuestionCount(exam)} questions</span>
                </div>
                <MasteryMeter value={examMastery(exam)} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

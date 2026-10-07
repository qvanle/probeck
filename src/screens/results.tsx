import { CheckIcon, MinusIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SegmentedProgress, Stat } from "@/components/meters"
import { RichText } from "@/components/rich-text"
import { cn } from "@/lib/utils"
import type { Outcome, Session } from "@/data/types"

const outcomeIcon: Record<Outcome, React.ReactNode> = {
  correct: <CheckIcon className="size-3.5 text-success" />,
  partial: <MinusIcon className="size-3.5 text-warning" />,
  wrong: <XIcon className="size-3.5 text-destructive" />,
}

export function ResultsScreen({
  session,
  outcomes,
  seconds,
  onRetry,
  onDone,
}: {
  session: Session
  outcomes: Outcome[]
  seconds: number
  onRetry: () => void
  onDone: () => void
}) {
  const score = outcomes.reduce((s, o) => s + (o === "correct" ? 1 : o === "partial" ? 0.5 : 0), 0)
  const pct = Math.round((score / outcomes.length) * 100)
  const count = (o: Outcome) => outcomes.filter((x) => x === o).length

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-500">
      <div className="flex flex-col gap-6">
        <span className="label-caps">Session complete · {session.title}</span>
        <div className="flex items-end gap-3">
          <span
            className={cn(
              "text-7xl leading-none font-semibold tracking-tighter tabular-nums sm:text-8xl",
              pct >= 80 ? "text-success" : pct >= 50 ? "text-primary" : "text-destructive",
            )}
          >
            {pct}
          </span>
          <span className="mb-2 text-2xl font-medium text-muted-foreground">%</span>
        </div>
        <SegmentedProgress segments={outcomes} className="[&>div]:h-1.5" />
      </div>

      <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border bg-border">
        {[
          { label: "Correct", value: count("correct") },
          { label: "Partly", value: count("partial") },
          { label: "Missed", value: count("wrong") },
          { label: "Time", value: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` },
        ].map((s) => (
          <div key={s.label} className="bg-card px-4 py-4">
            <Stat {...s} />
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Breakdown</h2>
        <ol className="flex flex-col overflow-hidden rounded-lg border bg-card">
          {session.questions.map((q, i) => (
            <li key={q.id} className="flex items-start gap-3 border-b px-4 py-3 text-sm last:border-b-0">
              <span className="mt-0.5 w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="mt-0.5 shrink-0">{outcomeIcon[outcomes[i]]}</span>
              <span className="line-clamp-2 text-foreground/90">
                <RichText text={q.prompt} />
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDone}>
          Back to exam
        </Button>
        <Button onClick={onRetry}>
          <RotateCcwIcon /> Retry session
        </Button>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useState } from "react"
import { ArrowRightIcon, EyeIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { QuestionVisual } from "@/components/question-visual"
import { ChoiceOption, type ChoiceState } from "@/components/choice-option"
import { DifficultyPips, SegmentedProgress, type SegmentState } from "@/components/meters"
import { RichText } from "@/components/rich-text"
import { cn } from "@/lib/utils"
import type { ChoiceQuestion, Outcome, Session } from "@/data/types"

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

function gradeChoice(q: ChoiceQuestion, selected: Set<string>): Outcome {
  const correct = new Set(q.choices.filter((c) => c.correct).map((c) => c.id))
  const hits = [...selected].filter((id) => correct.has(id)).length
  const misses = selected.size - hits
  if (misses === 0 && hits === correct.size) return "correct"
  if (misses === 0 && hits > 0) return "partial"
  return "wrong"
}

function choiceState(q: ChoiceQuestion, id: string, selected: Set<string>, submitted: boolean): ChoiceState {
  const isSel = selected.has(id)
  if (!submitted) return isSel ? "selected" : "idle"
  const isCorrect = q.choices.find((c) => c.id === id)!.correct
  if (isCorrect && isSel) return "correct"
  if (isCorrect) return q.type === "multi" ? "missed" : "correct"
  if (isSel) return "wrong"
  return "dimmed"
}

const verdict: Record<Outcome, { label: string; className: string }> = {
  correct: { label: "Correct", className: "border-success text-success" },
  partial: { label: "Partly right", className: "border-warning text-warning" },
  wrong: { label: "Not quite", className: "border-destructive text-destructive" },
}

export function QuizScreen({
  session,
  onExit,
  onFinish,
  onAnswer,
}: {
  session: Session
  onExit: () => void
  onFinish: (outcomes: Outcome[], seconds: number) => void
  /** Called once per answered question, so the caller can persist progress. */
  onAnswer?: (question: ChoiceQuestion, outcome: Outcome) => void
}) {
  const questions = session.questions
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [revealed, setRevealed] = useState(false)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [seconds, setSeconds] = useState(0)

  const q = questions[index]
  const current = outcomes[index] as Outcome | undefined
  const answered = current !== undefined
  const isLast = index === questions.length - 1
  // Recall mode: the prompt is shown alone until the user reveals the options.
  const optionsHidden = !!q.recall && !revealed && !answered

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const record = useCallback(
    (o: Outcome) => {
      onAnswer?.(q, o)
      setOutcomes((prev) => [...prev.slice(0, index), o])
    },
    [index, q, onAnswer],
  )

  const next = useCallback(() => {
    if (isLast) return onFinish(outcomes, seconds)
    setIndex((i) => i + 1)
    setSelected(new Set())
    setRevealed(false)
  }, [isLast, onFinish, outcomes, seconds])

  const toggle = useCallback(
    (id: string) => {
      if (answered) return
      setSelected((prev) => {
        if (q.type === "single") return new Set([id])
        const s = new Set(prev)
        if (s.has(id)) s.delete(id)
        else s.add(id)
        return s
      })
    },
    [answered, q],
  )

  const submit = useCallback(() => {
    if (answered || selected.size === 0) return
    record(gradeChoice(q, selected))
  }, [q, answered, selected, record])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "Escape") return onExit()
      const n = Number(e.key)

      if (optionsHidden) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          setRevealed(true)
        }
        return
      }

      if (!answered && n >= 1 && n <= q.choices.length) toggle(q.choices[n - 1].id)
      else if (e.key === "Enter") {
        e.preventDefault()
        if (answered) next()
        else submit()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [q, optionsHidden, answered, toggle, submit, next, onExit])

  const segments: SegmentState[] = questions.map((_, i) =>
    outcomes[i] ?? (i === index ? "current" : "pending"),
  )

  const panel = "rounded-xl border bg-card p-4 sm:p-5"

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* HUD */}
      <div className="flex shrink-0 flex-col gap-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon-sm" className="-ml-2" onClick={onExit} aria-label="Exit session">
              <XIcon />
            </Button>
            <span className="truncate text-sm font-semibold">{session.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-sm tabular-nums">
            <span>
              <span className="font-semibold">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-muted-foreground"> / {String(questions.length).padStart(2, "0")}</span>
            </span>
            <span className="h-4 w-px bg-border" />
            <span className="text-muted-foreground">{fmtTime(seconds)}</span>
          </div>
        </div>
        <SegmentedProgress segments={segments} />
      </div>

      {/* Bento body: fills the viewport; on narrow screens it scrolls internally so the action bar stays put */}
      <div
        key={q.id}
        className="grid min-h-0 flex-1 auto-rows-min content-start gap-3 overflow-y-auto motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-1 lg:overflow-hidden"
      >
        {/* Left: question + code */}
        <section className="flex min-h-0 flex-col gap-3">
          <div className={cn(panel, "flex shrink-0 flex-col gap-3")}>
            <div className="flex items-center justify-between">
              <DifficultyPips level={q.difficulty} />
              <span className="label-caps">
                {q.type === "single" ? "Single choice" : "Select all"}
              </span>
            </div>
            <h1 className="text-lg leading-snug font-bold tracking-tight text-pretty sm:text-xl xl:text-2xl">
              <RichText text={q.prompt} />
            </h1>
          </div>
          <QuestionVisual q={q} />
        </section>

        {/* Right: answers + feedback */}
        <section className="flex min-h-0 flex-col gap-3">
          {optionsHidden ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="group flex min-h-40 flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card/50 px-6 py-10 text-center transition-colors outline-none hover:border-primary/60 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <EyeIcon className="size-7 text-muted-foreground transition-colors group-hover:text-primary" />
              <span className="max-w-xs text-base text-muted-foreground">
                Answer in your head first, as you would in the interview. Then reveal the options.
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Kbd>Space</Kbd> to reveal
              </span>
            </button>
          ) : (
            <div
              className="grid min-h-0 flex-1 auto-rows-fr gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 sm:grid-cols-2"
              role={q.type === "multi" ? "group" : "radiogroup"}
            >
              {q.choices.map((c, i) => (
                <ChoiceOption
                  key={c.id}
                  index={i}
                  text={c.text}
                  multi={q.type === "multi"}
                  state={choiceState(q, c.id, selected, answered)}
                  disabled={answered}
                  onSelect={() => toggle(c.id)}
                />
              ))}
            </div>
          )}

          {answered && q.explanation && (
            <div
              className={cn(
                panel,
                "max-h-48 shrink-0 overflow-y-auto border-l-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
                verdict[current].className,
              )}
            >
              <span className="label-caps text-current">{verdict[current].label}</span>
              <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">
                <RichText text={q.explanation} />
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Action bar: always visible */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-t pt-3">
        <KeyHints type={q.type} answered={answered} hidden={optionsHidden} />
        <div className="ml-auto">
          {optionsHidden && (
            <Button size="lg" onClick={() => setRevealed(true)}>
              <EyeIcon /> Reveal options <Kbd className="bg-primary-foreground/15 text-current">Space</Kbd>
            </Button>
          )}
          {!optionsHidden && !answered && (
            <Button size="lg" onClick={submit} disabled={selected.size === 0}>
              Check answer <Kbd className="bg-primary-foreground/15 text-current">↵</Kbd>
            </Button>
          )}
          {answered && (
            <Button size="lg" onClick={next} className="motion-safe:animate-in motion-safe:fade-in">
              {isLast ? "See results" : "Next question"} <ArrowRightIcon />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function KeyHints({
  type,
  answered,
  hidden,
}: {
  type: ChoiceQuestion["type"]
  answered: boolean
  hidden: boolean
}) {
  const hints: [string, string][] = answered
    ? [["↵", "next"]]
    : hidden
      ? [["Space", "reveal"]]
      : [
          ["1–4", type === "multi" ? "toggle" : "select"],
          ["↵", "check"],
        ]
  return (
    <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
      {[...hints, ["Esc", "exit"] as [string, string]].map(([k, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <Kbd>{k}</Kbd> {label}
        </span>
      ))}
    </div>
  )
}

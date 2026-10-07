import { cn } from "@/lib/utils"
import type { Outcome } from "@/data/types"

/** Thin horizontal mastery bar with a percentage readout. */
export function MasteryMeter({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="meter"
        aria-label="Mastery"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out-expo"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs font-medium text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  )
}

export type SegmentState = Outcome | "current" | "pending"

const segmentClass: Record<SegmentState, string> = {
  correct: "bg-success",
  partial: "bg-warning",
  wrong: "bg-destructive",
  current: "bg-primary shadow-[0_0_10px_var(--primary)]",
  pending: "bg-muted",
}

/** One segment per question, coloured by outcome. */
export function SegmentedProgress({ segments, className }: { segments: SegmentState[]; className?: string }) {
  const done = segments.filter((s) => s !== "pending" && s !== "current").length
  return (
    <div
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={segments.length}
      className={cn("flex gap-1", className)}
    >
      {segments.map((s, i) => (
        <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", segmentClass[s])} />
      ))}
    </div>
  )
}

/** Labelled numeric readout. */
export function Stat({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-caps">{label}</span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-base font-medium text-muted-foreground">{unit}</span>}
      </span>
    </div>
  )
}

const difficultyLabel = ["", "Easy", "Medium", "Hard"] as const

/** Three-bar difficulty indicator. */
export function DifficultyPips({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Difficulty: ${difficultyLabel[level]}`}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("w-1 rounded-[1px]", i <= level ? "bg-primary" : "bg-muted")}
            style={{ height: 4 + i * 3 }}
          />
        ))}
      </span>
      <span className="label-caps">{difficultyLabel[level]}</span>
    </span>
  )
}

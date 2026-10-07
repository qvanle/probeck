import { CheckIcon, XIcon } from "lucide-react"
import { RichText } from "@/components/rich-text"
import { cn } from "@/lib/utils"

export type ChoiceState = "idle" | "selected" | "correct" | "wrong" | "missed" | "dimmed"

/** Slot identity: colour + shape, so colour is never the only cue. */
const slots = [
  { bg: "bg-tile-1", edge: "shadow-[0_5px_0_0_color-mix(in_oklch,var(--tile-1)_60%,black)]", shape: "M12 4 22 20H2Z" },
  { bg: "bg-tile-2", edge: "shadow-[0_5px_0_0_color-mix(in_oklch,var(--tile-2)_60%,black)]", shape: "M12 2 22 12 12 22 2 12Z" },
  { bg: "bg-tile-3", edge: "shadow-[0_5px_0_0_color-mix(in_oklch,var(--tile-3)_60%,black)]", shape: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" },
  { bg: "bg-tile-4", edge: "shadow-[0_5px_0_0_color-mix(in_oklch,var(--tile-4)_60%,black)]", shape: "M4 4h16v16H4Z" },
] as const

const stateClass: Record<ChoiceState, string> = {
  idle: "hover:-translate-y-0.5 active:translate-y-1 active:shadow-none",
  selected: "ring-4 ring-white -translate-y-0.5 shadow-none",
  correct: "ring-4 ring-success shadow-none translate-y-1",
  wrong: "opacity-65 saturate-50 shadow-none translate-y-1",
  missed: "ring-4 ring-dashed ring-success shadow-none translate-y-1",
  dimmed: "opacity-60 saturate-50 shadow-none translate-y-1",
}

export function ChoiceOption({
  index,
  text,
  state,
  multi,
  disabled,
  onSelect,
}: {
  index: number
  text: string
  state: ChoiceState
  multi?: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const slot = slots[index % slots.length]
  const badge =
    state === "correct" || state === "missed" ? (
      <CheckIcon className="size-4 text-success" />
    ) : state === "wrong" ? (
      <XIcon className="size-4 text-destructive" />
    ) : state === "selected" && multi ? (
      <CheckIcon className="size-4 text-foreground" />
    ) : null

  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={state === "selected" || state === "correct" || state === "wrong"}
      aria-keyshortcuts={String(index + 1)}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-16 w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[17px] leading-snug font-bold text-white",
        "transition-all duration-150 outline-none focus-visible:ring-4 focus-visible:ring-white/70",
        "disabled:cursor-default",
        slot.bg,
        slot.edge,
        stateClass[state],
      )}
    >
      <svg viewBox="0 0 24 24" className="size-7 shrink-0 fill-white drop-shadow-sm" aria-hidden>
        <path d={slot.shape} />
      </svg>
      <span className="flex-1">
        <RichText text={text} />
      </span>
      {badge && (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white shadow-md">{badge}</span>
      )}
    </button>
  )
}

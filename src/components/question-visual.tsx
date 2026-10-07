import { CodeBlock } from "@/components/code-block"
import { cn } from "@/lib/utils"
import type { ChoiceQuestion } from "@/data/types"

const asset = (src: string) => (/^(https?:)?\/\//.test(src) ? src : `${import.meta.env.BASE_URL}${src}`)

/** Dark illustration panel; fixed dark so diagrams keep their contrast in both themes. */
function Figure({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <figure
      className={cn(
        "code-surface flex min-h-48 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/10 p-3 shadow-lg",
        className,
      )}
    >
      <img src={asset(src)} alt={alt} className="max-h-full max-w-full object-contain" draggable={false} />
    </figure>
  )
}

/** Decorative fallback so the panel is never empty when a question has no illustration yet. */
function Placeholder({ seed }: { seed: string }) {
  const shapes = ["M12 4 22 20H2Z", "M12 2 22 12 12 22 2 12Z", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M4 4h16v16H4Z"]
  const colors = ["bg-tile-1", "bg-tile-2", "bg-tile-3", "bg-tile-4"]
  const offset = [...seed].reduce((n, c) => n + c.charCodeAt(0), 0)
  return (
    <div
      aria-hidden
      className="code-surface relative grid min-h-48 flex-1 place-items-center overflow-hidden rounded-xl border border-white/10"
    >
      <div className="grid grid-cols-2 gap-5 opacity-90">
        {shapes.map((d, i) => (
          <span
            key={i}
            className={cn("grid size-20 place-items-center rounded-2xl sm:size-24", colors[(i + offset) % 4])}
            style={{ transform: `rotate(${((i + offset) % 3) * 6 - 6}deg)` }}
          >
            <svg viewBox="0 0 24 24" className="size-10 fill-white sm:size-12">
              <path d={shapes[(i + offset) % 4] ?? d} />
            </svg>
          </span>
        ))}
      </div>
    </div>
  )
}

export function QuestionVisual({ q }: { q: ChoiceQuestion }) {
  if (!q.image && !q.code) return <Placeholder seed={q.id} />
  return (
    <>
      {q.image && <Figure src={q.image.src} alt={q.image.alt} />}
      {q.code && <CodeBlock code={q.code} className={cn("max-h-72 flex-1 lg:max-h-none", q.image && "lg:max-h-[45%]")} />}
    </>
  )
}

import { useMemo } from "react"
import { highlight } from "sugar-high"
import { cn } from "@/lib/utils"

/**
 * Editor-style code panel. Always dark (like an IDE) so syntax colours keep
 * their contrast in both app themes. Colours come from the --sh-* tokens in index.css.
 */
export function CodeBlock({ code, label = "tsx", className }: { code: string; label?: string; className?: string }) {
  const html = useMemo(() => highlight(code), [code])
  const lines = code.split("\n").length

  return (
    <figure className={cn("code-surface flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 shadow-lg", className)}>
      <figcaption className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
        </span>
        <span className="font-mono text-xs text-white/60">{label}</span>
      </figcaption>
      <div className="flex min-h-0 flex-1 overflow-auto py-3 font-mono text-sm leading-6">
        <div
          aria-hidden
          className="shrink-0 select-none pr-4 pl-4 text-right text-white/35 tabular-nums"
        >
          {Array.from({ length: lines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="pr-6">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </figure>
  )
}

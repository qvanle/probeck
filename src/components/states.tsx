import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function LoadingPanel({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-4">
      <span className="label-caps">{label}</span>
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function ErrorPanel({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-xl border border-destructive/50 bg-card p-6">
      <div className="flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangleIcon className="size-5" /> Couldn't load the data
      </div>
      <p className="max-w-prose text-muted-foreground">{error.message}</p>
      <Button variant="outline" onClick={onRetry}>
        <RotateCcwIcon /> Try again
      </Button>
    </div>
  )
}

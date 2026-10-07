import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="relative grid size-6 place-items-center rounded-[5px] border border-primary/50 bg-primary/10">
        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] transition-transform group-hover:scale-125" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        probe<span className="text-primary">ck</span>
      </span>
    </button>
  )
}

export function AppShell({
  children,
  onHome,
  fit = false,
}: {
  children: React.ReactNode
  onHome: () => void
  /** Lock the layout to the viewport: content must fit, with no page scroll. */
  fit?: boolean
}) {
  const { theme, toggle } = useTheme()

  return (
    <div className={cn("flex flex-col", fit ? "h-svh overflow-hidden" : "min-h-svh")}>
      <header className="sticky top-0 z-20 shrink-0 border-b bg-background/80 backdrop-blur-md">
        <div className={cn("mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6", fit ? "max-w-6xl" : "max-w-5xl")}>
          <Logo onClick={onHome} />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col px-4 sm:px-6",
          fit ? "min-h-0 max-w-6xl py-3 sm:py-4" : "max-w-5xl py-8 sm:py-12",
        )}
      >
        {children}
      </main>
    </div>
  )
}

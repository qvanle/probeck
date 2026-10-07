/**
 * Renders `inline code` spans in plain question text.
 * Stop-gap until question content moves to full Markdown.
 */
export function RichText({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code
        key={i}
        className="rounded-[4px] bg-foreground/10 px-[0.3em] py-[0.05em] font-mono text-[0.88em] font-semibold"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  )
}

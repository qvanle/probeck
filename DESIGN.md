# probeck design system

Direction: **game-show quiz with a tech edge** (Kahoot-family). Saturated purple stage, solid colour-and-shape
answer tiles, chunky press-down buttons, bold sans-serif (Geist), one cyan accent, faint grid, keyboard-first.
All tokens live in `src/index.css`; components consume them through Tailwind utilities.

## Tokens

### Color

| Token | Role | Rule |
|---|---|---|
| `background` / `card` / `popover` | Surfaces | Purple stage, hue 300 (`card` darker than `background`). Never pure black. |
| `tile-1..4` | Answer slot identity: red ▲, blue ◆, amber ●, green ■ | Always paired with the shape. Identity only, never outcome. |
| `foreground` / `muted-foreground` | Primary / secondary text | |
| `primary` | The single accent (cyan, hue 200) | Interactive emphasis only: CTAs, selection, focus ring, progress. |
| `accent` | Tinted hover/selection surface | `primary` at low alpha in dark mode. |
| `success` / `warning` / `destructive` | Correct / partial / wrong | **Reserved for answer feedback.** Don't use for decoration. |
| `border` / `input` | Hairlines | White at 9–13% alpha in dark. |
| `grid` | Background grid lines | 32px cell, set on `body`. |

Light is the default; dark (the purple stage) is toggled via `useTheme` and remembered in localStorage.

### Typography

- **Geist Sans** (variable, self-hosted via `@fontsource-variable/geist`) for all UI text.
- **Geist Mono** only inside code: `<pre>` blocks and `` `inline code` `` via `RichText`.
- Numbers that change or compare (counts, %, timers) use `tabular-nums`.
- `.label-caps`: 11px, medium, uppercase, 0.14em tracking, muted. Use it for metadata labels and section headings.

| Use | Classes |
|---|---|
| Hero | `text-4xl sm:text-5xl font-semibold tracking-tight` |
| Page title | `text-3xl sm:text-4xl font-semibold tracking-tight` |
| Question prompt | `text-xl sm:text-2xl font-medium tracking-tight leading-snug` |
| Body / answer text | `text-[15px] leading-relaxed` |
| Score readout | `text-7xl sm:text-8xl font-semibold tracking-tighter` |

### Shape, depth, motion

- `--radius: 0.5rem`. Cards and options use `rounded-lg`, pills use `rounded-md`.
- Depth comes from borders and surface steps, not drop shadows. The one exception is `.glow-primary` for the active selection.
- Motion: `ease-out-expo` for meters; `tw-animate-css` enter animations (fade + 1–4 small slides), always behind `motion-safe:`.

## Components

| Component | File | Notes |
|---|---|---|
| `AppShell`, `Logo` | `components/app-shell.tsx` | Sticky blurred top bar, theme toggle, `max-w-5xl` content. |
| `MasteryMeter` | `components/meters.tsx` | 4px bar + % readout, `role="meter"`. |
| `SegmentedProgress` | `components/meters.tsx` | One segment per question, coloured by `Outcome`; current segment glows. |
| `Stat` | `components/meters.tsx` | `label-caps` label over a tabular number with optional unit. |
| `DifficultyPips` | `components/meters.tsx` | Three ascending bars + label. |
| `ChoiceOption` | `components/choice-option.tsx` | Solid coloured tile + shape, 2-col grid, 5px bottom edge. `role="radio"` / `"checkbox"`. |
| `RichText` | `components/rich-text.tsx` | Renders backtick inline code. Replace with Markdown later. |

### ChoiceOption states

| State | When | Visual |
|---|---|---|
| `idle` | Before submit | Full-colour tile; lifts on hover, presses down on click |
| `selected` | Before submit, picked | White 4px ring; check badge in multi-select |
| `correct` | After submit, right answer | Success ring + check badge |
| `wrong` | After submit, picked but wrong | Faded + x badge |
| `missed` | After submit, multi-select answer not picked | Dashed success ring + check badge |
| `dimmed` | After submit, irrelevant | 35% opacity, desaturated |

## Patterns

- **Keyboard-first quiz.** `1–n` select/toggle · `Enter` check / next · `Space` reveal flashcard · `1–3` self-grade · `Esc` exit. Hints are shown in the footer with `Kbd`.
- **Flashcard self-grading.** Missed / Partly / Nailed map to `wrong` / `partial` / `correct`. This feeds the same outcome pipeline as choice questions.
- **Feedback block.** Left border colored by verdict, `label-caps` verdict, then the explanation.
- **Index labels.** Zero-padded (`EX · 01`, `03 / 05`) for the instrument-panel feel.

## Do / Don't

| Do | Don't |
|---|---|
| Use `primary` for one thing per view that matters most | Add a second accent hue or gradients |
| Keep green/amber/red for answer outcomes | Use success green for "start" buttons or decoration |
| Use borders and surface steps for hierarchy | Stack soft drop shadows (the only shadow is the solid bottom edge on buttons/tiles) |
| Put `tabular-nums` on any changing number | Let timers or counters shift width |

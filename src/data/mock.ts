import type { Exam, Question } from "./types"

const reactRendering: Question[] = [
  {
    id: "rr-1",
    type: "single",
    difficulty: 2,
    prompt: "What does this component log when the button is clicked once?",
    code: `function Counter() {
  const [n, setN] = useState(0)
  return (
    <button onClick={() => {
      setN(n + 1)
      setN(n + 1)
      console.log(n)
    }}>+</button>
  )
}`,
    choices: [
      { id: "a", text: "0, and n becomes 1", correct: true },
      { id: "b", text: "0, and n becomes 2", correct: false },
      { id: "c", text: "2, and n becomes 2", correct: false },
      { id: "d", text: "1, and n becomes 1", correct: false },
    ],
    explanation:
      "State is a snapshot per render. Both calls read the same n (0), so both schedule setN(1). console.log runs before the re-render, so it prints 0. Use setN(prev => prev + 1) to increment twice.",
  },
  {
    id: "rr-2",
    image: { src: "images/react-list-keys.svg", alt: "A list of three people, each with a text input. The first row, Alice, is deleted." },
    type: "single",
    difficulty: 1,
    prompt: "Why does React need a stable `key` on list items?",
    choices: [
      { id: "a", text: "To make the list render faster on first paint", correct: false },
      { id: "b", text: "To match items between renders so state and DOM are preserved for the right item", correct: true },
      { id: "c", text: "To let the browser index the list for accessibility", correct: false },
      { id: "d", text: "Keys are only required in development mode", correct: false },
    ],
    explanation:
      "During reconciliation React matches children by key. Without stable keys (e.g. using the array index on a reorderable list), state and DOM nodes can attach to the wrong item.",
  },
  {
    id: "rr-3",
    image: { src: "images/react-frame-pipeline.svg", alt: "Browser frame timeline: render, DOM update, paint, idle." },
    type: "single",
    recall: true,
    difficulty: 3,
    prompt: "What is the difference between `useEffect` and `useLayoutEffect`, and when would you reach for the latter?",
    choices: [
      { id: "a", text: "useLayoutEffect runs before paint, so use it to measure layout and re-render without flicker", correct: true },
      { id: "b", text: "useEffect runs before paint, so useLayoutEffect is the safer place to fetch data", correct: false },
      { id: "c", text: "They are identical; useLayoutEffect only exists for class-component compatibility", correct: false },
      { id: "d", text: "useLayoutEffect runs only on the server, useEffect only on the client", correct: false },
    ],
    explanation:
      "useEffect runs after the browser paints; useLayoutEffect runs synchronously after DOM mutations but before paint. Use it when you must measure layout and synchronously re-render (e.g. positioning a tooltip). It blocks paint, so keep it rare.",
  },
  {
    id: "rr-4",
    image: { src: "images/react-render-tree.svg", alt: "A component with a parent above it, a context value to its left and a ref to its right." },
    type: "multi",
    difficulty: 2,
    prompt: "Which of these cause a component to re-render? Select all that apply.",
    choices: [
      { id: "a", text: "Its own state changes", correct: true },
      { id: "b", text: "Its parent re-renders (without memo)", correct: true },
      { id: "c", text: "A ref's .current value changes", correct: false },
      { id: "d", text: "A context it consumes changes value", correct: true },
    ],
    explanation:
      "State changes, parent re-renders and consumed context changes all trigger a render. Mutating ref.current never does — refs are deliberately outside the render cycle.",
  },
  {
    id: "rr-5",
    type: "single",
    difficulty: 3,
    prompt: "In React 19, what does the `use` API allow that hooks normally don't?",
    choices: [
      { id: "a", text: "Calling it inside conditionals and loops", correct: true },
      { id: "b", text: "Calling it from class components", correct: false },
      { id: "c", text: "Calling it outside a component entirely", correct: false },
      { id: "d", text: "Synchronously unwrapping a promise without Suspense", correct: false },
    ],
    explanation:
      "Unlike other hooks, `use` can be called conditionally. It still must run during render inside a component, and reading a pending promise suspends — so a Suspense boundary is required.",
  },
]

const placeholder = (prefix: string, n: number): Question[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    type: "single" as const,
    recall: true,
    difficulty: 2 as const,
    prompt: `Placeholder question ${i + 1}`,
    choices: [
      { id: "a", text: "Placeholder option A", correct: i % 4 === 0 },
      { id: "b", text: "Placeholder option B", correct: i % 4 === 1 },
      { id: "c", text: "Placeholder option C", correct: i % 4 === 2 },
      { id: "d", text: "Placeholder option D", correct: i % 4 === 3 },
    ],
    explanation: "Placeholder explanation.",
  }))

export const exams: Exam[] = [
  {
    id: "frontend",
    title: "Frontend Engineer",
    description: "Rendering, the browser runtime, networking and layout — the core of a senior frontend loop.",
    tags: ["React", "Browser", "CSS"],
    categories: [
      { id: "react-rendering", title: "React rendering", description: "Reconciliation, state snapshots, effects and hooks.", questions: reactRendering, mastery: 0.62 },
      { id: "js-runtime", title: "JavaScript runtime", description: "Event loop, closures, prototypes and memory.", questions: placeholder("js", 18), mastery: 0.81 },
      { id: "browser-net", title: "Browser & networking", description: "HTTP caching, CORS, the critical rendering path.", questions: placeholder("net", 14), mastery: 0.34 },
      { id: "css-layout", title: "CSS & layout", description: "Flexbox, grid, stacking contexts and containment.", questions: placeholder("css", 11), mastery: 0 },
    ],
  },
  {
    id: "systems",
    title: "Backend & Systems",
    description: "Data modelling, consistency, caching and the trade-offs behind distributed systems.",
    tags: ["SQL", "Distributed", "Caching"],
    categories: [
      { id: "databases", title: "Databases", description: "Indexes, isolation levels, query plans.", questions: placeholder("db", 22), mastery: 0.45 },
      { id: "distributed", title: "Distributed systems", description: "Consensus, replication, partitioning.", questions: placeholder("ds", 16), mastery: 0.12 },
      { id: "caching", title: "Caching", description: "Invalidation, stampedes, write strategies.", questions: placeholder("cache", 9), mastery: 0.7 },
    ],
  },
  {
    id: "algorithms",
    title: "Algorithms",
    description: "Complexity, core data structures and the patterns that unlock most interview problems.",
    tags: ["Big-O", "Graphs", "DP"],
    categories: [
      { id: "complexity", title: "Complexity", description: "Time and space analysis, amortisation.", questions: placeholder("cx", 12), mastery: 0.9 },
      { id: "graphs", title: "Graphs", description: "BFS, DFS, shortest paths, topological sort.", questions: placeholder("gr", 15), mastery: 0.28 },
      { id: "dp", title: "Dynamic programming", description: "State definition, memoisation, tabulation.", questions: placeholder("dp", 13), mastery: 0.05 },
    ],
  },
]

export const examQuestionCount = (exam: Exam) =>
  exam.categories.reduce((sum, c) => sum + c.questions.length, 0)

export const examMastery = (exam: Exam) => {
  const total = examQuestionCount(exam)
  return exam.categories.reduce((sum, c) => sum + c.mastery * c.questions.length, 0) / total
}

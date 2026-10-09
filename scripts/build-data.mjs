// Compiles content/<exam>/*.json into SQLite files under public/data/:
//   index.sqlite      table of contents: exams + category summaries (loaded on every visit)
//   <exam-id>.sqlite  one file per exam: categories, questions, choices (loaded on demand)
// Uses Node's built-in node:sqlite, so there is no native dependency.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { DatabaseSync } from "node:sqlite"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CONTENT = join(ROOT, "content")
const PUBLIC = join(ROOT, "public")
const OUT = join(PUBLIC, "data")
const SCHEMA_VERSION = 1
const LETTERS = "abcdefgh"

const fail = (where, msg) => {
  throw new Error(`[content] ${where}: ${msg}`)
}
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"))

function validateQuestion(q, where) {
  for (const key of ["id", "type", "difficulty", "prompt", "choices", "answer", "explanation"])
    if (q[key] === undefined) fail(where, `missing "${key}"`)
  if (!["single", "multi"].includes(q.type)) fail(where, `type must be "single" or "multi"`)
  if (![1, 2, 3].includes(q.difficulty)) fail(where, "difficulty must be 1, 2 or 3")
  if (q.choices.length < 2 || q.choices.length > 4) fail(where, "needs 2–4 choices (the UI has four tiles)")
  if (!q.answer.length || q.answer.some((i) => !Number.isInteger(i) || i < 0 || i >= q.choices.length))
    fail(where, "answer must list valid choice indexes")
  if (q.type === "single" && q.answer.length !== 1) fail(where, "single choice needs exactly one answer")
  if (q.type === "multi" && q.answer.length < 2) fail(where, "multi choice needs at least two answers")
  if (q.image && !/^https?:\/\//.test(q.image.src) && !existsSync(join(PUBLIC, q.image.src)))
    fail(where, `image not found in public/: ${q.image.src}`)
}

function loadExam(dir) {
  const meta = readJson(join(dir, "exam.json"))
  if (!meta.course) fail(meta.id, `exam.json needs a "course" (an id from content/courses.json)`)
  const files = readdirSync(dir).filter((f) => /^\d+-.+\.json$/.test(f)).sort()
  if (!files.length) fail(meta.id, "no category files (NN-name.json)")
  const seen = new Set()
  const categories = files.map((f) => {
    const cat = readJson(join(dir, f))
    cat.questions.forEach((q, i) => {
      const where = `${meta.id}/${f}#${i + 1} (${q.id ?? "?"})`
      validateQuestion(q, where)
      if (seen.has(q.id)) fail(where, "duplicate question id")
      seen.add(q.id)
    })
    return cat
  })
  return { meta, categories }
}

function writeExamDb({ meta, categories }) {
  const file = join(OUT, `${meta.id}.sqlite`)
  const db = new DatabaseSync(file)
  db.exec(`
    PRAGMA journal_mode = DELETE;
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE category (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, sort INTEGER NOT NULL);
    CREATE TABLE question (
      id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES category(id),
      type TEXT NOT NULL, difficulty INTEGER NOT NULL, prompt TEXT NOT NULL, code TEXT,
      image_src TEXT, image_alt TEXT, recall INTEGER NOT NULL DEFAULT 0,
      explanation TEXT NOT NULL, sort INTEGER NOT NULL
    );
    CREATE TABLE choice (
      question_id TEXT NOT NULL REFERENCES question(id), idx INTEGER NOT NULL,
      id TEXT NOT NULL, text TEXT NOT NULL, is_correct INTEGER NOT NULL, PRIMARY KEY (question_id, idx)
    );
    CREATE INDEX question_category ON question(category_id, sort);
  `)
  const meta_ = db.prepare("INSERT INTO meta VALUES (?, ?)")
  meta_.run("schema_version", String(SCHEMA_VERSION))
  meta_.run("exam_id", meta.id)
  meta_.run("version", String(meta.version))

  const insCat = db.prepare("INSERT INTO category VALUES (?, ?, ?, ?)")
  const insQ = db.prepare("INSERT INTO question VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
  const insC = db.prepare("INSERT INTO choice VALUES (?, ?, ?, ?, ?)")
  db.exec("BEGIN")
  let sort = 0
  categories.forEach((cat, ci) => {
    insCat.run(cat.id, cat.title, cat.description, ci)
    cat.questions.forEach((q) => {
      insQ.run(q.id, cat.id, q.type, q.difficulty, q.prompt, q.code ?? null, q.image?.src ?? null, q.image?.alt ?? null,
        q.recall ? 1 : 0, q.explanation, sort++)
      q.choices.forEach((text, i) => insC.run(q.id, i, LETTERS[i], text, q.answer.includes(i) ? 1 : 0))
    })
  })
  db.exec("COMMIT")
  db.exec("VACUUM")
  db.close()
  return file
}

function writeIndexDb(courses, exams) {
  const file = join(OUT, "index.sqlite")
  const db = new DatabaseSync(file)
  db.exec(`
    PRAGMA journal_mode = DELETE;
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE course (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, sort INTEGER NOT NULL
    );
    CREATE TABLE exam (
      id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES course(id), title TEXT NOT NULL, description TEXT NOT NULL, tags TEXT NOT NULL,
      version INTEGER NOT NULL, file TEXT NOT NULL, question_count INTEGER NOT NULL, sort INTEGER NOT NULL
    );
    CREATE TABLE category (
      exam_id TEXT NOT NULL REFERENCES exam(id), id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
      question_count INTEGER NOT NULL, sort INTEGER NOT NULL, PRIMARY KEY (exam_id, id)
    );
  `)
  const meta = db.prepare("INSERT INTO meta VALUES (?, ?)")
  meta.run("schema_version", String(SCHEMA_VERSION))
  meta.run("generated_at", new Date().toISOString())
  const insCourse = db.prepare("INSERT INTO course VALUES (?, ?, ?, ?)")
  const insExam = db.prepare("INSERT INTO exam VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
  const insCat = db.prepare("INSERT INTO category VALUES (?, ?, ?, ?, ?, ?)")
  db.exec("BEGIN")
  courses.forEach((c, i) => insCourse.run(c.id, c.title, c.description ?? "", i))
  exams.forEach(({ meta: m, categories }, ei) => {
    const total = categories.reduce((n, c) => n + c.questions.length, 0)
    insExam.run(m.id, m.course, m.title, m.description, JSON.stringify(m.tags ?? []), m.version, `${m.id}.sqlite`, total, ei)
    categories.forEach((c, ci) => insCat.run(m.id, c.id, c.title, c.description, c.questions.length, ci))
  })
  db.exec("COMMIT")
  db.exec("VACUUM")
  db.close()
  return file
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const exams = readdirSync(CONTENT, { withFileTypes: true })
  // folders starting with "_" (e.g. _template) are ignored
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && existsSync(join(CONTENT, d.name, "exam.json")))
  .map((d) => loadExam(join(CONTENT, d.name)))
  .sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0))

const ids = exams.map((e) => e.meta.id)
if (new Set(ids).size !== ids.length) fail("content/", "duplicate exam id")

// content/courses.json groups exams: [{ id, title, description, order }]
const courses = readJson(join(CONTENT, "courses.json")).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
const courseIds = new Set(courses.map((c) => c.id))
for (const e of exams) if (!courseIds.has(e.meta.course)) fail(e.meta.id, `unknown course "${e.meta.course}"`)

const files = [...exams.map(writeExamDb), writeIndexDb(courses, exams)]
for (const f of files) console.log(`  ${f.replace(ROOT + "/", "").padEnd(40)} ${(statSync(f).size / 1024).toFixed(1)} KB`)
console.log(`built ${exams.length} exam(s), ${exams.reduce((n, e) => n + e.categories.reduce((m, c) => m + c.questions.length, 0), 0)} questions`)

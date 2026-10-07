# probeck

Practice tech interview questions as quizzes. **probe** + **tech**.
No backend: a static site (GitHub Pages) that downloads read-only SQLite files and keeps your progress in the browser.

## How it works

```
content/<exam>/*.json  ──npm run build:data──▶  public/data/index.sqlite        table of contents (loaded first)
                                                public/data/<exam>.sqlite       one per exam (loaded when you open it)
```

- The home and exam screens read only `index.sqlite`. Opening an exam downloads that exam's file.
- Progress (latest result per question, totals, streak) lives in `localStorage`. Clearing browser data erases it.
- `VITE_DATA_URL` (see `.env.example`) serves the `.sqlite` files from object storage instead of the site itself.

## Develop

```bash
npm install
npm run dev        # builds the sqlite files, then starts Vite
npm run build      # builds the sqlite files, then the site into dist/
```

Needs Node 22.13+ (the build script uses the built-in `node:sqlite`).

## Add questions

Copy `content/_template/` to `content/<your-exam>/` (folders starting with `_` are ignored by the build), then edit `NN-category.json` and bump `version` in that exam's `exam.json` (it cache-busts the exam file).
Question shape: `id`, `type` (`single` | `multi`), `difficulty` (1–3), `prompt` (backticks give inline code),
`choices` (2–4 strings), `answer` (indexes of the correct choices), `explanation`, and optionally
`recall` (hide the options until revealed), `code`, `image` (`{ src, alt }` under `public/`).
The build fails with a message if a question is malformed.

## Design

See [DESIGN.md](DESIGN.md).

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages
(custom domain in `public/CNAME`).

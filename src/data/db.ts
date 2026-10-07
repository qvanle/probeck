import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from "sql.js"
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url"

// Where .sqlite files are downloaded from. Defaults to the app's own /data/ folder (GitHub Pages);
// set VITE_DATA_URL to serve them from object storage instead (that bucket must allow CORS).
const DATA_URL = (import.meta.env.VITE_DATA_URL ?? `${import.meta.env.BASE_URL}data/`).replace(/\/?$/, "/")

let sqlJs: Promise<SqlJsStatic> | undefined
const loadEngine = () => (sqlJs ??= initSqlJs({ locateFile: () => wasmUrl }))

const open = new Map<string, Promise<Database>>()

/**
 * Downloads a .sqlite file and opens it in memory. Results are cached per file+version for the page's lifetime;
 * a failed load is evicted so the next call retries.
 *
 * `version` is appended to the URL so a changed exam is never served from a stale browser cache.
 * Pass null for files that must always revalidate (the index).
 */
export function openDatabase(file: string, version: number | null): Promise<Database> {
  const key = `${file}@${version}`
  let db = open.get(key)
  if (!db) {
    db = (async () => {
      const url = `${DATA_URL}${file}${version === null ? "" : `?v=${version}`}`
      const [SQL, res] = await Promise.all([loadEngine(), fetch(url, { cache: version === null ? "no-cache" : "default" })])
      if (!res.ok) throw new Error(`Could not load ${file} (HTTP ${res.status})`)
      return new SQL.Database(new Uint8Array(await res.arrayBuffer()))
    })()
    db.catch(() => open.delete(key))
    open.set(key, db)
  }
  return db
}

/** Runs a SELECT and returns rows as objects keyed by column name. */
export function select<T = Record<string, SqlValue>>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    const rows: T[] = []
    while (stmt.step()) rows.push(stmt.getAsObject() as T)
    return rows
  } finally {
    stmt.free()
  }
}

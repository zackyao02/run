import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Pool } from "pg";
import type { PublishedRunBundle } from "@/src/data/catalog";
import publishedOfficialRuns from "@/src/data/published-official-runs.json";
import type { CompilationDraft } from "@/src/domain/operator-store";
import type { SessionSnapshot } from "@/src/domain/types";

type MemoryStore = {
  published: PublishedRunBundle[];
  drafts: Map<string, CompilationDraft>;
  sessions: Map<string, SessionSnapshot>;
  usage: Map<string, { started: number; completed: number }>;
  favorites: Map<string, number>;
  rateEvents: Map<string, number[]>;
};

type PersistenceGlobal = typeof globalThis & { __zhihuRunPersistencePool?: Pool; __zhihuRunMemoryStore?: MemoryStore };
const persistenceGlobal = globalThis as PersistenceGlobal;
const localUsageFile = join(process.cwd(), ".local-data", "run-usage.json");
const localFavoritesFile = join(process.cwd(), ".local-data", "run-favorites.json");
const localPublishedFile = join(process.cwd(), ".local-data", "published-runs.json");
type Usage = { started: number; completed: number };
const publishedOfficialSeed = publishedOfficialRuns as PublishedRunBundle[];

async function readLocalFavorites(): Promise<Record<string, number>> {
  try {
    const parsed: unknown = JSON.parse(await readFile(localFavoritesFile, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>)
      .map(([runId, value]) => [runId, Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0]));
  } catch { return {}; }
}

async function saveLocalFavorites(favorites: Record<string, number>): Promise<void> {
  await mkdir(dirname(localFavoritesFile), { recursive: true });
  await writeFile(localFavoritesFile, JSON.stringify(favorites, null, 2), "utf8");
}

/**
 * Local development has no database in the starter configuration. Keep only
 * aggregate counters on disk so a dev-server restart does not turn real demo
 * usage back to zero. Session facts remain in browser/session storage and are
 * deliberately never written to this file.
 */
async function readLocalUsage(): Promise<Record<string, Usage>> {
  try {
    const parsed: unknown = JSON.parse(await readFile(localUsageFile, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>)
      .filter(([, value]) => Boolean(value) && typeof value === "object")
      .map(([runId, value]) => {
        const item = value as Partial<Usage>;
        return [runId, {
          started: Number.isInteger(item.started) && item.started! >= 0 ? item.started! : 0,
          completed: Number.isInteger(item.completed) && item.completed! >= 0 ? item.completed! : 0,
        }];
      }));
  } catch { return {}; }
}

async function saveLocalUsage(usage: Record<string, Usage>): Promise<void> {
  await mkdir(dirname(localUsageFile), { recursive: true });
  await writeFile(localUsageFile, JSON.stringify(usage, null, 2), "utf8");
}

/** Published editorial bundles are safe local cache data, unlike user facts. */
async function readLocalPublished(): Promise<PublishedRunBundle[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(localPublishedFile, "utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PublishedRunBundle => Boolean(item) && typeof item === "object"
      && "run" in item && "source" in item && "role" in item
      && Boolean((item as PublishedRunBundle).run?.sourceRef?.sourceId));
  } catch { return []; }
}

async function saveLocalPublished(bundles: PublishedRunBundle[]): Promise<void> {
  await mkdir(dirname(localPublishedFile), { recursive: true });
  await writeFile(localPublishedFile, JSON.stringify(bundles, null, 2), "utf8");
}

function memory(): MemoryStore {
  const current = persistenceGlobal.__zhihuRunMemoryStore;
  if (current) return current;
  const created: MemoryStore = { published: [], drafts: new Map(), sessions: new Map(), usage: new Map(), favorites: new Map(), rateEvents: new Map() };
  persistenceGlobal.__zhihuRunMemoryStore = created;
  return created;
}

function pool(): Pool | undefined {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return undefined;
  if (!persistenceGlobal.__zhihuRunPersistencePool) {
    persistenceGlobal.__zhihuRunPersistencePool = new Pool({ connectionString, ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false } });
  }
  return persistenceGlobal.__zhihuRunPersistencePool;
}

export function persistenceMode(): "postgres" | "memory" { return pool() ? "postgres" : "memory"; }

export async function listPublishedDocuments(): Promise<PublishedRunBundle[]> {
  const client = pool();
  if (!client) {
    const persisted = await readLocalPublished();
    // A Worker cannot read the local development cache. Keep the reviewed,
    // officially published catalogue in the release bundle so public visitors
    // never lose access to the real knowledge cards between deployments.
    const fallback = persisted.length ? persisted : publishedOfficialSeed;
    if (fallback.length && !memory().published.length) memory().published = fallback;
    return [...memory().published];
  }
  const result = await client.query<{ role: PublishedRunBundle["role"]; run_json: PublishedRunBundle["run"]; source_json: PublishedRunBundle["source"] }>("SELECT role, run_json, source_json FROM app_run_documents WHERE state = 'published' ORDER BY updated_at DESC");
  return result.rows.map((row) => ({ role: row.role, run: row.run_json, source: row.source_json }));
}

export async function getPublishedDocument(runId: string): Promise<PublishedRunBundle | undefined> {
  const client = pool();
  if (!client) return (await listPublishedDocuments()).find((bundle) => bundle.run.sourceRef.sourceId === runId);
  const result = await client.query<{ role: PublishedRunBundle["role"]; run_json: PublishedRunBundle["run"]; source_json: PublishedRunBundle["source"] }>("SELECT role, run_json, source_json FROM app_run_documents WHERE source_id = $1 AND state = 'published'", [runId]);
  const row = result.rows[0];
  return row ? { role: row.role, run: row.run_json, source: row.source_json } : undefined;
}

export async function savePublishedDocument(bundle: PublishedRunBundle): Promise<void> {
  const client = pool();
  if (!client) {
    const entries = await listPublishedDocuments();
    const index = entries.findIndex((item) => item.run.sourceRef.sourceId === bundle.run.sourceRef.sourceId);
    if (index >= 0) entries.splice(index, 1, bundle); else entries.push(bundle);
    memory().published = entries;
    await saveLocalPublished(entries);
    return;
  }
  await client.query(`INSERT INTO app_run_documents (source_id, role, run_json, source_json, state)
    VALUES ($1, $2, $3::jsonb, $4::jsonb, 'published')
    ON CONFLICT (source_id) DO UPDATE SET role = EXCLUDED.role, run_json = EXCLUDED.run_json, source_json = EXCLUDED.source_json, state = 'published', updated_at = now()`,
  [bundle.run.sourceRef.sourceId, bundle.role, JSON.stringify(bundle.run), JSON.stringify(bundle.source)]);
}

export async function saveDraftDocument(draft: CompilationDraft): Promise<void> {
  const client = pool();
  if (!client) { memory().drafts.set(draft.id, draft); return; }
  await client.query(`INSERT INTO app_draft_documents (id, payload, state, approved_role)
    VALUES ($1, $2::jsonb, $3, $4)
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, state = EXCLUDED.state, approved_role = EXCLUDED.approved_role, updated_at = now()`,
  [draft.id, JSON.stringify(draft), draft.state ?? "draft", draft.approvedRole ?? null]);
}

export async function getDraftDocument(id: string): Promise<CompilationDraft | undefined> {
  const client = pool();
  if (!client) return memory().drafts.get(id);
  const result = await client.query<{ payload: CompilationDraft; state: CompilationDraft["state"]; approved_role: CompilationDraft["approvedRole"] }>("SELECT payload, state, approved_role FROM app_draft_documents WHERE id = $1", [id]);
  const row = result.rows[0];
  return row ? { ...row.payload, state: row.state, approvedRole: row.approved_role ?? undefined } : undefined;
}

export async function listDraftDocuments(): Promise<CompilationDraft[]> {
  const client = pool();
  if (!client) return [...memory().drafts.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const result = await client.query<{ payload: CompilationDraft; state: CompilationDraft["state"]; approved_role: CompilationDraft["approvedRole"] }>("SELECT payload, state, approved_role FROM app_draft_documents ORDER BY updated_at DESC");
  return result.rows.map((row) => ({ ...row.payload, state: row.state, approvedRole: row.approved_role ?? undefined }));
}

/** Cache regeneration replaces only deterministic official-pool drafts, never human-created drafts. */
export async function clearOfficialCachedDraftDocuments(): Promise<void> {
  const client = pool();
  if (!client) {
    for (const id of memory().drafts.keys()) if (id.startsWith("official-cache")) memory().drafts.delete(id);
    return;
  }
  await client.query("DELETE FROM app_draft_documents WHERE id LIKE 'official-cache%'");
}

export async function saveSessionDocument(session: SessionSnapshot): Promise<void> {
  const client = pool();
  if (!client) { memory().sessions.set(session.id, session); return; }
  await client.query(`INSERT INTO app_session_documents (id, run_id, snapshot) VALUES ($1, $2, $3::jsonb)
    ON CONFLICT (id) DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = now()`, [session.id, session.runId, JSON.stringify(session)]);
}

export async function getSessionDocument(id: string): Promise<SessionSnapshot | undefined> {
  const client = pool();
  if (!client) return memory().sessions.get(id);
  const result = await client.query<{ snapshot: SessionSnapshot }>("SELECT snapshot FROM app_session_documents WHERE id = $1", [id]);
  return result.rows[0]?.snapshot;
}

/** Lists only the current account's opaque session snapshots. */
export async function listSessionDocumentsForAccount(accountKey: string, limit = 24): Promise<SessionSnapshot[]> {
  const client = pool();
  const cappedLimit = Math.max(1, Math.min(limit, 50));
  if (!client) return [...memory().sessions.values()]
    .filter((session) => session.accountKey === accountKey)
    .sort((a, b) => (b.result?.completedAt ?? "").localeCompare(a.result?.completedAt ?? ""))
    .slice(0, cappedLimit);
  const result = await client.query<{ snapshot: SessionSnapshot }>(
    "SELECT snapshot FROM app_session_documents WHERE snapshot ->> 'accountKey' = $1 ORDER BY updated_at DESC LIMIT $2",
    [accountKey, cappedLimit],
  );
  return result.rows.map((row) => row.snapshot);
}

export async function getUsageDocument(runId: string): Promise<Usage> {
  const client = pool();
  if (!client) {
    const persisted = await readLocalUsage();
    const current = persisted[runId] ?? memory().usage.get(runId) ?? { started: 0, completed: 0 };
    memory().usage.set(runId, current);
    return current;
  }
  const result = await client.query<{ started: number; completed: number }>("SELECT started, completed FROM app_run_usage WHERE run_id = $1", [runId]);
  return result.rows[0] ?? { started: 0, completed: 0 };
}

export async function incrementUsageDocument(runId: string, field: "started" | "completed"): Promise<void> {
  const client = pool();
  if (!client) {
    const persisted = await readLocalUsage();
    const current = persisted[runId] ?? memory().usage.get(runId) ?? { started: 0, completed: 0 };
    const next = { ...current, [field]: current[field] + 1 };
    persisted[runId] = next;
    memory().usage.set(runId, next);
    await saveLocalUsage(persisted);
    return;
  }
  await client.query(`INSERT INTO app_run_usage (run_id, ${field}) VALUES ($1, 1)
    ON CONFLICT (run_id) DO UPDATE SET ${field} = app_run_usage.${field} + 1, updated_at = now()`, [runId]);
}

export async function getFavoriteDocument(runId: string): Promise<number> {
  const client = pool();
  if (!client) {
    const persisted = await readLocalFavorites();
    const current = persisted[runId] ?? memory().favorites.get(runId) ?? 0;
    memory().favorites.set(runId, current);
    return current;
  }
  const result = await client.query<{ favorites: number }>("SELECT favorites FROM app_run_usage WHERE run_id = $1", [runId]);
  return result.rows[0]?.favorites ?? 0;
}

export async function incrementFavoriteDocument(runId: string): Promise<number> {
  const client = pool();
  if (!client) {
    const persisted = await readLocalFavorites();
    const next = (persisted[runId] ?? memory().favorites.get(runId) ?? 0) + 1;
    persisted[runId] = next;
    memory().favorites.set(runId, next);
    await saveLocalFavorites(persisted);
    return next;
  }
  const result = await client.query<{ favorites: number }>(`INSERT INTO app_run_usage (run_id, favorites) VALUES ($1, 1)
    ON CONFLICT (run_id) DO UPDATE SET favorites = app_run_usage.favorites + 1, updated_at = now()
    RETURNING favorites`, [runId]);
  return result.rows[0]?.favorites ?? 1;
}

/** Shared, low-volume limits protect model credits across production instances. */
export async function reserveRateSlot(scope: string, maximum: number, windowMs: number): Promise<boolean> {
  const client = pool();
  const cutoff = new Date(Date.now() - windowMs);
  if (!client) {
    const events = memory().rateEvents.get(scope) ?? [];
    const fresh = events.filter((time) => time >= cutoff.getTime());
    if (fresh.length >= maximum) { memory().rateEvents.set(scope, fresh); return false; }
    fresh.push(Date.now()); memory().rateEvents.set(scope, fresh); return true;
  }
  const connection = await client.connect();
  try {
    await connection.query("BEGIN");
    await connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [scope]);
    await connection.query("DELETE FROM app_rate_events WHERE scope = $1 AND occurred_at < $2", [scope, cutoff]);
    const count = await connection.query<{ count: string }>("SELECT count(*)::text AS count FROM app_rate_events WHERE scope = $1", [scope]);
    if (Number(count.rows[0]?.count ?? 0) >= maximum) { await connection.query("ROLLBACK"); return false; }
    await connection.query("INSERT INTO app_rate_events (scope) VALUES ($1)", [scope]);
    await connection.query("COMMIT");
    return true;
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally { connection.release(); }
}

import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let schemaReady: Promise<unknown> | null = null;

export async function getDb() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }
  if (!schemaReady) {
    schemaReady = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
        code TEXT PRIMARY KEY NOT NULL,
        host_token TEXT NOT NULL,
        phase TEXT DEFAULT 'welcome' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        session_code TEXT NOT NULL,
        voter_id TEXT NOT NULL,
        group_code TEXT NOT NULL,
        round INTEGER NOT NULL,
        choice TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS votes_one_per_round ON votes (session_code, voter_id, round)"),
    ]).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;

  return drizzle(env.DB, { schema });
}

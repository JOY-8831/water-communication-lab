import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { sessions, votes } from "../../../db/schema";
import { PHASES, type Phase } from "../../../lib/experiment";

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export async function POST() {
  try {
    const db = await getDb();
    const code = makeCode();
    const hostToken = crypto.randomUUID();
    await db.insert(sessions).values({ code, hostToken, phase: "welcome" });
    return Response.json({ code, hostToken, phase: "welcome" }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法建立場次" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") || "").toUpperCase();
  if (!code) return Response.json({ error: "缺少場次碼" }, { status: 400 });
  const db = await getDb();
  const [session] = await db.select({ code: sessions.code, phase: sessions.phase }).from(sessions).where(eq(sessions.code, code)).limit(1);
  if (!session) return Response.json({ error: "找不到場次" }, { status: 404 });
  return Response.json(session);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { code?: string; hostToken?: string; phase?: Phase; reset?: boolean };
  const code = body.code?.toUpperCase() || "";
  if (!code || !body.hostToken) return Response.json({ error: "缺少主持權限" }, { status: 400 });
  const db = await getDb();
  const [session] = await db.select().from(sessions).where(and(eq(sessions.code, code), eq(sessions.hostToken, body.hostToken))).limit(1);
  if (!session) return Response.json({ error: "主持權限不正確" }, { status: 403 });
  if (body.reset) {
    await db.delete(votes).where(eq(votes.sessionCode, code));
    await db.update(sessions).set({ phase: "welcome" }).where(eq(sessions.code, code));
    return Response.json({ code, phase: "welcome" });
  }
  if (!body.phase || !PHASES.includes(body.phase)) return Response.json({ error: "階段不正確" }, { status: 400 });
  await db.update(sessions).set({ phase: body.phase }).where(eq(sessions.code, code));
  return Response.json({ code, phase: body.phase });
}

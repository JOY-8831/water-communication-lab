import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { sessions, votes } from "../../../db/schema";
import { CHOICES, GROUPS } from "../../../lib/experiment";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionCode?: string;
    voterId?: string;
    groupCode?: string;
    round?: number;
    choice?: string;
    confidence?: number;
  };
  const sessionCode = body.sessionCode?.toUpperCase() || "";
  const validGroup = Boolean(body.groupCode && body.groupCode in GROUPS);
  const validChoice = CHOICES.some((item) => item.id === body.choice);
  if (!sessionCode || !body.voterId || !validGroup || !validChoice || ![1, 2].includes(body.round || 0) || !body.confidence || body.confidence < 1 || body.confidence > 5) {
    return Response.json({ error: "作答資料不完整" }, { status: 400 });
  }
  const db = await getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.code, sessionCode)).limit(1);
  if (!session) return Response.json({ error: "找不到場次" }, { status: 404 });
  await db.insert(votes).values({
    sessionCode,
    voterId: body.voterId,
    groupCode: body.groupCode!,
    round: body.round!,
    choice: body.choice!,
    confidence: body.confidence,
  }).onConflictDoUpdate({
    target: [votes.sessionCode, votes.voterId, votes.round],
    set: { choice: body.choice!, confidence: body.confidence, groupCode: body.groupCode! },
  });
  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionCode = (url.searchParams.get("session") || "").toUpperCase();
  const hostToken = url.searchParams.get("token") || "";
  const db = await getDb();
  const [session] = await db.select().from(sessions).where(and(eq(sessions.code, sessionCode), eq(sessions.hostToken, hostToken))).limit(1);
  if (!session) return Response.json({ error: "主持權限不正確" }, { status: 403 });
  const rows = await db.select().from(votes).where(eq(votes.sessionCode, sessionCode));
  return Response.json({ votes: rows });
}

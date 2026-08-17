import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  code: text("code").primaryKey(),
  hostToken: text("host_token").notNull(),
  phase: text("phase").notNull().default("welcome"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const votes = sqliteTable(
  "votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionCode: text("session_code").notNull(),
    voterId: text("voter_id").notNull(),
    groupCode: text("group_code").notNull(),
    round: integer("round").notNull(),
    choice: text("choice").notNull(),
    confidence: integer("confidence").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("votes_one_per_round").on(
      table.sessionCode,
      table.voterId,
      table.round,
    ),
  ],
);

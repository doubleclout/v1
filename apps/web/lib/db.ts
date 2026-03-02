import { createDb } from "@doubleclout/db";

const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

import { createDb, type Db } from "@doubleclout/db";

const globalForDb = globalThis as unknown as { db: Db | undefined };

function getDb(): Db {
  if (!globalForDb.db) globalForDb.db = createDb();
  return globalForDb.db;
}

export const db = new Proxy({} as Db, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

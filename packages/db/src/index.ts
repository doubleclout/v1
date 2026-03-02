import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return drizzle(postgres(connectionString), { schema });
}

export type Db = ReturnType<typeof createDb>;
export * from "./schema";
export { eq, and, or, desc, asc, sql, lt, gt, gte, lte } from "drizzle-orm";

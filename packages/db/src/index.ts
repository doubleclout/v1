import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

export function createDb() {
  return drizzle(postgres(connectionString), { schema });
}

export type Db = ReturnType<typeof createDb>;
export * from "./schema";

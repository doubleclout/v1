import { db } from "@/lib/db";
import { auditLog } from "@doubleclout/db";

export async function logAudit(
  orgId: string,
  action: string,
  options?: { userId?: string; metadata?: Record<string, unknown>; source?: string }
) {
  await db.insert(auditLog).values({
    orgId,
    action,
    userId: options?.userId,
    metadata: options?.metadata ?? {},
    source: options?.source,
  });
}

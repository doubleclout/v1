import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { auditLog } from "@doubleclout/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.authUserId, authUser.id),
  });
  if (!dbUser) return null;

  const logs = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.orgId, dbUser.orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track key actions for trust and compliance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Action, User, Timestamp, Source</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No audit logs yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Source</th>
                  <th className="text-left py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-3 px-4">{log.action}</td>
                    <td className="py-3 px-4">{log.source ?? "—"}</td>
                    <td className="py-3 px-4">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

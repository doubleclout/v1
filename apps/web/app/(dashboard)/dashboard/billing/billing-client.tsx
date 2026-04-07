"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLAN_LIMITS = { free: 10, pro: 100, team: 500, enterprise: 5000 } as const;
type Plan = keyof typeof PLAN_LIMITS;

export function BillingClient({
  plan,
  used,
}: {
  plan: Plan;
  used: number;
}) {
  const router = useRouter();
  const [updatingPlan, setUpdatingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limit = PLAN_LIMITS[plan];

  async function changePlan(nextPlan: Plan) {
    if (nextPlan === plan) return;
    setUpdatingPlan(nextPlan);
    setError(null);
    try {
      const response = await fetch("/api/billing/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: nextPlan }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? `Failed (${response.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change plan");
    } finally {
      setUpdatingPlan(null);
    }
  }

  return (
    <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
      <CardHeader>
        <CardTitle>Current Plan</CardTitle>
        <CardDescription>{plan.charAt(0).toUpperCase() + plan.slice(1)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Insights this month</span>
            <span>
              {used} / {limit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["free", "pro", "team"] as Plan[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === plan ? "default" : "outline"}
              disabled={updatingPlan !== null}
              onClick={() => void changePlan(p)}
            >
              {updatingPlan === p ? "Updating..." : p === plan ? `Current: ${p}` : `Switch to ${p}`}
            </Button>
          ))}
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

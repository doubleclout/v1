"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type InsightRow = {
  id: string;
  summary: string;
  confidence: number;
  sensitivity: string;
  status: string;
  sourceAttribution?: string | null;
  createdAt: Date;
};

export function InsightsClient({ insights }: { insights: InsightRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = insights.find((i) => i.id === selectedId);

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <h3 className="text-lg font-medium">No insights yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Insights are generated automatically from connected sources.
          </p>
          <Button className="mt-4" asChild>
            <a href="/dashboard/sources">Connect Source</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Source</th>
              <th className="text-left py-3 px-4">Confidence</th>
              <th className="text-left py-3 px-4">Sensitivity</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {insights.map((i) => (
              <tr
                key={i.id}
                className="border-b border-border hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedId(i.id)}
              >
                <td className="py-3 px-4">
                  {new Date(i.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">{i.sourceAttribution?.split("·")[0]?.trim() ?? "—"}</td>
                <td className="py-3 px-4">{i.confidence.toFixed(2)}</td>
                <td className="py-3 px-4">{i.sensitivity}</td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted">
                    {i.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <Card className="w-96 shrink-0">
          <CardContent className="p-6">
            <h3 className="font-medium">Insight Details</h3>
            <p className="text-sm text-muted-foreground mt-2">{selected.summary}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p>Confidence: {selected.confidence}</p>
              <p>Sensitivity: {selected.sensitivity}</p>
              <p>Status: {selected.status}</p>
            </div>
            <Button className="mt-4 w-full">Generate Draft</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

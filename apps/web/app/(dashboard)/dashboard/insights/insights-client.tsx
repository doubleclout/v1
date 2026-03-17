"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkedInPreview } from "@/components/dashboard/linkedin-preview";

type ContentFormat = "short" | "medium" | "long";

type InsightRow = {
  id: string;
  summary: string;
  confidence: number;
  sensitivity: string;
  status: string;
  sourceAttribution?: string | null;
  createdAt: Date;
};

export function InsightsClient({
  insights,
  user,
}: {
  insights: InsightRow[];
  user: { firstName?: string | null; lastName?: string | null; avatarUrl?: string | null };
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat] = useState<ContentFormat>("medium");
  const selected = insights.find((i) => i.id === selectedId);

  const authorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Your Name";
  const authorTitle = "Your Title · Company";

  // Use insight summary as placeholder content until draft is generated
  const previewContent = selected?.summary ?? "";

  if (insights.length === 0) {
    return (
      <Card className="border-zinc-200/80 bg-white shadow-sm">
        <CardContent className="py-16 text-center">
          <h3 className="text-lg font-medium text-zinc-900">No insights yet</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Insights are generated automatically from connected sources.
          </p>
          <Button className="mt-6 bg-[var(--accent)] hover:opacity-90" asChild>
            <a href="/dashboard/sources">Connect source</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Insights list */}
      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="text-left py-4 px-5 font-medium text-zinc-700">Date</th>
                <th className="text-left py-4 px-5 font-medium text-zinc-700">Source</th>
                <th className="text-left py-4 px-5 font-medium text-zinc-700">Confidence</th>
                <th className="text-left py-4 px-5 font-medium text-zinc-700">Sensitivity</th>
                <th className="text-left py-4 px-5 font-medium text-zinc-700">Status</th>
                <th className="text-left py-4 px-5 font-medium text-zinc-700 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {insights.map((i) => (
                <tr
                  key={i.id}
                  className={`border-b border-zinc-100 hover:bg-zinc-50/80 cursor-pointer transition-colors ${
                    selectedId === i.id ? "bg-[var(--accent)]/5" : ""
                  }`}
                  onClick={() => setSelectedId(i.id)}
                >
                  <td className="py-4 px-5 text-zinc-600">
                    {new Date(i.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-5 text-zinc-700">
                    {i.sourceAttribution?.split("·")[0]?.trim() ?? "—"}
                  </td>
                  <td className="py-4 px-5 text-zinc-600">{(i.confidence * 100).toFixed(0)}%</td>
                  <td className="py-4 px-5">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        i.sensitivity === "low"
                          ? "bg-emerald-50 text-emerald-700"
                          : i.sensitivity === "moderate"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {i.sensitivity}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                      {i.status}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <Button size="sm" variant="ghost" className="text-[var(--accent)]">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel with LinkedIn preview */}
      {selected && (
        <div className="lg:w-[420px] shrink-0 space-y-6">
          <Card className="border-zinc-200/80 bg-white shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-zinc-900">Insight details</h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{selected.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-zinc-500">
                  Confidence: <strong className="text-zinc-700">{(selected.confidence * 100).toFixed(0)}%</strong>
                </span>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-500">
                  Sensitivity: <strong className="text-zinc-700">{selected.sensitivity}</strong>
                </span>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-500">{selected.sourceAttribution ?? "From your work"}</span>
              </div>
              <Button className="w-full bg-[var(--accent)] hover:opacity-90">
                Generate draft
              </Button>
            </CardContent>
          </Card>

          {/* LinkedIn-style preview */}
          <div>
            <h3 className="text-sm font-medium text-zinc-700 mb-3">How it would look on LinkedIn</h3>
            <LinkedInPreview
              content={previewContent}
              format={format}
              onFormatChange={setFormat}
              authorName={authorName}
              authorTitle={authorTitle}
              authorAvatarUrl={user.avatarUrl}
              characterCount={previewContent.length}
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type InsightRow = {
  id: string;
  summary: string;
  confidence: number;
  sensitivity: string;
  status: string;
  sourceAttribution?: string | null;
  createdAt: Date | string;
  ideaScore?: number;
  ideaReasons?: string[];
};

type InsightsStats = {
  connectedSources: number;
  ingestedEvents: number;
  recentEvents: Array<{ id: string; source: string; type: string; createdAt: Date | string }>;
};

type InsightStatus = "pending" | "internal" | "draft_generated" | "published" | "ignored";

function cleanSummary(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/(\b(date|reporting lead|today focused)\b)\s*:/gi, (_, key) => `${key}: `)
    .trim();
}

function getInsightTitle(text: string) {
  const cleaned = cleanSummary(text);
  const lower = cleaned.toLowerCase();
  const markers = [" date:", " reporting lead:", " today focused:"];
  let end = cleaned.length;
  for (const marker of markers) {
    const idx = lower.indexOf(marker);
    if (idx > 0) end = Math.min(end, idx);
  }
  return cleaned.slice(0, end).trim() || "Insight";
}

function getSourceLabel(sourceAttribution?: string | null) {
  const text = (sourceAttribution ?? "").toLowerCase();
  if (text.includes("google drive") || text.includes("google doc")) return "Google Docs";
  if (text.includes("gmail")) return "Gmail";
  if (text.includes("slack")) return "Slack";
  if (text.includes("zoom")) return "Zoom";
  if (text.includes("github")) return "GitHub";
  return "Connected source";
}

function getStageLabel(status: string) {
  if (status === "internal") return "Selected";
  if (status === "draft_generated") return "Drafted";
  if (status === "published") return "Published";
  if (status === "ignored") return "Archived";
  return "Idea";
}

function formatStableDate(date: Date | string) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export function InsightsClient({
  insights,
  stats,
}: {
  insights: InsightRow[];
  user: { firstName?: string | null; lastName?: string | null; avatarUrl?: string | null };
  stats: InsightsStats;
}) {
  const [currentInsights, setCurrentInsights] = useState(insights);
  const [currentStats, setCurrentStats] = useState(stats);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [stageUpdatingId, setStageUpdatingId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<"all" | InsightStatus>("all");
  const [activeSource, setActiveSource] = useState<string>("all");

  const hasConnectedSources = currentStats.connectedSources > 0;
  const hasIngestedEvents = currentStats.ingestedEvents > 0;
  const isProcessingInsights = currentInsights.length === 0 && hasConnectedSources && hasIngestedEvents;
  const sourceFilters = Array.from(new Set(currentInsights.map((i) => getSourceLabel(i.sourceAttribution))));
  const filteredInsights = currentInsights.filter((i) => {
    const stageOk = activeStage === "all" || i.status === activeStage;
    const sourceOk = activeSource === "all" || getSourceLabel(i.sourceAttribution) === activeSource;
    return stageOk && sourceOk;
  });

  useEffect(() => {
    setCurrentInsights(insights);
    setCurrentStats(stats);
  }, [insights, stats]);

  const refreshInsightsSection = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const response = await fetch("/api/insights/status", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? `Refresh failed (${response.status})`);
      setCurrentInsights(payload.insights ?? []);
      setCurrentStats(
        payload.stats ?? { connectedSources: 0, ingestedEvents: 0, recentEvents: [] },
      );
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Failed to refresh insights");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isProcessingInsights) return;
    const intervalId = window.setInterval(() => {
      void refreshInsightsSection();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [isProcessingInsights, refreshInsightsSection]);

  async function updateInsightStage(insightId: string, status: InsightStatus) {
    setStageUpdatingId(insightId);
    setRefreshError(null);
    try {
      const response = await fetch("/api/insights/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId, status }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? `Stage update failed (${response.status})`);
      setCurrentInsights((prev) => prev.map((i) => (i.id === insightId ? { ...i, status } : i)));
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Failed to update stage");
    } finally {
      setStageUpdatingId(null);
    }
  }

  if (currentInsights.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Ideas</h1>
        </div>
        <Card className="border-zinc-200/80 bg-white shadow-sm">
          <CardContent className="py-16 text-center">
            <h3 className="text-lg font-medium text-zinc-900">
              {hasConnectedSources ? "No ideas yet" : "Connect a source to start"}
            </h3>
            {!hasConnectedSources ? (
              <>
                <p className="mt-2 text-sm text-zinc-600">
                  Connect Google Workspace (and optionally Gmail) to start extracting ideas from real work.
                </p>
                <Button className="mt-6 bg-[var(--accent)] hover:opacity-90" asChild>
                  <a href="/dashboard/sources">Connect source</a>
                </Button>
              </>
            ) : !hasIngestedEvents ? (
              <>
                <p className="mt-2 text-sm text-zinc-600">
                  Sources are connected, but no events are ingested yet. Run a source sync to pull data.
                </p>
                <Button className="mt-6 bg-[var(--accent)] hover:opacity-90" asChild>
                  <a href="/dashboard/sources">Go to sources</a>
                </Button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Processing events - auto-refresh every 15s
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  We ingested {currentStats.ingestedEvents} events and are extracting ideas. Refresh in a moment.
                </p>
                {refreshError ? <p className="mt-3 text-xs text-red-600">{refreshError}</p> : null}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button
                    className="bg-[var(--accent)] hover:opacity-90"
                    onClick={() => void refreshInsightsSection()}
                    disabled={refreshing}
                  >
                    {refreshing ? "Refreshing..." : "Refresh ideas"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ideas</h1>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600">Pick an idea and open Draft Lab.</p>
        {refreshError ? <span className="text-xs text-red-600">{refreshError}</span> : null}
      </div>

      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-sm p-4 space-y-3">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Stage</div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Ideas" },
            { id: "internal", label: "Selected" },
            { id: "draft_generated", label: "Drafted" },
            { id: "published", label: "Published" },
            { id: "ignored", label: "Archived" },
          ].map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(stage.id as "all" | InsightStatus)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                activeStage === stage.id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {stage.label}
            </button>
          ))}
        </div>
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 pt-1">Source</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSource("all")}
            className={`rounded-full px-3 py-1 text-xs border transition-colors ${
              activeSource === "all"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            All sources
          </button>
          {sourceFilters.map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => setActiveSource(source)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                activeSource === source
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredInsights.map((i) => (
          <div key={i.id} className="rounded-xl border border-zinc-200/80 bg-white shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-zinc-500">{formatStableDate(i.createdAt)}</div>
                <h3 className="mt-1 text-base font-semibold text-zinc-900 truncate">{getInsightTitle(i.summary)}</h3>
                <p className="mt-1 text-sm text-zinc-600 truncate">From {getSourceLabel(i.sourceAttribution)}</p>
                    {i.ideaReasons && i.ideaReasons.length > 0 ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Why this idea: {i.ideaReasons.join(" · ")}
                      </p>
                    ) : null}
                <div className="mt-2">
                  <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {getStageLabel(i.status)}
                  </span>
                      {typeof i.ideaScore === "number" ? (
                        <span className="ml-2 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                          Score {i.ideaScore}
                        </span>
                      ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/insights/${i.id}`}>Open</Link>
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-zinc-600"
                disabled={stageUpdatingId === i.id || i.status === "internal"}
                onClick={() => void updateInsightStage(i.id, "internal")}
              >
                Move to selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-zinc-600"
                disabled={stageUpdatingId === i.id || i.status === "draft_generated"}
                onClick={() => void updateInsightStage(i.id, "draft_generated")}
              >
                Move to draft queue
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-zinc-600"
                disabled={stageUpdatingId === i.id || i.status === "ignored"}
                onClick={() => void updateInsightStage(i.id, "ignored")}
              >
                Archive
              </Button>
            </div>
          </div>
        ))}
        {filteredInsights.length === 0 ? (
          <Card className="border-zinc-200/80 bg-white shadow-sm">
            <CardContent className="p-6 text-sm text-zinc-600">No ideas match this filter yet.</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkedInPreview } from "@/components/dashboard/linkedin-preview";

type ContentFormat = "short" | "medium" | "long";
type InsightStatus = "pending" | "internal" | "draft_generated" | "published" | "ignored";

type DraftLabInsight = {
  id: string;
  summary: string;
  status: string;
  sourceAttribution?: string | null;
  createdAt: Date | string;
};

type DraftLabUser = {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
};

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function cleanSummary(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/(\b(date|reporting lead|today focused)\b)\s*:/gi, (_, key) => `${key}: `)
    .trim();
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

function makeSeedDraft(summary: string, format: ContentFormat) {
  const cleaned = cleanSummary(summary);
  if (format === "short") {
    return [`One practical lesson from execution this week:`, cleaned, "", "How would you approach this?"].join("\n");
  }
  if (format === "long") {
    return [
      "A useful execution insight from this week:",
      "",
      cleaned,
      "",
      "What changed for us:",
      "- clearer prioritization",
      "- less context switching",
      "- stronger follow-through",
      "",
      "Curious how your team handles this.",
    ].join("\n");
  }
  return [
    "Execution note from this week:",
    cleaned,
    "",
    "The practical takeaway: tighten one process at a time and measure progress.",
    "",
    "If this resonates, share how your team handles this.",
  ].join("\n");
}

function locallyRefineDraft(content: string, instruction: string, format: ContentFormat) {
  const input = instruction.toLowerCase();
  if (input.includes("short")) {
    return content.slice(0, 420);
  }
  if (input.includes("long")) {
    return `${content}\n\nExtra context:\n${makeSeedDraft(content, "long").slice(0, 220)}`;
  }
  if (input.includes("hook")) {
    return `Hot take: ${content}`;
  }
  if (input.includes("punchy")) {
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  }
  return `${content}\n\nRefined angle (${format}): ${instruction}`;
}

export function DraftLabClient({
  insight,
  user,
  initialDraft,
}: {
  insight: DraftLabInsight;
  user: DraftLabUser;
  initialDraft: string | null;
}) {
  const [format, setFormat] = useState<ContentFormat>("medium");
  const [draftContent, setDraftContent] = useState(initialDraft ?? makeSeedDraft(insight.summary, "medium"));
  const [draftLoading, setDraftLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "assistant-1",
      role: "assistant",
      text: `I pulled this idea from ${getSourceLabel(insight.sourceAttribution)}. Tell me how you want to shape the angle and I’ll refine the draft.`,
    },
  ]);

  const authorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Your Name";
  const authorTitle = "Your Title · Company";
  const createdAt = useMemo(() => new Date(insight.createdAt).toISOString().slice(0, 10), [insight.createdAt]);
  const [currentStatus, setCurrentStatus] = useState(insight.status);

  useEffect(() => {
    if (initialDraft) setDraftContent(initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    // Opening Draft Lab means this idea is selected for drafting.
    if (currentStatus !== "pending") return;
    const markSelected = async () => {
      try {
        await fetch("/api/insights/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ insightId: insight.id, status: "internal" }),
        });
        setCurrentStatus("internal");
      } catch {
        // Non-blocking.
      }
    };
    void markSelected();
  }, [currentStatus, insight.id]);

  async function generateDraft() {
    setDraftLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/insights/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: insight.id, format }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? `Generate failed (${response.status})`);
      }
      const content = payload?.draft?.content;
      if (!content || typeof content !== "string") throw new Error("No draft returned");
      setDraftContent(content);
      setCurrentStatus("draft_generated");
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: "assistant", text: "Draft generated. Want me to refine the hook, shorten it, or make it more tactical?" },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate draft");
    } finally {
      setDraftLoading(false);
    }
  }

  async function publishNow() {
    setPublishLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/insights/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: insight.id, format }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? `Update failed (${response.status})`);
      setCurrentStatus("published");
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}-published`,
          role: "assistant",
          text: "Published. You can track this in the Publishing dashboard.",
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishLoading(false);
    }
  }

  function submitRefine() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", text: trimmed }]);
    const next = locallyRefineDraft(draftContent, trimmed, format);
    setDraftContent(next);
    setMessages((prev) => [
      ...prev,
      { id: `assistant-${Date.now()}-2`, role: "assistant", text: "Refined. If you want, I can make it shorter, more contrarian, or add a stronger CTA." },
    ]);
    setInput("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="border-zinc-200/80 bg-white shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{cleanSummary(insight.summary).slice(0, 90)}</h2>
              <p className="text-xs text-zinc-500 mt-1">From {getSourceLabel(insight.sourceAttribution)} · {createdAt}</p>
            </div>
            <span className="inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{currentStatus}</span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto rounded-lg border border-zinc-200 p-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "assistant" ? "bg-zinc-100 text-zinc-700" : "ml-auto bg-[var(--accent)] text-white"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask to refine: shorter, punchier hook, more tactical..."
              className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            />
            <Button size="sm" onClick={submitRefine}>Refine</Button>
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-zinc-200/80 bg-white shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Preview</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={draftLoading} onClick={() => void generateDraft()}>
                  {draftLoading ? "Generating..." : "Generate draft"}
                </Button>
                <Button size="sm" disabled={publishLoading} onClick={() => void publishNow()}>
                  {publishLoading ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </div>
            <LinkedInPreview
              content={draftContent}
              format={format}
              onFormatChange={setFormat}
              authorName={authorName}
              authorTitle={authorTitle}
              authorAvatarUrl={user.avatarUrl}
              characterCount={draftContent.length}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

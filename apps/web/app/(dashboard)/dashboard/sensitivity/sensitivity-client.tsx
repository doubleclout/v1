"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const TOGGLE_OPTIONS = [
  { id: "allowPercentages", label: "Allow percentages in output", section: "numeric" },
  { id: "allowRevenueNumbers", label: "Allow revenue numbers", section: "numeric" },
  { id: "maskPersonalNames", label: "Mask personal names", section: "names" },
  { id: "maskClientNames", label: "Mask client names", section: "names" },
  { id: "maskCompanyNames", label: "Mask company names", section: "names" },
  { id: "maskRoadmapItems", label: "Mask roadmap items", section: "strategic" },
  { id: "maskInternalToolRefs", label: "Mask internal tool references", section: "strategic" },
] as const;

const REDACT = "[redacted]";

function buildPreview(toggles: Record<string, string>, strictness: string) {
  const get = (id: string) => toggles[id] ?? "off";
  const showPercentages = get("allowPercentages") === "on";
  const showRevenue = get("allowRevenueNumbers") === "on";
  const showPersonalNames = get("maskPersonalNames") !== "on";
  const showClientNames = get("maskClientNames") !== "on";
  const showCompanyNames = get("maskCompanyNames") !== "on";
  const showRoadmap = get("maskRoadmapItems") !== "on";
  const showToolRefs = get("maskInternalToolRefs") !== "on";

  const pct = showPercentages ? "23%" : REDACT;
  const revenue = showRevenue ? "$400K" : REDACT;
  const sarah = showPersonalNames ? "Sarah" : REDACT;
  const acme = showClientNames ? "Acme Corp" : REDACT;
  const productPlanning = showToolRefs ? "#product-planning" : REDACT;
  const roadmap = showRoadmap ? "Q2 roadmap" : REDACT;

  const pipeline = strictness === "high" ? REDACT : "pipeline";

  const parts: string[] = [];
  parts.push(`Our activation improved ${pct} after we removed the onboarding step.`);
  parts.push(`The team discussed this in ${productPlanning} — ${sarah} mentioned the ${revenue} ${pipeline} impact.`);
  parts.push(`${acme} is aligned with our ${roadmap} priorities.`);

  return parts.join(" ");
}

export function SensitivityClient({
  orgId,
  initialToggles,
  initialStrictness,
}: {
  orgId: string;
  initialToggles: Record<string, string>;
  initialStrictness: string;
}) {
  const [toggles, setToggles] = useState<Record<string, string>>(initialToggles);
  const [strictness, setStrictness] = useState(initialStrictness);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const firstRun = useRef(true);

  const toggle = (id: string, value: string) => {
    setToggles((prev) => ({ ...prev, [id]: value }));
  };

  const save = async () => {
    setSaving(true);
    setSaveMessage(null);
    await fetch("/api/sensitivity/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, toggles, redactionStrictness: strictness }),
    });
    setSaving(false);
    setSaveMessage("Saved");
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaveMessage("Saving...");
    const timeoutId = window.setTimeout(() => {
      void save();
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [toggles, strictness]);

  const numericToggles = TOGGLE_OPTIONS.filter((t) => t.section === "numeric");
  const namesToggles = TOGGLE_OPTIONS.filter((t) => t.section === "names");
  const strategicToggles = TOGGLE_OPTIONS.filter((t) => t.section === "strategic");

  const previewText = buildPreview(toggles, strictness);
  const hasAskBeforePublish = Object.values(toggles).some((v) => v === "ask");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Numeric Data</CardTitle>
            <CardDescription>Control numeric metrics in published content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {numericToggles.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <Label>{t.label}</Label>
                <select
                  value={toggles[t.id] ?? "off"}
                  onChange={(e) => toggle(t.id, e.target.value)}
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                  <option value="ask">Ask before publish</option>
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Names</CardTitle>
            <CardDescription>Mask names in output</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {namesToggles.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <Label>{t.label}</Label>
                <select
                  value={toggles[t.id] ?? "off"}
                  onChange={(e) => toggle(t.id, e.target.value)}
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                  <option value="ask">Ask before publish</option>
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Strategic Info</CardTitle>
            <CardDescription>Protect internal strategy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategicToggles.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <Label>{t.label}</Label>
                <select
                  value={toggles[t.id] ?? "off"}
                  onChange={(e) => toggle(t.id, e.target.value)}
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                  <option value="ask">Ask before publish</option>
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Redaction Strictness</CardTitle>
            <CardDescription>Low — Moderate — High</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {["low", "moderate", "high"].map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strictness"
                    value={s}
                    checked={strictness === s}
                    onChange={() => setStrictness(s)}
                  />
                  <span className="capitalize">{s}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
          <span className="text-xs text-zinc-500">{saveMessage ?? "Auto-saves on change"}</span>
        </div>
      </div>

      <Card className="border-zinc-200/80 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Example draft with masking applied — updates live as you change settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p>{previewText}</p>
            <p className="mt-2 text-muted-foreground text-xs">
              Strictness: {strictness}
            </p>
          </div>
          {hasAskBeforePublish && (
            <Button className="w-full bg-[var(--accent)] hover:opacity-90" asChild>
              <Link href="/dashboard/publishing">Refine or publish to LinkedIn</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

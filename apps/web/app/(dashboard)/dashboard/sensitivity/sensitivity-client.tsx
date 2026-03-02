"use client";

import { useState } from "react";
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

  const toggle = (id: string, value: string) => {
    setToggles((prev) => ({ ...prev, [id]: value }));
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/sensitivity/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, toggles, redactionStrictness: strictness }),
    });
    setSaving(false);
  };

  const numericToggles = TOGGLE_OPTIONS.filter((t) => t.section === "numeric");
  const namesToggles = TOGGLE_OPTIONS.filter((t) => t.section === "names");
  const strategicToggles = TOGGLE_OPTIONS.filter((t) => t.section === "strategic");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Example draft with masking applied</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p>
              Our activation improved 23% after we removed the onboarding step. The team discussed this in #product-planning — Sarah mentioned the $400K pipeline impact.
            </p>
            <p className="mt-2 text-muted-foreground">
              With strictness &quot;moderate&quot; and revenue/percentages off: numbers and names would be redacted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

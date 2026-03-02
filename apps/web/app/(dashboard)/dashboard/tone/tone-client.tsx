"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const TONES = [
  { id: "educational", label: "Educational", desc: "Teach the lesson clearly" },
  { id: "insightful", label: "Insightful", desc: "Share unique perspectives" },
  { id: "tactical", label: "Tactical", desc: "How-to breakdown" },
  { id: "contrarian", label: "Contrarian", desc: "Challenge assumptions" },
  { id: "reflective", label: "Reflective", desc: "Lessons learned" },
  { id: "executive_summary", label: "Executive summary", desc: "Concise, high-level" },
] as const;

const CREATOR_VOICES = [
  { id: "sahil", name: "Sahil Bloom", followers: "1.8M", style: "Motivational frameworks" },
  { id: "lenny", name: "Lenny Rachitsky", followers: "720K", style: "Product insights" },
  { id: "justin", name: "Justin Welsh", followers: "900K", style: "Solopreneur playbooks" },
];

export function ToneClient({
  orgId,
  defaultTone,
  customNotes,
  activeVoiceId,
}: {
  orgId: string;
  defaultTone: string;
  customNotes: string;
  activeVoiceId: string;
}) {
  const [tone, setTone] = useState(defaultTone);
  const [notes, setNotes] = useState(customNotes);
  const [activeVoice, setActiveVoice] = useState(activeVoiceId);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch("/api/tone/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, defaultTone: tone, customNotes: notes, activeVoiceId: activeVoice }),
    });
    setSaving(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your Voices</CardTitle>
          <CardDescription>Default tone for generated drafts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>My Voice</Label>
            <div className="mt-2 space-y-2">
              {TONES.map((t) => (
                <label key={t.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tone"
                    value={t.id}
                    checked={tone === t.id}
                    onChange={() => setTone(t.id)}
                  />
                  <div>
                    <span className="font-medium">{t.label}</span>
                    <span className="text-muted-foreground text-sm ml-2">— {t.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Custom voice notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Short punchy paragraphs, opens with bold statements"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creator Voices</CardTitle>
          <CardDescription>Learn from top creators. Use their style as a starting point.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CREATOR_VOICES.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.followers} · {c.style}</p>
              </div>
              <Button
                size="sm"
                variant={activeVoice === c.id ? "default" : "outline"}
                onClick={() => setActiveVoice(activeVoice === c.id ? "my_voice" : c.id)}
              >
                {activeVoice === c.id ? "Active" : "Use Voice"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save tone profile"}
        </Button>
      </div>
    </div>
  );
}

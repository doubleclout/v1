import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ExtractInsightResult,
  DraftVariation,
  SensitivityConfig,
  ToneConfig,
} from "@doubleclout/shared";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function extractInsight(rawContent: string): Promise<ExtractInsightResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an analyst extracting execution insights from work context (Slack, Zoom, Google, etc.).
Extract actionable insights that could be shared as professional content.
Return JSON with: summary (string), confidence (0-1, how likely this is a valuable insight), sensitivity (low|moderate|high).
Be conservative: only high-quality insights get confidence > 0.7.`,
      },
      {
        role: "user",
        content: rawContent.slice(0, 8000), // Limit context
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const parsed = JSON.parse(content) as {
    summary?: string;
    confidence?: number;
    sensitivity?: string;
  };

  return {
    summary: parsed.summary ?? "No summary extracted",
    confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
    sensitivity: (parsed.sensitivity?.toLowerCase() ?? "low") as "low" | "moderate" | "high",
  };
}

export async function generateDraft(
  insightSummary: string,
  variation: DraftVariation,
  toneConfig?: ToneConfig
): Promise<string> {
  const tone = toneConfig?.defaultTone ?? "educational";
  const customNotes = toneConfig?.customNotes ?? "";

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    system: `You write professional LinkedIn-style posts from execution insights.
Variations: educational (teach), tactical (how-to), reflective (lessons learned).
Tone: ${tone}. ${customNotes ? `Custom notes: ${customNotes}` : ""}
Keep it concise (150-300 words). No hashtags unless asked.`,
    messages: [
      {
        role: "user",
        content: `Generate a ${variation} draft from this insight:\n\n${insightSummary}`,
      },
    ],
  });

  const text = response.content.find((c) => c.type === "text");
  return text && "text" in text ? text.text : "";
}

export function applyRedaction(
  draft: string,
  sensitivityConfig?: SensitivityConfig
): { redacted: string; hasSensitiveContent: boolean } {
  if (!sensitivityConfig || sensitivityConfig.redactionStrictness === "low") {
    return { redacted: draft, hasSensitiveContent: false };
  }

  let redacted = draft;
  let hasSensitiveContent = false;

  // Simple heuristic redaction - replace numbers that look like percentages/revenue
  if (!sensitivityConfig.allowPercentages) {
    const pctMatch = redacted.match(/\d+(\.\d+)?%|percent/g);
    if (pctMatch) {
      hasSensitiveContent = true;
      redacted = redacted.replace(/\d+(\.\d+)?%/g, "[REDACTED]");
    }
  }

  if (!sensitivityConfig.allowRevenueNumbers) {
    const revenueMatch = redacted.match(/\$[\d,]+(\.\d+)?|USD\s*[\d,]+/gi);
    if (revenueMatch) {
      hasSensitiveContent = true;
      redacted = redacted.replace(/\$[\d,]+(\.\d+)?|USD\s*[\d,]+/gi, "[REDACTED]");
    }
  }

  if (sensitivityConfig.maskPersonalNames) {
    // Placeholder - would need NER or more sophisticated detection
    hasSensitiveContent = true;
  }

  return { redacted, hasSensitiveContent };
}

export async function scoreSensitivity(content: string): Promise<number> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Score content sensitivity 0-1. 0=public safe, 1=highly sensitive. Return only a number.",
      },
      { role: "user", content: content.slice(0, 4000) },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();
  const score = parseFloat(text ?? "0");
  return Math.min(1, Math.max(0, isNaN(score) ? 0 : score));
}

export async function applyTone(draft: string, tone: string): Promise<string> {
  if (tone === "educational") return draft;
  return draft; // Placeholder - could use AI to adjust tone
}

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ExtractInsightResult,
  DraftVariation,
  SensitivityConfig,
  ToneConfig,
} from "@doubleclout/shared";

function heuristicSensitivity(text: string): "low" | "moderate" | "high" {
  const lower = text.toLowerCase();
  if (
    lower.includes("revenue") ||
    lower.includes("pricing") ||
    lower.includes("salary") ||
    lower.includes("confidential")
  ) {
    return "high";
  }
  if (
    lower.includes("customer") ||
    lower.includes("deadline") ||
    lower.includes("roadmap") ||
    lower.includes("bug")
  ) {
    return "moderate";
  }
  return "low";
}

function heuristicSummary(rawContent: string): string {
  const compact = rawContent.replace(/\s+/g, " ").trim();
  if (!compact) return "No summary extracted";
  const firstSentence = compact.split(/[.!?]/).map((s) => s.trim()).find(Boolean);
  return (firstSentence ?? compact).slice(0, 240);
}

function heuristicInsight(rawContent: string): ExtractInsightResult {
  const compact = rawContent.replace(/\s+/g, " ").trim();
  const confidence = compact.length >= 220 ? 0.78 : compact.length >= 120 ? 0.72 : 0.58;
  return {
    summary: heuristicSummary(rawContent),
    confidence,
    sensitivity: heuristicSensitivity(rawContent),
  };
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required");
  return new OpenAI({ apiKey: key });
}

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is required");
  return new Anthropic({ apiKey: key });
}

export async function extractInsight(rawContent: string): Promise<ExtractInsightResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return heuristicInsight(rawContent);
    }

    const response = await getOpenAI().chat.completions.create({
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
  } catch {
    return heuristicInsight(rawContent);
  }
}

export async function generateDraft(
  insightSummary: string,
  variation: DraftVariation,
  toneConfig?: ToneConfig
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    const lead =
      variation === "educational"
        ? "One execution lesson worth sharing:"
        : variation === "tactical"
        ? "Practical playbook from execution:"
        : "A reflection from recent execution:";
    return [
      lead,
      "",
      insightSummary.trim(),
      "",
      "What would you do differently in this situation?",
    ].join("\n");
  }

  const tone = toneConfig?.defaultTone ?? "educational";
  const customNotes = toneConfig?.customNotes ?? "";

  try {
    const response = await getAnthropic().messages.create({
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
  } catch {
    const fallbackLead =
      variation === "educational"
        ? "One useful lesson from this execution:"
        : variation === "tactical"
        ? "How we would execute this next time:"
        : "What this taught us:";
    return [fallbackLead, "", insightSummary.trim()].join("\n");
  }
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
  const response = await getOpenAI().chat.completions.create({
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

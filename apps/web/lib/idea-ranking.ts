type RankableInsight = {
  summary: string;
  confidence: number;
  status: string;
  sourceAttribution?: string | null;
  createdAt: Date | string;
};

function getSourceLabel(sourceAttribution?: string | null) {
  const text = (sourceAttribution ?? "").toLowerCase();
  if (text.includes("google drive") || text.includes("google doc")) return "Google Docs";
  if (text.includes("gmail")) return "Gmail";
  if (text.includes("slack")) return "Slack";
  if (text.includes("zoom")) return "Zoom";
  if (text.includes("github")) return "GitHub";
  return "Connected source";
}

function keywordSignal(summary: string) {
  const text = summary.toLowerCase();
  const signals = [
    "customer",
    "revenue",
    "pipeline",
    "growth",
    "retention",
    "conversion",
    "experiment",
    "ship",
    "launch",
    "bottleneck",
    "playbook",
    "lesson",
    "mistake",
  ];
  let count = 0;
  for (const signal of signals) {
    if (text.includes(signal)) count++;
  }
  return Math.min(1, count / 4);
}

function recencySignal(createdAt: Date | string) {
  const created = new Date(createdAt).getTime();
  const hours = Math.max(0, (Date.now() - created) / (1000 * 60 * 60));
  if (hours <= 24) return 1;
  if (hours <= 72) return 0.8;
  if (hours <= 168) return 0.6;
  return 0.35;
}

function sourceSignal(sourceAttribution?: string | null) {
  const source = getSourceLabel(sourceAttribution);
  if (source === "Slack") return 1;
  if (source === "Zoom") return 0.95;
  if (source === "Google Docs") return 0.9;
  if (source === "Gmail") return 0.8;
  if (source === "GitHub") return 0.85;
  return 0.7;
}

function statusSignal(status: string) {
  if (status === "pending") return 1;
  if (status === "internal") return 0.9;
  if (status === "draft_generated") return 0.7;
  if (status === "published") return 0.4;
  if (status === "ignored") return 0.2;
  return 0.5;
}

export function rankIdea(insight: RankableInsight) {
  const confidence = Math.max(0, Math.min(1, insight.confidence || 0));
  const recency = recencySignal(insight.createdAt);
  const source = sourceSignal(insight.sourceAttribution);
  const keyword = keywordSignal(insight.summary);
  const status = statusSignal(insight.status);

  const raw =
    confidence * 0.35 +
    recency * 0.2 +
    source * 0.15 +
    keyword * 0.2 +
    status * 0.1;
  const score = Math.round(raw * 100);

  const reasons: string[] = [];
  if (confidence >= 0.75) reasons.push("high confidence extraction");
  if (recency >= 0.8) reasons.push("fresh signal from recent work");
  if (keyword >= 0.5) reasons.push("contains strong execution/business terms");
  const sourceLabel = getSourceLabel(insight.sourceAttribution);
  if (sourceLabel !== "Connected source") reasons.push(`source: ${sourceLabel}`);

  return {
    score,
    reasons: reasons.slice(0, 2),
  };
}


type ToggleValue = "on" | "off" | "ask";

export type SensitivityConfigState = {
  toggles: Record<string, string>;
  redactionStrictness: string;
};

const REDACTED = "[redacted]";

function toggle(toggles: Record<string, string>, key: string): ToggleValue {
  const value = toggles[key];
  if (value === "on" || value === "off" || value === "ask") return value;
  return "off";
}

function shouldMaskAllow(toggles: Record<string, string>, key: string) {
  // "Allow ..." toggles: only "on" allows. "off"/"ask" are masked.
  return toggle(toggles, key) !== "on";
}

function shouldMaskMasking(toggles: Record<string, string>, key: string) {
  // "Mask ..." toggles: "on"/"ask" mask. "off" allows.
  const value = toggle(toggles, key);
  return value === "on" || value === "ask";
}

export function applySensitivityRules(content: string, config: SensitivityConfigState) {
  const toggles = config.toggles ?? {};
  let next = content;

  if (shouldMaskAllow(toggles, "allowPercentages")) {
    next = next.replace(/\b\d+(?:\.\d+)?%/g, REDACTED);
  }

  if (shouldMaskAllow(toggles, "allowRevenueNumbers")) {
    next = next
      .replace(/\$\s?\d[\d,]*(?:\.\d+)?(?:\s?[kKmMbB])?/g, REDACTED)
      .replace(/\b\d[\d,]*(?:\.\d+)?\s?(?:USD|usd|dollars?)\b/g, REDACTED);
  }

  if (shouldMaskMasking(toggles, "maskInternalToolRefs")) {
    // Internal refs: channels, handles, explicit "workspace/channel/tool" mentions.
    next = next
      .replace(/#[\w-]+/g, REDACTED)
      .replace(/@[\w.-]+/g, REDACTED)
      .replace(/\b(internal tool|workspace|private channel|ops board|notion page)\b/gi, REDACTED);
  }

  if (shouldMaskMasking(toggles, "maskRoadmapItems")) {
    next = next.replace(/\b(Q[1-4]\s?(roadmap|plan|priority)|roadmap|launch plan|release plan)\b/gi, REDACTED);
  }

  if (shouldMaskMasking(toggles, "maskClientNames")) {
    next = next.replace(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\s(?:Inc|LLC|Ltd|Corp|Company)\b/g, REDACTED);
  }

  if (shouldMaskMasking(toggles, "maskCompanyNames")) {
    next = next.replace(/\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+){0,2})\b(?=\s(team|org|company|workspace)\b)/g, REDACTED);
  }

  if (shouldMaskMasking(toggles, "maskPersonalNames")) {
    // Conservative personal-name masking heuristic.
    next = next.replace(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b(?=\s(mentioned|said|shared|reported|asked|noted)\b)/g, REDACTED);
  }

  if ((config.redactionStrictness ?? "moderate") === "high") {
    // High strictness further reduces direct numeric traces.
    next = next.replace(/\b\d{2,}\b/g, REDACTED);
  }

  return next;
}

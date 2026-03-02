export type ExecutionEventInput = {
  orgId: string;
  source: "slack" | "zoom" | "google" | "gmail";
  type: string;
  actors?: string[];
  rawContent: string;
  structuredMetadata?: Record<string, unknown>;
};

export type ExtractInsightResult = {
  summary: string;
  confidence: number;
  sensitivity: "low" | "moderate" | "high";
};

export type DraftVariation = "educational" | "tactical" | "reflective";

export type SensitivityConfig = {
  allowPercentages?: boolean;
  allowRevenueNumbers?: boolean;
  maskPersonalNames?: boolean;
  maskClientNames?: boolean;
  maskCompanyNames?: boolean;
  maskRoadmapItems?: boolean;
  maskInternalToolRefs?: boolean;
  redactionStrictness?: "low" | "moderate" | "high";
};

export type ToneConfig = {
  defaultTone: "educational" | "insightful" | "tactical" | "contrarian" | "reflective" | "executive_summary";
  customNotes?: string;
};

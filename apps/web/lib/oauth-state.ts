import crypto from "crypto";

type OAuthStatePayload = {
  orgId: string;
  source: "google" | "gmail";
  ts: number;
};

function getSigningSecret() {
  return (
    process.env.OAUTH_STATE_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "doubleclout-dev-secret"
  );
}

function signState(raw: string) {
  return crypto.createHmac("sha256", getSigningSecret()).update(raw).digest("hex");
}

export function createOAuthState(orgId: string, source: OAuthStatePayload["source"]) {
  const payload: OAuthStatePayload = { orgId, source, ts: Date.now() };
  const raw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = signState(raw);
  return `${raw}.${sig}`;
}

export function parseOAuthState(
  state: string | null,
  source: OAuthStatePayload["source"],
  maxAgeMs = 1000 * 60 * 30
) {
  if (!state) return { ok: false as const, error: "missing_state" };
  const [raw, sig] = state.split(".");
  if (!raw || !sig) return { ok: false as const, error: "invalid_state_format" };
  const expectedSig = signState(raw);
  if (sig !== expectedSig) return { ok: false as const, error: "invalid_state_signature" };

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!parsed.orgId || !parsed.source || !parsed.ts) {
      return { ok: false as const, error: "invalid_state_payload" };
    }
    if (parsed.source !== source) return { ok: false as const, error: "invalid_state_source" };
    if (Date.now() - parsed.ts > maxAgeMs) return { ok: false as const, error: "expired_state" };
    return { ok: true as const, orgId: parsed.orgId };
  } catch {
    return { ok: false as const, error: "invalid_state_payload" };
  }
}

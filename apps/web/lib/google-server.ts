import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq } from "@doubleclout/db";
import { refreshGoogleAccessToken } from "@/lib/google-oauth";

type StoredTokens = {
  access?: string;
  refresh?: string;
  expiry?: string;
  scope?: string;
  tokenType?: string;
};

export async function getGoogleAccessTokenForIntegration(integrationId: string) {
  const [int] = await db.select().from(integration).where(eq(integration.id, integrationId)).limit(1);
  if (!int) return null;
  const tokens = (int.tokens as StoredTokens | undefined) ?? {};
  const expiry = tokens.expiry ? Number(tokens.expiry) : 0;
  const isExpired = expiry > 0 && Date.now() >= expiry - 30_000;

  if (tokens.access && !isExpired) return tokens.access;
  if (!tokens.refresh) return tokens.access ?? null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const refreshed = await refreshGoogleAccessToken({
    clientId,
    clientSecret,
    refreshToken: tokens.refresh,
  });
  if (refreshed.error || !refreshed.access_token) return null;

  const nextTokens: StoredTokens = {
    ...tokens,
    access: refreshed.access_token,
    ...(refreshed.expires_in ? { expiry: String(Date.now() + refreshed.expires_in * 1000) } : {}),
  };
  await db
    .update(integration)
    .set({ tokens: nextTokens as Record<string, string>, updatedAt: new Date() })
    .where(eq(integration.id, integrationId));

  return nextTokens.access ?? null;
}

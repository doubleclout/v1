export type OAuthTokenPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleIntegrationTokens = {
  access?: string;
  refresh?: string;
  expiry?: string;
  scope?: string;
  tokenType?: string;
};

type GoogleIntegrationConfig = {
  folderIds: string[];
  includeMimeTypes: string[];
  monitorDocs: boolean;
  driveCursor: string | null;
  gmailHistoryId?: string | null;
  lastSyncAt: string | null;
  syncEnabled: boolean;
};

export async function exchangeGoogleOAuthCode(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  return (await tokenRes.json()) as OAuthTokenPayload;
}

export async function refreshGoogleAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return (await tokenRes.json()) as OAuthTokenPayload;
}

export function buildGoogleTokens(
  tokenData: OAuthTokenPayload,
  existing?: GoogleIntegrationTokens
): GoogleIntegrationTokens {
  return {
    access: tokenData.access_token ?? existing?.access,
    refresh: tokenData.refresh_token ?? existing?.refresh,
    ...(tokenData.expires_in ? { expiry: String(Date.now() + tokenData.expires_in * 1000) } : {}),
    scope: tokenData.scope ?? existing?.scope,
    tokenType: tokenData.token_type ?? existing?.tokenType,
  };
}

export function getDefaultGoogleConfig(
  existing?: Record<string, unknown>,
  source: "google" | "gmail" = "google"
): GoogleIntegrationConfig {
  const current = existing ?? {};
  const folderIds = Array.isArray(current.folderIds)
    ? (current.folderIds as string[]).filter(Boolean)
    : [];
  const includeMimeTypes = Array.isArray(current.includeMimeTypes)
    ? (current.includeMimeTypes as string[]).filter(Boolean)
    : [
        "application/vnd.google-apps.document",
        "application/vnd.google-apps.spreadsheet",
        "application/vnd.google-apps.presentation",
        "application/pdf",
      ];

  return {
    folderIds,
    includeMimeTypes,
    monitorDocs: current.monitorDocs !== false,
    driveCursor:
      typeof current.driveCursor === "string" || current.driveCursor === null
        ? (current.driveCursor as string | null)
        : null,
    gmailHistoryId:
      source === "gmail" &&
      (typeof current.gmailHistoryId === "string" || current.gmailHistoryId === null)
        ? (current.gmailHistoryId as string | null)
        : undefined,
    lastSyncAt:
      typeof current.lastSyncAt === "string" || current.lastSyncAt === null
        ? (current.lastSyncAt as string | null)
        : null,
    syncEnabled: current.syncEnabled !== false,
  };
}

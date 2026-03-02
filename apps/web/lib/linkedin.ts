import { db } from "@/lib/db";
import { integration } from "@doubleclout/db";
import { eq, and } from "@doubleclout/db";

export async function publishToLinkedIn(
  orgId: string,
  content: string,
  authorUrn?: string
): Promise<{ success: boolean; postUrn?: string; error?: string }> {
  const [int] = await db
    .select()
    .from(integration)
    .where(and(eq(integration.orgId, orgId), eq(integration.source, "linkedin")))
    .limit(1);

  const accessToken = (int?.tokens as { access?: string })?.access;
  if (!accessToken) {
    return { success: false, error: "LinkedIn not connected" };
  }

  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    return { success: false, error: "Failed to get LinkedIn profile" };
  }

  const profile = await profileRes.json();
  const personUrn = authorUrn ?? `urn:li:person:${profile.sub}`;

  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  if (!postRes.ok) {
    const err = await postRes.text();
    return { success: false, error: err };
  }

  const post = await postRes.json();
  return { success: true, postUrn: post.id };
}

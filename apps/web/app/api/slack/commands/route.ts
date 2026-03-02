import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifySlackSignature(body: string, signature: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return false;
  const sigBasestring = `v0:${body}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(sigBasestring);
  const computed = `v0=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(computed, "utf8")
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-slack-signature") ?? "";

  if (!verifySlackSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const command = params.get("command");

  if (command === "/arc-settings") {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    return NextResponse.json({
      response_type: "ephemeral",
      text: `Open your dashboard to manage sources, sensitivity, and publishing: ${dashboardUrl}`,
    });
  }

  return NextResponse.json({ text: "Unknown command" });
}

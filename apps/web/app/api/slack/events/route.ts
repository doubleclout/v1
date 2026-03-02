import { NextRequest, NextResponse } from "next/server";
import { handleSlackEvent } from "@/lib/slack-events";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-slack-signature") ?? "";

  try {
    const result = await handleSlackEvent(body, signature);
    if (result && "challenge" in result) {
      return NextResponse.json({ challenge: result.challenge });
    }
    return new NextResponse("", { status: 200 });
  } catch (err) {
    console.error("Slack event error:", err);
    return NextResponse.json(
      { error: "Event processing failed" },
      { status: 500 }
    );
  }
}

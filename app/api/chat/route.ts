import { NextResponse } from "next/server";
import { createChat } from "@/lib/chat";

export const dynamic = "force-dynamic";

/** Starts a conversation. The returned id is the customer's key to it, so it's kept secret in their browser. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const meta = await createChat(body.lang === "mn" ? "mn" : "en");
  return NextResponse.json({ id: meta.id });
}

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listChats } from "@/lib/chat";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const chats = await listChats();
  return NextResponse.json({ chats, unread: chats.reduce((n, c) => n + c.unread, 0) });
}

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { addMessage, deleteChat, getChat, getMessages, isChatId, updateChat } from "@/lib/chat";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };
const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });

/** Opens a conversation for Paul and marks it read. */
export async function GET(_req: Request, { params }: Ctx) {
  if (!isAdmin()) return unauthorized();
  if (!isChatId(params.id)) return notFound();
  const meta = await getChat(params.id);
  if (!meta) return notFound();
  const read = meta.unread ? await updateChat(params.id, { unread: 0 }) : meta;
  return NextResponse.json({ meta: read, messages: await getMessages(params.id) });
}

/** Paul's reply. */
export async function POST(req: Request, { params }: Ctx) {
  if (!isAdmin()) return unauthorized();
  if (!isChatId(params.id)) return notFound();
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  const result = await addMessage(params.id, "paul", text);
  if (!result) return notFound();
  if (result === "full") return NextResponse.json({ error: "This conversation is full." }, { status: 429 });
  return NextResponse.json({ meta: result });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!isAdmin()) return unauthorized();
  if (!isChatId(params.id)) return notFound();
  await deleteChat(params.id);
  return NextResponse.json({ ok: true });
}

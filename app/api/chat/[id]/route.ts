import { NextResponse } from "next/server";
import { addMessage, getChat, getMessages, isChatId, updateChat } from "@/lib/chat";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });

/** Customer polls this for Paul's replies: ?after=<number of messages already seen>. */
export async function GET(req: Request, { params }: Ctx) {
  if (!isChatId(params.id)) return notFound();
  const meta = await getChat(params.id);
  if (!meta) return notFound();
  const after = Number(new URL(req.url).searchParams.get("after")) || 0;
  return NextResponse.json({ human: meta.human, count: meta.count, messages: await getMessages(params.id, after) });
}

/** Customer side adds its own messages and the bot's replies. Paul replies through /api/admin/chats. */
export async function POST(req: Request, { params }: Ctx) {
  if (!isChatId(params.id)) return notFound();
  const body = await req.json().catch(() => ({}));
  const from = body.from === "bot" ? "bot" : "user";
  const text = clean(body.text, 1000);
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  const result = await addMessage(params.id, from, text);
  if (!result) return notFound();
  if (result === "full") return NextResponse.json({ error: "full" }, { status: 429 });
  return NextResponse.json({ count: result.count, human: result.human });
}

/** Customer shares contact details or asks for Paul. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!isChatId(params.id)) return notFound();
  const body = await req.json().catch(() => ({}));
  const patch: { name?: string; phone?: string; human?: boolean } = {};
  if (typeof body.name === "string") patch.name = clean(body.name, 100);
  if (typeof body.phone === "string") patch.phone = clean(body.phone, 40);
  if (body.human === true) patch.human = true;
  const meta = await updateChat(params.id, patch);
  return meta ? NextResponse.json({ ok: true, human: meta.human }) : notFound();
}

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { addRequest, getRequests } from "@/lib/store";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getRequests());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = clean(body.name, 100);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 120);
  if (!name || (!phone && !email)) {
    return NextResponse.json({ error: "missing_contact" }, { status: 400 });
  }
  const date = clean(body.date, 10);
  const time = clean(body.time, 5);
  const result = await addRequest({
    name,
    phone,
    email,
    service: clean(body.service, 120),
    message: clean(body.message, 2000),
    date,
    time,
    source: date ? "booking" : body.source === "chat" ? "chat" : "form",
  });
  if (result === "taken") return NextResponse.json({ error: "taken" }, { status: 409 });
  if (result === "invalid_slot") return NextResponse.json({ error: "invalid_slot" }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id });
}

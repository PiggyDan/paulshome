import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getAvailability, getTakenSlots, saveAvailability } from "@/lib/store";
import { ubToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** Public: opening rules plus which slots are already booked (no customer details). */
export async function GET() {
  const today = ubToday();
  const taken = (await getTakenSlots()).filter((k) => k.slice(0, 10) >= today);
  return NextResponse.json({ availability: await getAvailability(), taken, today });
}

export async function PUT(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  return NextResponse.json(await saveAvailability(body));
}

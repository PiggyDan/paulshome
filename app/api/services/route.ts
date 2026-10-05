import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getServices, normalizeService, saveServices, type Service } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getServices());
}

export async function PUT(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body)) return NextResponse.json({ error: "Expected a list of services" }, { status: 400 });
  const services = body.map(normalizeService).filter((s): s is Service => !!s);
  return NextResponse.json(await saveServices(services));
}

import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, isAdmin, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ authenticated: isAdmin() });
}

export async function POST(req: Request) {
  const session = sessionToken();
  if (!session) {
    return NextResponse.json({ error: "Admin is not set up yet. Add an ADMIN_PASSWORD environment variable and redeploy." }, { status: 503 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}

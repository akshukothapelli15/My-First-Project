import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const COOKIE = "focusflow_session";
const key = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters. Copy .env.example and set a unique secret.");
  return new TextEncoder().encode(secret);
};
export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
}
export async function clearSession() { (await cookies()).delete(COOKIE); }
export async function getCurrentUser() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.sub !== "string") return null;
    return await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true, timezone: true, createdAt: true } });
  } catch { return null; }
}
export async function getApiUser(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.sub !== "string") return null;
    return await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true } });
  } catch { return null; }
}
export function apiError(error: unknown, fallback = "Something went wrong. Please try again.") {
  console.error("FocusFlow API error:", error);
  const detail = error instanceof Error ? error.message : "";
  const message = detail.startsWith("AUTH_SECRET") || detail.startsWith("PrismaClientInitializationError") || detail.startsWith("Can't reach database")
    ? "The server is not configured yet. Set AUTH_SECRET and DATABASE_URL in .env.local, then run the database migration."
    : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

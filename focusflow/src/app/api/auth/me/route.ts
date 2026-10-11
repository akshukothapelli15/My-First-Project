import { NextRequest, NextResponse } from "next/server";
import { apiError, getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const profile = z.object({ name: z.string().trim().min(2).max(80), timezone: z.string().min(1).max(100).optional() });
export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  return NextResponse.json({ user, settings: await prisma.userSettings.findUnique({ where: { userId: user.id } }) });
}
export async function PATCH(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const parsed = profile.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check your profile details and try again." }, { status: 400 });
    const timezone = parsed.data.timezone || "Asia/Kolkata";
    if (!Intl.supportedValuesOf("timeZone").includes(timezone) && timezone !== "UTC") return NextResponse.json({ error: "Choose a valid time zone." }, { status: 400 });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, timezone }, select: { id: true, name: true, email: true } });
    return NextResponse.json({ user: updated });
  } catch (error) { return apiError(error); }
}

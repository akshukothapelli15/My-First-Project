import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: input.error.flatten().fieldErrors }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: input.data.email.toLowerCase().trim() } });
    if (!user || !(await bcrypt.compare(input.data.password, user.passwordHash))) return NextResponse.json({ error: "Email and password don't match. Try again." }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { return apiError(e, "We couldn't sign you in. Try again."); }
}

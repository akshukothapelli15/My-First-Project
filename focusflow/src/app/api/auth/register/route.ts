import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const input = registerSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: input.error.flatten().fieldErrors }, { status: 400 });
    const email = input.data.email.toLowerCase().trim();
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
    const user = await prisma.user.create({ data: { email, name: input.data.name, passwordHash: await bcrypt.hash(input.data.password, 12), settings: { create: {} } }, select: { id: true, name: true, email: true } });
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) { return apiError(e, "We couldn't create your account. Try again."); }
}

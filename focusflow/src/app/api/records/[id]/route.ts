import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { apiError, getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordSchema } from "@/lib/validation";
const updateSchema = recordSchema.partial();
const checkSchema = z.object({ checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const { id } = await params;
    const body: unknown = await request.json();
    const parsedCheck = checkSchema.safeParse(body);
    if (parsedCheck.success) {
      const owned = await prisma.productivityRecord.findFirst({ where: { id, userId: user.id, type: "habit" }, select: { id: true } });
      if (!owned) return NextResponse.json({ error: "Habit not found." }, { status: 404 });
      const checkIn = await prisma.habitCheckIn.upsert({ where: { recordId_date: { recordId: id, date: parsedCheck.data.checkIn } }, create: { recordId: id, date: parsedCheck.data.checkIn }, update: {} });
      return NextResponse.json({ checkIn });
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the details and try again." }, { status: 400 });
    const input = parsed.data;
    const result = await prisma.productivityRecord.updateMany({ where: { id, userId: user.id }, data: { ...(input.title !== undefined && { title: input.title }), ...(input.description !== undefined && { description: input.description }), ...(input.status !== undefined && { status: input.status, completedAt: input.status === "completed" ? new Date() : null }), ...(input.priority !== undefined && { priority: input.priority }), ...(input.dueDate !== undefined && { dueDate: input.dueDate ? new Date(input.dueDate) : null }), ...(input.progress !== undefined && { progress: input.progress }), ...(input.details !== undefined && { details: input.details as Prisma.InputJsonValue }) } });
    if (!result.count) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    const record = await prisma.productivityRecord.findUnique({ where: { id } });
    return NextResponse.json({ record });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const { id } = await params;
    const result = await prisma.productivityRecord.deleteMany({ where: { id, userId: user.id } });
    return result.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Record not found." }, { status: 404 });
  } catch (error) { return apiError(error); }
}

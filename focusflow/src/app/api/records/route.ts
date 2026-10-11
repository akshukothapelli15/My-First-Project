import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { apiError, getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordSchema, recordTypes } from "@/lib/validation";
export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const type = request.nextUrl.searchParams.get("type");
    const search = request.nextUrl.searchParams.get("q")?.trim();
    const where: Prisma.ProductivityRecordWhereInput = { userId: user.id, ...(type === "all" || !type ? {} : recordTypes.includes(type as typeof recordTypes[number]) ? { type } : {}), ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}) };
    const records = await prisma.productivityRecord.findMany({ where, include: { checkIns: { orderBy: { date: "desc" }, take: 60 } }, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json({ records });
  } catch (error) { return apiError(error); }
}
export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const parsed = recordSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the record details and try again." }, { status: 400 });
    const input = parsed.data;
    const record = await prisma.productivityRecord.create({ data: { userId: user.id, type: input.type, title: input.title, description: input.description, status: input.status, priority: input.priority, dueDate: input.dueDate ? new Date(input.dueDate) : null, completedAt: input.status === "completed" ? (input.completedAt ? new Date(input.completedAt) : new Date()) : null, progress: input.progress ?? 0, details: (input.details ?? {}) as Prisma.InputJsonValue }, include: { checkIns: true } });
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) { return apiError(error); }
}

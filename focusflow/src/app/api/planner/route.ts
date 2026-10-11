import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMinutes, isSameDay, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const records = await prisma.productivityRecord.findMany({ where: { userId: user.id, type: { in: ["task", "assignment", "project"] }, status: { not: "completed" }, dueDate: { gte: startOfDay(new Date()) } }, orderBy: [{ dueDate: "asc" }, { priority: "desc" }], take: 40 });
    const now = new Date();
    const rawDate = request.nextUrl.searchParams.get("date");
    const day = rawDate ? parseISO(rawDate) : startOfDay(now);
    if (Number.isNaN(day.getTime())) return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });
    const list = records.filter(r => !r.dueDate || r.dueDate <= addMinutes(day, 24 * 60));
    const blocks = [] as Array<{ id: string; title: string; start: string; end: string; minutes: number; priority: string; suggested: true; break?: boolean }>;
    let cursor = setMinutes(setHours(day, Math.max(isSameDay(day, now) ? now.getHours() + 1 : 9, 9)), 0);
    for (const record of list) {
      const minutes = Math.min(Math.max(Number((record.details as Record<string, unknown>)?.duration ?? (record.type === "assignment" ? 60 : 45)), 15), 180);
      const end = addMinutes(cursor, minutes);
      if (end > setHours(startOfDay(day), 20)) break;
      blocks.push({ id: record.id, title: record.title, start: cursor.toISOString(), end: end.toISOString(), minutes, priority: record.priority, suggested: true });
      cursor = end;
      if (blocks.length % 2 === 0) {
        const breakEnd = addMinutes(cursor, 10);
        blocks.push({ id: `break-${blocks.length}`, title: "Take a short break", start: cursor.toISOString(), end: breakEnd.toISOString(), minutes: 10, priority: "low", suggested: true, break: true });
        cursor = breakEnd;
      }
    }
    return NextResponse.json({ blocks, unscheduled: list.filter(r => !blocks.some(b => b.id === r.id)).length, suggestion: "A time‑boxed plan based on your open tasks, deadlines and estimated effort. Edit any record to adjust its duration." });
  } catch { return NextResponse.json({ error: "We couldn't build your plan. Try again." }, { status: 500 }); }
}

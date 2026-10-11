import { addDays, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
export const recordTypes = ["task", "goal", "habit", "assignment", "learning", "project"] as const;
export type RecordType = typeof recordTypes[number];
export const colors: Record<string, string> = { task: "teal", goal: "violet", habit: "rose", assignment: "amber", learning: "blue", project: "indigo" };
export function asPlainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export async function dashboardData(userId: string) {
  const [records, settings, notifications, checkIns] = await Promise.all([
    prisma.productivityRecord.findMany({ where: { userId }, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] }),
    prisma.userSettings.upsert({ where: { userId }, create: { userId }, update: {} }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.habitCheckIn.findMany({ where: { record: { userId } }, orderBy: { date: "desc" }, take: 200 })
  ]);
  const today = startOfDay(new Date());
  const todayKey = today.toISOString().slice(0, 10);
  const tasks = records.filter(r => r.type === "task");
  const completed = tasks.filter(r => r.status === "completed");
  const todayTasks = tasks.filter(r => r.status !== "completed" && (!r.dueDate || startOfDay(r.dueDate).getTime() <= addDays(today, 0).getTime()));
  const upcoming = records.filter(r => (r.type === "assignment" || r.type === "task" || r.type === "project") && r.status !== "completed" && r.dueDate && r.dueDate >= today).slice(0, 5);
  const habits = records.filter(r => r.type === "habit" && r.status !== "completed");
  const todayChecks = checkIns.filter(c => c.date === todayKey);
  const studySessions = records.filter(r => r.type === "learning");
  const totalStudyMins = studySessions.reduce((sum, r) => sum + Number(asPlainObject(r.details).duration ?? 0), 0);
  const weekStart = startOfDay(subDays(today, 6));
  const weekTasks = tasks.filter(r => r.updatedAt >= weekStart);
  const weekCompleted = weekTasks.filter(r => r.status === "completed").length;
  const weekStudy = studySessions.filter(r => r.createdAt >= weekStart).reduce((sum, r) => sum + Number(asPlainObject(r.details).duration ?? 0), 0);
  const weekCheckIns = checkIns.filter(c => c.date >= weekStart.toISOString().slice(0, 10)).length;
  const metrics = [
    { label: "Tasks completed", value: `${weekCompleted}/${weekTasks.length}`, note: weekTasks.length ? `${Math.round(weekCompleted / weekTasks.length * 100)}% completion rate` : "Your week is a blank page", icon: "check", tone: "teal" },
    { label: "Study time", value: `${Math.floor(weekStudy / 60)}h ${weekStudy % 60}m`, note: "Recorded this week", icon: "clock", tone: "violet" },
    { label: "Habits today", value: `${todayChecks.length}/${habits.length}`, note: habits.length ? "Small wins add up" : "Add a daily habit", icon: "habit", tone: "amber" },
    { label: "Focus score", value: weekTasks.length ? `${Math.round((weekCompleted / weekTasks.length * 75) + (weekCheckIns / Math.max(habits.length * 7, 1) * 25))}%` : "—", note: weekTasks.length ? "Based on this week's activity" : "Complete tasks to build your score", icon: "spark", tone: "blue" }
  ];
  const chart = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(addDays(weekStart, i));
    const key = day.toISOString().slice(0, 10);
    return { day: day.toLocaleDateString("en-US", { weekday: "short" }), completed: tasks.filter(r => r.status === "completed" && r.completedAt && startOfDay(r.completedAt).getTime() === day.getTime()).length, study: studySessions.filter(r => r.createdAt >= day && r.createdAt < addDays(day, 1)).reduce((sum, r) => sum + Number(asPlainObject(r.details).duration ?? 0), 0), habit: checkIns.filter(c => c.date === key).length };
  });
  return { records, tasks, completed, todayTasks, upcoming, habits, todayChecks, studySessions, settings, notifications, metrics, chart, totalStudyMins };
}

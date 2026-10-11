import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const email = process.env.SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    console.log("No seed user created. Set SEED_EMAIL and SEED_PASSWORD to create an optional development user.");
    return;
  }
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: "FocusFlow Student", passwordHash: await bcrypt.hash(password, 12), settings: { create: {} } },
    update: {}
  });
  if (await prisma.productivityRecord.count({ where: { userId: user.id } }) === 0) {
    await prisma.productivityRecord.createMany({ data: [
      { userId: user.id, type: "task", title: "Review lecture notes", description: "Revisit the key ideas from this week.", dueDate: new Date(Date.now() + 86400000), priority: "high", details: { duration: 45, category: "Study" } },
      { userId: user.id, type: "assignment", title: "Research paper outline", description: "Build a clear outline before writing.", dueDate: new Date(Date.now() + 172800000), priority: "medium", details: { subject: "Research Methods", status: "in-progress" } },
      { userId: user.id, type: "habit", title: "Read for 20 minutes", details: { frequency: "daily", duration: 20 } },
      { userId: user.id, type: "goal", title: "Complete data structures course", description: "One module at a time.", progress: 34, dueDate: new Date(Date.now() + 2592000000), details: { category: "Learning" } },
      { userId: user.id, type: "project", title: "Campus sustainability proposal", description: "A practical plan for a greener campus.", dueDate: new Date(Date.now() + 1209600000), progress: 25, details: { category: "College", status: "in-progress" } }
    ] });
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

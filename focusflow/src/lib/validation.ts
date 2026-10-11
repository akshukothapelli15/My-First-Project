import { z } from "zod";
export const registerSchema = z.object({ name: z.string().trim().min(2, "Use at least 2 characters.").max(80), email: z.string().email().max(254), password: z.string().min(8, "Use at least 8 characters.").max(128) });
export const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) });
export const recordTypes = ["task", "goal", "habit", "assignment", "learning", "project"] as const;
export const recordSchema = z.object({ type: z.enum(recordTypes), title: z.string().trim().min(1, "Add a title.").max(160), description: z.string().max(4000).default(""), status: z.string().trim().max(40).default("active"), priority: z.enum(["low", "medium", "high"]).default("medium"), dueDate: z.string().optional(), completedAt: z.string().optional(), progress: z.number().int().min(0).max(100).optional(), details: z.record(z.string(), z.unknown()).optional() });

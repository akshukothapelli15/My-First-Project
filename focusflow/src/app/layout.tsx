import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
export const metadata: Metadata = { title: { default: "FocusFlow · Make time for what matters", template: "%s · FocusFlow" }, description: "A calm, intelligent workspace for students to plan tasks, track goals, build better habits, and make steady progress.", applicationName: "FocusFlow" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}

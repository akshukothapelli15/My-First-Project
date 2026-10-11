import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
export const metadata={title:"Create your account"};
export default async function Register(){if(await getCurrentUser())redirect("/dashboard");return <AuthForm mode="register"/>}

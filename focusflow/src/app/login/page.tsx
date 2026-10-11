import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
export const metadata={title:"Sign in"};
export default async function Login(){if(await getCurrentUser())redirect("/dashboard");return <><AuthForm mode="login"/><Link href="/" aria-label="FocusFlow home" style={{position:"fixed",top:16,left:18,width:1,height:1,overflow:"hidden"}}>FocusFlow</Link></>}

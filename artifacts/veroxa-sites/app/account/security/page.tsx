import { redirect } from "next/navigation";
import { AccountSecurity } from "../../account-security";
import {
  getServerSupabasePublicConfig,
  getServerVeroxaAccess,
} from "../../veroxa-supabase-server";

export const dynamic = "force-dynamic";

export default async function AccountSecurityRoute() {
  const access = await getServerVeroxaAccess();
  if (!access) redirect("/login?return_to=%2Faccount%2Fsecurity");
  const supabaseConfig = getServerSupabasePublicConfig();
  if (!supabaseConfig) redirect("/login");
  return <AccountSecurity displayName={access.displayName} role={access.role} supabaseConfig={supabaseConfig} />;
}

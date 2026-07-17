import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentAdmin = {
  id: string;
  full_name: string | null;
  role: "owner" | "staff";
};

export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const supabase = await createClient();

  // Verified claims, not a raw session read — see middleware.ts for why.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .single();

  if (!profile || !profile.role) {
    return null;
  }

  return profile as CurrentAdmin;
});

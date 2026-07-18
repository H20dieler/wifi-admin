"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { logActivity } from "@/lib/log-activity";
import { planSchema } from "@/lib/validations/plan";

export type ActionState = {
  success: boolean;
  error: string | null;
};

export async function savePlan(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  const id = formData.get("id");
  const isEdit = typeof id === "string" && id.length > 0;

  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    speed_mbps: formData.get("speed_mbps"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();

  try {
    if (isEdit) {
      const { data: before } = await supabase
        .from("plans")
        .select("*")
        .eq("id", id as string)
        .single();

      const { data: after, error } = await supabase
        .from("plans")
        .update(parsed.data)
        .eq("id", id as string)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      await logActivity({
        adminId: admin.id,
        action: "updated",
        entityType: "plan",
        entityId: id as string,
        before,
        after,
      });
    } else {
      const { data: after, error } = await supabase
        .from("plans")
        .insert(parsed.data)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      await logActivity({
        adminId: admin.id,
        action: "created",
        entityType: "plan",
        entityId: after.id,
        before: null,
        after,
      });
    }

    revalidatePath("/plans");
    revalidatePath("/customers");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

export async function deletePlan(id: string): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  try {
    const supabase = await createClient();

    const { data: before } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("plans").delete().eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          error: "Can't delete — customers are still assigned to this plan.",
        };
      }
      return { success: false, error: error.message };
    }

    await logActivity({
      adminId: admin.id,
      action: "deleted",
      entityType: "plan",
      entityId: id,
      before,
      after: null,
    });

    revalidatePath("/plans");
    revalidatePath("/customers");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

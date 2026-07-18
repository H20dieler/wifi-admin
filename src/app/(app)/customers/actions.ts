"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { logActivity } from "@/lib/log-activity";
import { customerSchema } from "@/lib/validations/customer";

export type ActionState = {
  success: boolean;
  error: string | null;
};

function readPlanId(formData: FormData): string | null {
  const raw = formData.get("plan_id");
  if (!raw || raw === "none") return null;
  return String(raw);
}

function readOptional(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (raw === null) return null;
  const str = String(raw).trim();
  return str === "" ? null : str;
}

export async function saveCustomer(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  const id = formData.get("id");
  const isEdit = typeof id === "string" && id.length > 0;

  const parsed = customerSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: readOptional(formData, "phone"),
    address: readOptional(formData, "address"),
    plan_id: readPlanId(formData),
    billing_day: formData.get("billing_day"),
    status: formData.get("status"),
    start_date: readOptional(formData, "start_date"),
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
        .from("customers")
        .select("*")
        .eq("id", id as string)
        .single();

      const { data: after, error } = await supabase
        .from("customers")
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
        entityType: "customer",
        entityId: id as string,
        before,
        after,
      });
    } else {
      const { data: after, error } = await supabase
        .from("customers")
        .insert(parsed.data)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      await logActivity({
        adminId: admin.id,
        action: "created",
        entityType: "customer",
        entityId: after.id,
        before: null,
        after,
      });
    }

    revalidatePath("/customers");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  try {
    const supabase = await createClient();

    const { data: before } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      // 23503 = foreign_key_violation — this customer has payments and/or
      // documents pointing at them. Hard delete is correct for Day 5's
      // scope; Day 14 (soft-delete) is what actually needs to handle this
      // case long-term.
      if (error.code === "23503") {
        return {
          success: false,
          error:
            "Can't delete — this customer has payment or document history attached.",
        };
      }
      return { success: false, error: error.message };
    }

    await logActivity({
      adminId: admin.id,
      action: "deleted",
      entityType: "customer",
      entityId: id,
      before,
      after: null,
    });

    revalidatePath("/customers");
    return { success: true, error: null };
  } catch (err) {
    // A thrown (not returned) error — e.g. the network request to Supabase
    // failing outright — would otherwise surface as an unhandled rejection
    // and leave the confirm dialog stuck with no feedback.
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

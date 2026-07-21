"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { logActivity } from "@/lib/log-activity";
import { expenseSchema } from "@/lib/validations/expense";

export type ActionState = {
  success: boolean;
  error: string | null;
};

function readOptional(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (raw === null) return null;
  const str = String(raw).trim();
  return str === "" ? null : str;
}

async function requireOwner() {
  const admin = await getCurrentAdmin();
  if (admin?.role !== "owner") {
    return null;
  }
  return admin;
}

export async function saveExpense(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireOwner();
  if (!admin) {
    return { success: false, error: "Owners only." };
  }

  const id = formData.get("id");
  const isEdit = typeof id === "string" && id.length > 0;

  const parsed = expenseSchema.safeParse({
    category: formData.get("category"),
    description: readOptional(formData, "description"),
    amount: formData.get("amount"),
    expense_date: formData.get("expense_date"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const supabase = await createClient();

    if (isEdit) {
      const { data: before } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id as string)
        .single();

      const { data: after, error } = await supabase
        .from("expenses")
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
        entityType: "expense",
        entityId: id as string,
        before,
        after,
      });
    } else {
      const { data: after, error } = await supabase
        .from("expenses")
        .insert(parsed.data)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      await logActivity({
        adminId: admin.id,
        action: "created",
        entityType: "expense",
        entityId: after.id,
        before: null,
        after,
      });
    }

    revalidatePath("/expenses");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

export async function deleteExpense(id: string): Promise<ActionState> {
  const admin = await requireOwner();
  if (!admin) {
    return { success: false, error: "Owners only." };
  }

  try {
    const supabase = await createClient();

    const { data: before } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      adminId: admin.id,
      action: "deleted",
      entityType: "expense",
      entityId: id,
      before,
      after: null,
    });

    revalidatePath("/expenses");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

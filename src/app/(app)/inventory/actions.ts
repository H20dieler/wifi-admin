"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { logActivity } from "@/lib/log-activity";
import { inventoryItemSchema } from "@/lib/validations/inventory";

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

export async function saveInventoryItem(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  const id = formData.get("id");
  const isEdit = typeof id === "string" && id.length > 0;

  const parsed = inventoryItemSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
    low_stock_threshold: formData.get("low_stock_threshold"),
    category: readOptional(formData, "category"),
    unit_cost: readOptional(formData, "unit_cost"),
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
        .from("inventory_items")
        .select("*")
        .eq("id", id as string)
        .single();

      const { data: after, error } = await supabase
        .from("inventory_items")
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
        entityType: "inventory_item",
        entityId: id as string,
        before,
        after,
      });
    } else {
      const { data: after, error } = await supabase
        .from("inventory_items")
        .insert(parsed.data)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      await logActivity({
        adminId: admin.id,
        action: "created",
        entityType: "inventory_item",
        entityId: after.id,
        before: null,
        after,
      });
    }

    // "/" too -- the Day 9 dashboard's low-stock widget reads this same
    // table (see lib.customer-status.ts sibling note in payments/plans
    // actions: cross-page consumers need revalidating, not just the
    // page that was actually edited).
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

export async function deleteInventoryItem(id: string): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  try {
    const supabase = await createClient();

    const { data: before } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      adminId: admin.id,
      action: "deleted",
      entityType: "inventory_item",
      entityId: id,
      before,
      after: null,
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

/**
 * Dedicated action for the in-row +/- buttons -- deliberately not routed
 * through saveInventoryItem's full form/validation path, since this is a
 * one-field, trivially reversible nudge (no confirmation dialog, unlike
 * delete). Clamps at 0 server-side; the client also disables the "-"
 * button at 0, but that's only a UI courtesy, not the real guard.
 */
export async function adjustQuantity(
  id: string,
  delta: 1 | -1,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  try {
    const supabase = await createClient();

    const { data: before, error: fetchError } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !before) {
      return { success: false, error: "Item not found." };
    }

    const nextQuantity = Math.max(0, (before.quantity ?? 0) + delta);

    const { data: after, error } = await supabase
      .from("inventory_items")
      .update({ quantity: nextQuantity })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      adminId: admin.id,
      action: "updated",
      entityType: "inventory_item",
      entityId: id,
      before,
      after,
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

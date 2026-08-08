"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { logActivity } from "@/lib/log-activity";

export type ActionState = {
  success: boolean;
  error: string | null;
};

// Not exported: a "use server" file may only export async functions.
// The DocType *type* below is fine to export (types don't exist at
// runtime), but this array itself must stay local to this module.
const DOC_TYPES = ["valid_id", "proof_of_address"] as const;
export type DocType = (typeof DOC_TYPES)[number];

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

function sanitizeFilename(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "file";
}

export async function uploadDocument(
  customerId: string,
  docType: DocType,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  if (!DOC_TYPES.includes(docType)) {
    return { success: false, error: "Invalid document type." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided." };
  }
  if (file.size === 0) {
    return { success: false, error: "That file is empty." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { success: false, error: "Files must be 8MB or smaller." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Only images and PDFs are supported." };
  }

  // {customer_id}/{doc_type}/{filename}, per the brief. Timestamp-prefixed
  // so re-uploading a same-named file never collides with or silently
  // overwrites an earlier one -- delete is always explicit here, never
  // an implicit replace.
  const path = `${customerId}/${docType}/${Date.now()}-${sanitizeFilename(file.name)}`;

  try {
    const supabase = await createClient();

    const { error: uploadError } = await supabase.storage
      .from("customer-documents")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: after, error: insertError } = await supabase
      .from("customer_documents")
      .insert({ customer_id: customerId, doc_type: docType, storage_path: path })
      .select()
      .single();

    if (insertError) {
      // Roll back the now-orphaned storage object rather than leaving a
      // file with no DB row pointing at it.
      await supabase.storage.from("customer-documents").remove([path]);
      return { success: false, error: insertError.message };
    }

    await logActivity({
      adminId: admin.id,
      action: "created",
      entityType: "customer_document",
      entityId: after.id,
      before: null,
      after,
    });

    revalidatePath(`/customers/${customerId}`);
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

export async function deleteDocument(
  documentId: string,
  customerId: string,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  try {
    const supabase = await createClient();

    const { data: before, error: fetchError } = await supabase
      .from("customer_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !before) {
      return { success: false, error: "Document not found." };
    }

    // DB row goes first -- it's what the UI actually reads. If the
    // storage removal below fails, the result is an orphaned file (wasted
    // space, invisible to the app), not a row pointing at a missing file.
    const { error: deleteRowError } = await supabase
      .from("customer_documents")
      .delete()
      .eq("id", documentId);

    if (deleteRowError) {
      return { success: false, error: deleteRowError.message };
    }

    const { error: storageError } = await supabase.storage
      .from("customer-documents")
      .remove([before.storage_path]);
    if (storageError) {
      console.error(
        `Orphaned storage object after deleting customer_documents row ${documentId}:`,
        storageError.message,
      );
    }

    await logActivity({
      adminId: admin.id,
      action: "deleted",
      entityType: "customer_document",
      entityId: documentId,
      before,
      after: null,
    });

    revalidatePath(`/customers/${customerId}`);
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Delete failed.",
    };
  }
}

"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, FileText, X, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadDocument, deleteDocument, type DocType } from "./documents-actions";

export type DocumentItem = {
  id: string;
  doc_type: DocType;
  storage_path: string;
  uploaded_at: string;
  signedUrl: string | null;
};

const SECTION_LABEL: Record<DocType, string> = {
  valid_id: "Valid ID",
  proof_of_address: "Proof of Address",
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

function isImagePath(path: string): boolean {
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(path);
}

function displayFilename(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/^\d+-/, "");
}

export function CustomerDocuments({
  customerId,
  documents,
}: {
  customerId: string;
  documents: DocumentItem[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <DocumentSection
        customerId={customerId}
        docType="valid_id"
        documents={documents.filter((d) => d.doc_type === "valid_id")}
      />
      <DocumentSection
        customerId={customerId}
        docType="proof_of_address"
        documents={documents.filter((d) => d.doc_type === "proof_of_address")}
      />
    </div>
  );
}

function DocumentSection({
  customerId,
  docType,
  documents,
}: {
  customerId: string;
  docType: DocType;
  documents: DocumentItem[];
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadFiles(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files);
    if (list.length === 0) return;

    startTransition(async () => {
      const results = await Promise.all(
        list.map((file) => {
          const formData = new FormData();
          formData.set("file", file);
          return uploadDocument(customerId, docType, formData);
        }),
      );
      const firstError = results.find((r) => !r.success)?.error;
      if (firstError) setError(firstError);
    });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  function handleDelete(doc: DocumentItem) {
    setDeletingId(doc.id);
    startTransition(async () => {
      const result = await deleteDocument(doc.id, customerId);
      if (!result.success) {
        setError(result.error);
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 text-sm font-medium text-foreground">
        {SECTION_LABEL[docType]}
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-4 text-center transition-colors",
          isDragging
            ? "border-foreground/40 bg-muted"
            : "border-border hover:bg-muted/50",
        )}
      >
        <Upload className="size-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {isPending ? "Uploading…" : "Drop a file here, or click to choose"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {documents.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No documents uploaded yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2.5">
          {documents.map((doc) => (
            <li key={doc.id} className="group relative">
              <a
                href={doc.signedUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex size-20 items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
                  !doc.signedUrl && "pointer-events-none",
                )}
                title={displayFilename(doc.storage_path)}
              >
                {!doc.signedUrl ? (
                  <ImageOff className="size-5 text-muted-foreground" />
                ) : isImagePath(doc.storage_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URLs are short-lived and per-request; next/image's remote-pattern allowlist doesn't fit a URL that changes on every load.
                  <img
                    src={doc.signedUrl}
                    alt={displayFilename(doc.storage_path)}
                    className="size-full object-cover"
                  />
                ) : (
                  <FileText className="size-6 text-muted-foreground" />
                )}
              </a>
              <button
                type="button"
                onClick={() => handleDelete(doc)}
                disabled={isPending}
                aria-label={`Delete ${displayFilename(doc.storage_path)}`}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                {deletingId === doc.id ? (
                  <span className="size-2.5 animate-pulse rounded-full bg-destructive" />
                ) : (
                  <X className="size-3" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

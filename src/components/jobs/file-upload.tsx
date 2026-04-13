"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  FileText,
  Image,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AttachmentCategory } from "@/types";

interface Attachment {
  $id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: AttachmentCategory;
  $createdAt: string;
}

interface FileUploadProps {
  jobId: string;
  attachments: Attachment[];
  onUploadComplete?: () => void;
}

const categoryLabels: Record<AttachmentCategory, string> = {
  photo_before: "Before Photo",
  photo_after: "After Photo",
  permit: "Permit",
  drawing: "Drawing",
  document: "Document",
  other: "Other",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(type: string): boolean {
  return type.startsWith("image/");
}

export function FileUpload({
  jobId,
  attachments,
  onUploadComplete,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [category, setCategory] = useState<AttachmentCategory>("photo_before");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        try {
          const res = await fetch(`/api/jobs/${jobId}/attachments`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Upload failed");
          }
        } catch {
          alert("Upload failed");
        }
      }

      setUploading(false);
      onUploadComplete?.();
    },
    [jobId, category, onUploadComplete],
  );

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      const res = await fetch(
        `/api/jobs/${jobId}/attachments?attachment_id=${attachmentId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        onUploadComplete?.();
      }
    } catch {
      alert("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload],
  );

  const photos = attachments.filter((a) => isImageType(a.file_type));
  const documents = attachments.filter((a) => !isImageType(a.file_type));

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Upload Files
            </h3>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as AttachmentCategory)
              }
              className="h-8 rounded-lg border border-zinc-300 bg-white px-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
              dragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600",
            )}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            ) : (
              <Upload className="h-8 w-8 text-zinc-400" />
            )}
            <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {uploading
                ? "Uploading..."
                : "Drop files here or click to browse"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Images, PDFs, and documents up to 10MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleUpload(e.target.files);
                e.target.value = "";
              }
            }}
            className="hidden"
          />
        </div>
      </Card>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
            Photos ({photos.length})
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.$id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
              >
                <img
                  src={photo.file_url}
                  alt={photo.file_name}
                  className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
                  onClick={() => setPreviewUrl(photo.file_url)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="truncate rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
                    {categoryLabels[photo.category]}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.$id);
                    }}
                    disabled={deletingId === photo.$id}
                    className="rounded bg-red-500/80 p-1 text-white hover:bg-red-600"
                  >
                    {deletingId === photo.$id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents list */}
      {documents.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
            Documents ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.$id} padding={false}>
                <div className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <FileText className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {categoryLabels[doc.category]} •{" "}
                      {formatFileSize(doc.file_size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.$id)}
                      disabled={deletingId === doc.$id}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    >
                      {deletingId === doc.$id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {attachments.length === 0 && (
        <p className="text-center text-sm text-zinc-500">
          No files attached yet. Upload photos, permits, or documents above.
        </p>
      )}

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

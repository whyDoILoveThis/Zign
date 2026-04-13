import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, storage, DATABASE_ID, BUCKET_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite/server";
import { InputFile } from "node-appwrite/file";
import type { AttachmentCategory } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Upload a file attachment to a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;

  // Verify job exists
  try {
    await databases.getDocument(DATABASE_ID, COLLECTIONS.jobs, jobId);
  } catch {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as AttachmentCategory) || "other";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 }
    );
  }

  try {
    // Upload to Appwrite Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileId = ID.unique();

    const uploadedFile = await storage.createFile(
      BUCKET_ID,
      fileId,
      InputFile.fromBuffer(buffer, file.name)
    );

    // Build file view URL
    const fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

    // Save attachment record
    const attachment = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.job_attachments,
      ID.unique(),
      {
        job_id: jobId,
        uploaded_by: userId,
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        file_id: uploadedFile.$id,
        category,
      }
    );

    return NextResponse.json(attachment, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const { searchParams } = new URL(request.url);
  const attachmentId = searchParams.get("attachment_id");

  if (!attachmentId) {
    return NextResponse.json(
      { error: "attachment_id is required" },
      { status: 400 }
    );
  }

  try {
    // Find the attachment
    const attachment = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.job_attachments,
      attachmentId
    );

    if (attachment.job_id !== jobId) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete from Appwrite Storage if file_id is stored
    if (attachment.file_id) {
      try {
        await storage.deleteFile(BUCKET_ID, attachment.file_id);
      } catch {
        // File may already be deleted — continue
      }
    }

    // Delete the database record
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.job_attachments, attachmentId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete attachment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

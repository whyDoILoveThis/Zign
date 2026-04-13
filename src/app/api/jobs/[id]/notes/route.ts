import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, ID } from "@/lib/appwrite/server";

// Add a note to a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.job_notes,
      ID.unique(),
      {
        job_id: id,
        author_id: userId,
        content: content.trim(),
      }
    );

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

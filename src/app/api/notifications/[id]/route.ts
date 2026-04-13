import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";

// Mark a single notification as read
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify the notification belongs to this user
    const notification = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.notifications,
      id
    );

    if (notification.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.notifications,
      id,
      { read: "true" }
    );

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
}

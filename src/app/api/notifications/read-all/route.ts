import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

// Mark all notifications as read for current user
export async function PATCH() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.notifications,
      [
        Query.equal("user_id", userId),
        Query.equal("read", "false"),
        Query.limit(500),
      ]
    );

    await Promise.all(
      documents.map((doc) =>
        databases.updateDocument(DATABASE_ID, COLLECTIONS.notifications, doc.$id, {
          read: "true",
        })
      )
    );

    return NextResponse.json({ updated: documents.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

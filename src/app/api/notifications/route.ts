import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

// List notifications for current user
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

  try {
    const queries = [
      Query.equal("user_id", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ];

    if (unreadOnly) {
      queries.push(Query.equal("read", "false"));
    }

    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.notifications,
      queries
    );

    // Also get unread count
    const { total: unreadCount } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.notifications,
      [
        Query.equal("user_id", userId),
        Query.equal("read", "false"),
        Query.limit(1),
      ]
    );

    return NextResponse.json({ notifications: documents, unreadCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

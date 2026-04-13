import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

// Get all team members (admin/office only)
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check requester is admin or office
    const { documents: requesters } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.profiles,
      [Query.equal("clerk_id", userId), Query.limit(1)]
    );

    if (
      requesters.length === 0 ||
      !["admin", "office"].includes(requesters[0].role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.profiles,
      [Query.orderDesc("$createdAt"), Query.limit(100)]
    );

    return NextResponse.json(documents);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update a team member's role (admin only)
export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check requester is admin
    const { documents: requesters } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.profiles,
      [Query.equal("clerk_id", userId), Query.limit(1)]
    );

    if (requesters.length === 0 || requesters[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { profileId, role } = body;

    if (
      !profileId ||
      !role ||
      !["admin", "office", "installer"].includes(role)
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.profiles,
      profileId,
      { role }
    );

    // Sync role to Clerk publicMetadata (best-effort, don't fail the request)
    if (updated.clerk_id) {
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(updated.clerk_id, {
          publicMetadata: { role },
        });
      } catch (clerkErr) {
        console.error("Failed to sync role to Clerk:", clerkErr);
      }
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite/server";
import type { UserRole } from "@/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Single indexed lookup — fast at any scale
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.profiles,
      [Query.equal("clerk_id", userId), Query.limit(1)]
    );

    if (documents.length > 0) {
      return NextResponse.json(documents[0]);
    }

    // Profile doesn't exist — auto-provision from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    const role: UserRole =
      (user.publicMetadata?.role as UserRole) || "installer";

    const profile = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.profiles,
      ID.unique(),
      {
        clerk_id: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        role,
        phone: user.phoneNumbers[0]?.phoneNumber || null,
        avatar_url: user.imageUrl || null,
      }
    );

    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    console.error("Profile fetch/create failed:", err);
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
}

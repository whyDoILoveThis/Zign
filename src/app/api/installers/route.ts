import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

// Get all installers (for assignment dropdowns)
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.profiles,
      [Query.equal("role", "installer"), Query.orderAsc("first_name"), Query.limit(100)]
    );

    return NextResponse.json(documents);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

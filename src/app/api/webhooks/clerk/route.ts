import { NextRequest, NextResponse } from "next/server";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite/server";
import type { UserRole } from "@/types";

interface WebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    image_url?: string;
    phone_numbers?: { phone_number: string }[];
    public_metadata?: { role?: UserRole };
  };
}

export async function POST(request: NextRequest) {
  const headerSecret = request.headers.get("x-webhook-secret");
  const envSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (envSecret && headerSecret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event: WebhookEvent = await request.json();

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const {
        id,
        email_addresses,
        first_name,
        last_name,
        image_url,
        phone_numbers,
        public_metadata,
      } = event.data;
      const email = email_addresses?.[0]?.email_address || "";
      const phone = phone_numbers?.[0]?.phone_number || null;
      const role = public_metadata?.role || "installer";

      try {
        // Check if profile already exists
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.profiles,
          [Query.equal("clerk_id", id), Query.limit(1)]
        );

        const profileData = {
          clerk_id: id,
          email,
          first_name: first_name || "",
          last_name: last_name || "",
          role,
          phone,
          avatar_url: image_url || null,
        };

        if (documents.length > 0) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.profiles,
            documents[0].$id,
            profileData
          );
        } else {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.profiles,
            ID.unique(),
            profileData
          );
        }
      } catch (err) {
        console.error("Failed to sync profile:", err);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
      }
      break;
    }

    case "user.deleted": {
      const { id } = event.data;
      try {
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.profiles,
          [Query.equal("clerk_id", id), Query.limit(1)]
        );
        if (documents.length > 0) {
          await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.profiles,
            documents[0].$id
          );
        }
      } catch {
        // Ignore deletion errors
      }
      break;
    }
  }

  return NextResponse.json({ success: true });
}

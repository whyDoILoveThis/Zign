import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

// Get a single client
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.clients, id);
    return NextResponse.json(doc);
  } catch {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
}

// Update a client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Re-geocode if address changed
  if (body.address) {
    try {
      const { getMapsProvider } = await import("@/lib/maps");
      const maps = getMapsProvider();
      const fullAddress = [body.address, body.city, body.state, body.postal_code].filter(Boolean).join(", ");
      const results = await maps.geocode(fullAddress);
      if (results.length > 0) {
        body.lat = results[0].coordinates.lat;
        body.lng = results[0].coordinates.lng;
      }
    } catch {
      // Continue without geocoding
    }
  }

  try {
    const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.clients, id, body);
    return NextResponse.json(doc);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete a client
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if client has jobs
  try {
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.jobs,
      [Query.equal("client_id", id), Query.limit(1)]
    );

    if (documents.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete client with existing jobs" },
        { status: 409 }
      );
    }

    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.clients, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite/server";

// List all clients
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";

  try {
    const queries = [Query.orderAsc("name"), Query.limit(500)];

    if (search) {
      queries.push(Query.search("name", search));
    }

    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.clients,
      queries
    );

    // If searching, also filter by contact_name/address client-side for broader matching
    let results = documents;
    if (search && documents.length === 0) {
      const allDocs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.clients,
        [Query.orderAsc("name"), Query.limit(500)]
      );
      const lower = search.toLowerCase();
      results = allDocs.documents.filter(
        (d) =>
          d.name?.toLowerCase().includes(lower) ||
          d.contact_name?.toLowerCase().includes(lower) ||
          d.address?.toLowerCase().includes(lower)
      );
    }

    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch clients";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Create a new client
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin and office can create clients
  const { documents: profiles } = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.profiles,
    [Query.equal("clerk_id", userId), Query.limit(1)]
  );
  if (profiles.length === 0 || !['admin', 'office'].includes(profiles[0].role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, contact_name, email, phone, address, city, state, postal_code, notes } = body;

  if (!name || !address) {
    return NextResponse.json(
      { error: "Name and address are required" },
      { status: 400 }
    );
  }

  // Geocode address via our maps API
  let lat: number | null = null;
  let lng: number | null = null;
  try {
    const { getMapsProvider } = await import("@/lib/maps");
    const maps = getMapsProvider();
    const fullAddress = [address, city, state, postal_code].filter(Boolean).join(", ");
    const results = await maps.geocode(fullAddress);
    if (results.length > 0) {
      lat = results[0].coordinates.lat;
      lng = results[0].coordinates.lng;
    }
  } catch {
    // Geocoding is optional — continue without coordinates
  }

  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.clients,
      ID.unique(),
      {
        name,
        contact_name: contact_name || null,
        email: email || null,
        phone: phone || null,
        address,
        city: city || null,
        state: state || null,
        postal_code: postal_code || null,
        lat,
        lng,
        notes: notes || null,
      }
    );

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

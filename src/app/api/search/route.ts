import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  databases,
  DATABASE_ID,
  COLLECTIONS,
  Query,
} from "@/lib/appwrite/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ jobs: [], clients: [] });
  }

  const lower = q.toLowerCase();

  try {
    const [jobsResult, clientsResult, assignmentsResult, profilesResult] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.jobs, [
        Query.limit(500),
        Query.orderDesc("$createdAt"),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.clients, [
        Query.limit(500),
        Query.orderAsc("name"),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.job_assignments, [
        Query.limit(5000),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.profiles, [
        Query.limit(500),
      ]),
    ]);

    // Build lookup maps
    const clientMap = new Map(clientsResult.documents.map((c) => [c.$id, c]));
    const profileMap = new Map(profilesResult.documents.map((p) => [p.$id, p]));

    // Map job_id → installer names
    const jobInstallerNames = new Map<string, string[]>();
    for (const a of assignmentsResult.documents) {
      const profile = profileMap.get(a.installer_id);
      if (profile) {
        const names = jobInstallerNames.get(a.job_id) || [];
        names.push(`${profile.first_name} ${profile.last_name}`.toLowerCase());
        jobInstallerNames.set(a.job_id, names);
      }
    }

    const jobs = jobsResult.documents
      .filter((j) => {
        const client = clientMap.get(j.client_id);
        const installerNames = jobInstallerNames.get(j.$id) || [];
        return (
          j.title?.toLowerCase().includes(lower) ||
          j.address?.toLowerCase().includes(lower) ||
          j.description?.toLowerCase().includes(lower) ||
          client?.name?.toLowerCase().includes(lower) ||
          installerNames.some((name) => name.includes(lower))
        );
      })
      .slice(0, 5)
      .map((j) => {
        const client = clientMap.get(j.client_id);
        return {
          $id: j.$id,
          title: j.title,
          address: j.address,
          status: j.status,
          client_name: client?.name || null,
        };
      });

    const clients = clientsResult.documents
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(lower) ||
          c.contact_name?.toLowerCase().includes(lower) ||
          c.email?.toLowerCase().includes(lower),
      )
      .slice(0, 5)
      .map((c) => ({
        $id: c.$id,
        name: c.name,
        contact_name: c.contact_name,
      }));

    return NextResponse.json({ jobs, clients });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

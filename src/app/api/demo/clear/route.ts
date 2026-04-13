import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "@/lib/appwrite/server";

const BATCH_LIMIT = 100;

/** Fetch all documents from a collection matching the given queries, handling pagination. */
async function listAll(collection: string, queries: string[] = []) {
  const docs: { $id: string; [key: string]: unknown }[] = [];
  let cursor: string | undefined;

  while (true) {
    const q = [...queries, Query.limit(BATCH_LIMIT)];
    if (cursor) q.push(Query.cursorAfter(cursor));

    const res = await databases.listDocuments(DATABASE_ID, collection, q);
    docs.push(...(res.documents as typeof docs));

    if (res.documents.length < BATCH_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }

  return docs;
}

/** Delete every document returned by `listAll`. */
async function deleteAll(collection: string, queries: string[] = []) {
  const docs = await listAll(collection, queries);
  for (const doc of docs) {
    await databases.deleteDocument(DATABASE_ID, collection, doc.$id);
  }
  return docs.length;
}

// ── POST /api/demo/clear ─────────────────────────────────────────────────────

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Find demo profiles (clerk_id starts with "demo_")
    const demoProfiles = await listAll(COLLECTIONS.profiles, [
      Query.startsWith("clerk_id", "demo_"),
    ]);
    const demoProfileIds = new Set(demoProfiles.map((p) => p.$id));

    if (demoProfileIds.size === 0) {
      return NextResponse.json({
        message: "No demo data found",
        deleted: { profiles: 0, clients: 0, jobs: 0, assignments: 0, notes: 0, attachments: 0 },
      });
    }

    // 2. Find all jobs created by demo profiles
    const demoJobs: { $id: string; client_id?: unknown }[] = [];
    for (const profileId of demoProfileIds) {
      const jobs = await listAll(COLLECTIONS.jobs, [
        Query.equal("created_by", profileId),
      ]);
      demoJobs.push(...jobs);
    }
    const demoJobIds = demoJobs.map((j) => j.$id);

    // Collect unique client IDs referenced by demo jobs
    const demoClientIds = new Set<string>();
    for (const j of demoJobs) {
      if (typeof j.client_id === "string") demoClientIds.add(j.client_id);
    }

    // 3. Delete child records for each demo job
    let assignmentsDeleted = 0;
    let notesDeleted = 0;
    let attachmentsDeleted = 0;

    for (const jobId of demoJobIds) {
      assignmentsDeleted += await deleteAll(COLLECTIONS.job_assignments, [
        Query.equal("job_id", jobId),
      ]);
      notesDeleted += await deleteAll(COLLECTIONS.job_notes, [
        Query.equal("job_id", jobId),
      ]);
      attachmentsDeleted += await deleteAll(COLLECTIONS.job_attachments, [
        Query.equal("job_id", jobId),
      ]);
    }

    // 4. Delete demo jobs
    for (const jobId of demoJobIds) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.jobs, jobId);
    }

    // 5. Delete demo clients (only if they have no remaining jobs)
    let clientsDeleted = 0;
    for (const clientId of demoClientIds) {
      const remaining = await databases.listDocuments(DATABASE_ID, COLLECTIONS.jobs, [
        Query.equal("client_id", clientId),
        Query.limit(1),
      ]);
      if (remaining.total === 0) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.clients, clientId);
        clientsDeleted++;
      }
    }

    // 6. Delete demo profiles
    for (const profile of demoProfiles) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.profiles, profile.$id);
    }

    return NextResponse.json({
      message: "Demo data deleted successfully",
      deleted: {
        profiles: demoProfiles.length,
        clients: clientsDeleted,
        jobs: demoJobs.length,
        assignments: assignmentsDeleted,
        notes: notesDeleted,
        attachments: attachmentsDeleted,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear demo data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

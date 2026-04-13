import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite/server";
import { notifyInstallers } from "@/lib/notifications";

// List jobs with filtering
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const clientId = searchParams.get("client_id");
  const installerId = searchParams.get("installer_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const search = searchParams.get("search");

  try {
    const queries = [Query.orderAsc("scheduled_date"), Query.limit(500)];

    if (status) {
      queries.push(Query.equal("status", status));
    }
    if (clientId) {
      queries.push(Query.equal("client_id", clientId));
    }
    if (dateFrom) {
      queries.push(Query.greaterThanEqual("scheduled_date", dateFrom));
    }
    if (dateTo) {
      queries.push(Query.lessThanEqual("scheduled_date", dateTo));
    }
    if (search) {
      queries.push(Query.search("title", search));
    }

    const { documents: jobs } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.jobs,
      queries
    );

    // Fetch related clients and assignments in parallel
    const clientIds = [...new Set(jobs.map((j) => j.client_id).filter(Boolean))];
    const jobIds = jobs.map((j) => j.$id);

    const [clientsResult, assignmentsResult, profilesResult, attachmentsResult] = await Promise.all([
      clientIds.length > 0
        ? databases.listDocuments(DATABASE_ID, COLLECTIONS.clients, [
            Query.limit(500),
          ])
        : Promise.resolve({ documents: [] }),
      jobIds.length > 0
        ? databases.listDocuments(DATABASE_ID, COLLECTIONS.job_assignments, [
            Query.limit(5000),
          ])
        : Promise.resolve({ documents: [] }),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.profiles, [
        Query.equal("role", "installer"),
        Query.limit(500),
      ]),
      jobIds.length > 0
        ? databases.listDocuments(DATABASE_ID, COLLECTIONS.job_attachments, [
            Query.limit(5000),
          ])
        : Promise.resolve({ documents: [] }),
    ]);

    const clientMap = new Map(clientsResult.documents.map((c) => [c.$id, c]));
    const profileMap = new Map(profilesResult.documents.map((p) => [p.$id, p]));
    const assignmentsByJob = new Map<string, typeof assignmentsResult.documents>();
    for (const a of assignmentsResult.documents) {
      const existing = assignmentsByJob.get(a.job_id) || [];
      existing.push({ ...a, installer: profileMap.get(a.installer_id) || null });
      assignmentsByJob.set(a.job_id, existing);
    }
    const attachmentsByJob = new Map<string, typeof attachmentsResult.documents>();
    for (const a of attachmentsResult.documents) {
      const existing = attachmentsByJob.get(a.job_id) || [];
      existing.push(a);
      attachmentsByJob.set(a.job_id, existing);
    }

    let enrichedJobs = jobs.map((job) => ({
      ...job,
      clients: clientMap.get(job.client_id) || null,
      job_assignments: assignmentsByJob.get(job.$id) || [],
      attachments: attachmentsByJob.get(job.$id) || [],
    }));

    // If filtering by installer, filter in-memory
    if (installerId) {
      enrichedJobs = enrichedJobs.filter((job) =>
        job.job_assignments.some((a: Record<string, unknown>) => a.installer_id === installerId)
      );
    }

    // If search returned nothing (full-text not indexed), fallback to client-side filter
    if (search && enrichedJobs.length === 0) {
      const allJobsResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.jobs,
        [Query.orderAsc("scheduled_date"), Query.limit(500)]
      );
      const lower = search.toLowerCase();
      const filteredJobs = allJobsResult.documents.filter(
        (j) =>
          j.title?.toLowerCase().includes(lower) ||
          j.address?.toLowerCase().includes(lower)
      );
      enrichedJobs = filteredJobs.map((job) => ({
        ...job,
        clients: clientMap.get(job.client_id) || null,
        job_assignments: assignmentsByJob.get(job.$id) || [],
        attachments: attachmentsByJob.get(job.$id) || [],
      }));
    }

    return NextResponse.json(enrichedJobs);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Create a new job
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin and office can create jobs
  const { documents: profiles } = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.profiles,
    [Query.equal("clerk_id", userId), Query.limit(1)]
  );
  if (profiles.length === 0 || !['admin', 'office'].includes(profiles[0].role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    client_id,
    address,
    city,
    state,
    postal_code,
    scheduled_date,
    scheduled_time,
    estimated_duration_minutes,
    notes,
    installer_ids,
  } = body;

  if (!title || !client_id || !address) {
    return NextResponse.json(
      { error: "Title, client, and address are required" },
      { status: 400 }
    );
  }

  // Verify client exists
  try {
    await databases.getDocument(DATABASE_ID, COLLECTIONS.clients, client_id);
  } catch {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Geocode address
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
    // Continue without geocoding
  }

  try {
    // Create the job
    const job = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.jobs,
      ID.unique(),
      {
        title,
        description: description || null,
        client_id,
        address,
        city: city || null,
        state: state || null,
        postal_code: postal_code || null,
        lat,
        lng,
        status: "scheduled",
        scheduled_date: scheduled_date || null,
        scheduled_time: scheduled_time || null,
        estimated_duration_minutes: estimated_duration_minutes || null,
        notes: notes || null,
        created_by: userId,
      }
    );

    // Assign installers if provided
    if (installer_ids && installer_ids.length > 0) {
      await Promise.all(
        installer_ids.map((installerId: string) =>
          databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.job_assignments,
            ID.unique(),
            {
              job_id: job.$id,
              installer_id: installerId,
              assigned_by: userId,
            }
          )
        )
      );
    }

    // Notify assigned installers
    if (installer_ids && installer_ids.length > 0) {
      notifyInstallers({
        installerClerkIds: installer_ids,
        type: "job_assigned",
        title: "New Job Assignment",
        message: `You've been assigned to "${title}" at ${address}`,
        link: `/dashboard/jobs/${job.$id}`,
        jobId: job.$id,
      }).catch(() => {}); // fire-and-forget, don't block response
    }

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

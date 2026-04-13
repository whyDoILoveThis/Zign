import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite/server";
import { notifyInstallers } from "@/lib/notifications";

// Get a single job with full details
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
    const job = await databases.getDocument(DATABASE_ID, COLLECTIONS.jobs, id);

    // Fetch client, assignments, notes, attachments in parallel
    const [clientResult, assignmentsResult, notesResult, attachmentsResult] = await Promise.all([
      job.client_id
        ? databases.getDocument(DATABASE_ID, COLLECTIONS.clients, job.client_id).catch(() => null)
        : Promise.resolve(null),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.job_assignments, [
        Query.equal("job_id", id),
        Query.limit(100),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.job_notes, [
        Query.equal("job_id", id),
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.job_attachments, [
        Query.equal("job_id", id),
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ]),
    ]);

    const jobWithDetails = {
      ...job,
      clients: clientResult,
      assignments: assignmentsResult.documents,
      notes_list: notesResult.documents,
      attachments: attachmentsResult.documents,
    };

    return NextResponse.json(jobWithDetails);
  } catch {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
}

// Update a job
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
  const { installer_ids, ...jobData } = body;

  // Re-geocode if address changed
  if (jobData.address) {
    try {
      const { getMapsProvider } = await import("@/lib/maps");
      const maps = getMapsProvider();
      const fullAddress = [jobData.address, jobData.city, jobData.state, jobData.postal_code].filter(Boolean).join(", ");
      const results = await maps.geocode(fullAddress);
      if (results.length > 0) {
        jobData.lat = results[0].coordinates.lat;
        jobData.lng = results[0].coordinates.lng;
      }
    } catch {
      // Continue without geocoding
    }
  }

  // If completing the job, set completed_at
  if (jobData.status === "completed" && !jobData.completed_at) {
    jobData.completed_at = new Date().toISOString();
  }

  try {
    // Get current job state before updating (for change detection)
    const oldJob = await databases.getDocument(DATABASE_ID, COLLECTIONS.jobs, id);

    const job = await databases.updateDocument(DATABASE_ID, COLLECTIONS.jobs, id, jobData);

    // Get current assigned installers for notifications
    const { documents: currentAssignments } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.job_assignments,
      [Query.equal("job_id", id), Query.limit(100)]
    );
    const currentInstallerIds = currentAssignments.map((a) => a.installer_id);

    // Update installer assignments if provided
    if (installer_ids !== undefined) {
      // Remove existing assignments
      const { documents: existing } = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.job_assignments,
        [Query.equal("job_id", id), Query.limit(100)]
      );
      await Promise.all(
        existing.map((a) =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.job_assignments, a.$id)
        )
      );

      // Add new assignments
      if (installer_ids.length > 0) {
        await Promise.all(
          installer_ids.map((installerId: string) =>
            databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.job_assignments,
              ID.unique(),
              {
                job_id: id,
                installer_id: installerId,
                assigned_by: userId,
              }
            )
          )
        );
      }

      // Notify newly assigned installers
      const newInstallerIds = (installer_ids as string[]).filter(
        (iid) => !currentInstallerIds.includes(iid)
      );
      if (newInstallerIds.length > 0) {
        notifyInstallers({
          installerClerkIds: newInstallerIds,
          type: "job_assigned",
          title: "New Job Assignment",
          message: `You've been assigned to "${job.title}" at ${job.address}`,
          link: `/dashboard/jobs/${id}`,
          jobId: id,
        }).catch(() => {});
      }
    }

    // Notify on status change
    if (jobData.status && jobData.status !== oldJob.status) {
      const notifyIds = installer_ids !== undefined
        ? (installer_ids as string[])
        : currentInstallerIds;
      if (notifyIds.length > 0) {
        notifyInstallers({
          installerClerkIds: notifyIds,
          type: "job_status_changed",
          title: "Job Status Updated",
          message: `"${job.title}" status changed to ${jobData.status.replace(/_/g, " ")}`,
          link: `/dashboard/jobs/${id}`,
          jobId: id,
        }).catch(() => {});
      }
    }

    return NextResponse.json(job);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete a job
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check user has admin/office role
  try {
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.profiles,
      [Query.equal("clerk_id", userId), Query.limit(1)]
    );

    const profile = documents[0];
    if (!profile || !["admin", "office"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.jobs, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

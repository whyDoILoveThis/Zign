import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { databases, DATABASE_ID, COLLECTIONS, ID } from "@/lib/appwrite/server";

// ── Helpers ──────────────────────────────────────────────────────────────────

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

async function create(collection: string, data: Record<string, unknown>) {
  return databases.createDocument(DATABASE_ID, collection, ID.unique(), data);
}

// ── POST /api/demo/seed ──────────────────────────────────────────────────────

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // ── Profiles ─────────────────────────────────────────────────────────────
    const profilesData = [
      { clerk_id: "demo_admin_001", email: "admin@zign.demo", first_name: "Jordan", last_name: "Rivera", role: "admin", phone: "+1-555-0100", avatar_url: null },
      { clerk_id: "demo_office_001", email: "sarah@zign.demo", first_name: "Sarah", last_name: "Chen", role: "office", phone: "+1-555-0101", avatar_url: null },
      { clerk_id: "demo_installer_001", email: "marcus@zign.demo", first_name: "Marcus", last_name: "Thompson", role: "installer", phone: "+1-555-0102", avatar_url: null },
      { clerk_id: "demo_installer_002", email: "elena@zign.demo", first_name: "Elena", last_name: "Vazquez", role: "installer", phone: "+1-555-0103", avatar_url: null },
      { clerk_id: "demo_installer_003", email: "david@zign.demo", first_name: "David", last_name: "Park", role: "installer", phone: "+1-555-0104", avatar_url: null },
    ];

    const profiles = [];
    for (const p of profilesData) {
      profiles.push(await create(COLLECTIONS.profiles, p));
    }

    // ── Clients ──────────────────────────────────────────────────────────────
    const clientsData = [
      { name: "Metro Mall Group", contact_name: "Patricia Wells", email: "pwells@metromall.com", phone: "+1-555-0200", address: "1200 Commerce Blvd", city: "Austin", state: "TX", postal_code: "78701", lat: 30.2672, lng: -97.7431, notes: "Preferred client — 3-year contract for all mall locations." },
      { name: "Sunrise Medical Center", contact_name: "Dr. Robert Huang", email: "facilities@sunrisemc.org", phone: "+1-555-0201", address: "4500 Health Parkway", city: "Austin", state: "TX", postal_code: "78745", lat: 30.2082, lng: -97.7694, notes: "Hospital campus — must check in with security before starting work." },
      { name: "Lone Star Brewing Co.", contact_name: "Jake Morrison", email: "jake@lonestarbrewing.com", phone: "+1-555-0202", address: "820 East 6th Street", city: "Austin", state: "TX", postal_code: "78702", lat: 30.2659, lng: -97.7278, notes: "New taproom opening — needs full exterior signage package." },
      { name: "Hill Country Realty", contact_name: "Amanda Foster", email: "amanda@hillcountryrealty.com", phone: "+1-555-0203", address: "9600 Research Blvd", city: "Austin", state: "TX", postal_code: "78759", lat: 30.3916, lng: -97.7479, notes: null },
      { name: "Austin ISD — Facilities", contact_name: "Carlos Mendez", email: "cmendez@austinisd.org", phone: "+1-555-0204", address: "1111 W 6th Street", city: "Austin", state: "TX", postal_code: "78703", lat: 30.2717, lng: -97.7558, notes: "School installations must be done on weekends or after 5pm." },
    ];

    const clients = [];
    for (const c of clientsData) {
      clients.push(await create(COLLECTIONS.clients, c));
    }

    // ── Jobs ─────────────────────────────────────────────────────────────────
    const jobsData = [
      { title: "Main Entrance Channel Letters", description: "Install illuminated channel letter signage above the main entrance. Includes electrical hookup.", client_id: clients[0].$id, address: "1200 Commerce Blvd", city: "Austin", state: "TX", postal_code: "78701", lat: 30.2672, lng: -97.7431, status: "completed", scheduled_date: pastDate(5), scheduled_time: "08:00", estimated_duration_minutes: 240, completed_at: pastDate(5) + "T16:30:00.000Z", notes: "Completed ahead of schedule. Client very happy with the results.", created_by: profiles[0].$id },
      { title: "Emergency Room Wayfinding Signs", description: "Replace 12 interior wayfinding signs in the ER wing. ADA compliant with braille.", client_id: clients[1].$id, address: "4500 Health Parkway", city: "Austin", state: "TX", postal_code: "78745", lat: 30.2082, lng: -97.7694, status: "in_progress", scheduled_date: today, scheduled_time: "07:00", estimated_duration_minutes: 360, completed_at: null, notes: "6 of 12 signs installed so far. Continuing tomorrow morning.", created_by: profiles[0].$id },
      { title: "Taproom Exterior Blade Sign", description: "Mount double-sided projecting blade sign on east-facing wall. Requires boom lift.", client_id: clients[2].$id, address: "820 East 6th Street", city: "Austin", state: "TX", postal_code: "78702", lat: 30.2659, lng: -97.7278, status: "scheduled", scheduled_date: futureDate(2), scheduled_time: "09:00", estimated_duration_minutes: 180, completed_at: null, notes: "Boom lift rental confirmed. Permit on file.", created_by: profiles[1].$id },
      { title: "Window Vinyl Graphics — Taproom", description: "Apply frosted vinyl graphics to 4 front-facing windows with brewery branding.", client_id: clients[2].$id, address: "820 East 6th Street", city: "Austin", state: "TX", postal_code: "78702", lat: 30.2659, lng: -97.7278, status: "scheduled", scheduled_date: futureDate(3), scheduled_time: "10:00", estimated_duration_minutes: 120, completed_at: null, notes: null, created_by: profiles[1].$id },
      { title: "Office Park Monument Sign", description: "Install new illuminated monument sign at property entrance. Concrete base already poured.", client_id: clients[3].$id, address: "9600 Research Blvd", city: "Austin", state: "TX", postal_code: "78759", lat: 30.3916, lng: -97.7479, status: "scheduled", scheduled_date: futureDate(7), scheduled_time: "07:30", estimated_duration_minutes: 300, completed_at: null, notes: "Heavy sign — need at least 3 installers on site.", created_by: profiles[0].$id },
      { title: "School Marquee LED Conversion", description: "Convert existing marquee sign from fluorescent to LED panel. Keep existing cabinet frame.", client_id: clients[4].$id, address: "1111 W 6th Street", city: "Austin", state: "TX", postal_code: "78703", lat: 30.2717, lng: -97.7558, status: "on_hold", scheduled_date: futureDate(14), scheduled_time: "17:30", estimated_duration_minutes: 240, completed_at: null, notes: "On hold — waiting for LED panel to ship from manufacturer. ETA 10 days.", created_by: profiles[0].$id },
      { title: "Parking Garage Directional Signs", description: "Install 8 directional arrow signs in parking structure levels 1-4.", client_id: clients[0].$id, address: "1200 Commerce Blvd", city: "Austin", state: "TX", postal_code: "78701", lat: 30.2672, lng: -97.7431, status: "completed", scheduled_date: pastDate(12), scheduled_time: "06:00", estimated_duration_minutes: 180, completed_at: pastDate(12) + "T11:00:00.000Z", notes: null, created_by: profiles[1].$id },
      { title: "Suite Number Plaques — Building C", description: "Install brushed aluminum suite number plaques for 20 office suites in Building C.", client_id: clients[3].$id, address: "9600 Research Blvd", city: "Austin", state: "TX", postal_code: "78759", lat: 30.3916, lng: -97.7479, status: "scheduled", scheduled_date: futureDate(5), scheduled_time: "08:00", estimated_duration_minutes: 150, completed_at: null, notes: "All plaques ready in warehouse. Pre-drill holes to avoid noise complaints.", created_by: profiles[1].$id },
    ];

    const jobs = [];
    for (const j of jobsData) {
      jobs.push(await create(COLLECTIONS.jobs, j));
    }

    // ── Assignments ──────────────────────────────────────────────────────────
    const installers = profiles.filter((p) => p.role === "installer");
    const assignmentsData = [
      { job_id: jobs[0].$id, installer_id: installers[0].$id, assigned_by: profiles[0].$id },
      { job_id: jobs[0].$id, installer_id: installers[1].$id, assigned_by: profiles[0].$id },
      { job_id: jobs[1].$id, installer_id: installers[1].$id, assigned_by: profiles[0].$id },
      { job_id: jobs[2].$id, installer_id: installers[0].$id, assigned_by: profiles[1].$id },
      { job_id: jobs[3].$id, installer_id: installers[2].$id, assigned_by: profiles[1].$id },
      { job_id: jobs[4].$id, installer_id: installers[0].$id, assigned_by: profiles[0].$id },
      { job_id: jobs[4].$id, installer_id: installers[1].$id, assigned_by: profiles[0].$id },
      { job_id: jobs[4].$id, installer_id: installers[2].$id, assigned_by: profiles[0].$id },
      { job_id: jobs[5].$id, installer_id: installers[0].$id, assigned_by: profiles[0].$id },
      { job_id: jobs[6].$id, installer_id: installers[2].$id, assigned_by: profiles[1].$id },
      { job_id: jobs[7].$id, installer_id: installers[1].$id, assigned_by: profiles[1].$id },
      { job_id: jobs[7].$id, installer_id: installers[2].$id, assigned_by: profiles[1].$id },
    ];

    for (const a of assignmentsData) {
      await create(COLLECTIONS.job_assignments, a);
    }

    // ── Notes ────────────────────────────────────────────────────────────────
    const notesData = [
      { job_id: jobs[0].$id, author_id: installers[0].$id, content: "Arrived on site. Running conduit from electrical panel now." },
      { job_id: jobs[0].$id, author_id: installers[1].$id, content: "Letters mounted and wired. Testing illumination before final sign-off." },
      { job_id: jobs[0].$id, author_id: installers[0].$id, content: "All letters illuminate correctly. Client signed off. Job complete." },
      { job_id: jobs[1].$id, author_id: installers[1].$id, content: "Started removal of old signs in ER wing. Some wall damage — will need touch-up paint." },
      { job_id: jobs[1].$id, author_id: installers[1].$id, content: "6 of 12 signs installed. Had to stop at 3pm — hospital restricted access for shift change." },
      { job_id: jobs[1].$id, author_id: profiles[0].$id, content: "Hospital confirmed we can continue tomorrow at 7am. Check in at security desk B." },
      { job_id: jobs[2].$id, author_id: profiles[1].$id, content: "Boom lift reserved with Austin Equipment Rentals. Delivery confirmed for 8am day of install." },
      { job_id: jobs[4].$id, author_id: profiles[0].$id, content: "Concrete base passed inspection. We're clear to proceed on the scheduled date." },
      { job_id: jobs[4].$id, author_id: installers[0].$id, content: "Pre-checked the sign in warehouse — all panels and hardware accounted for." },
      { job_id: jobs[5].$id, author_id: profiles[1].$id, content: "LED panel shipped from manufacturer — tracking number: 1Z999AA10123456784. ETA ~10 days." },
      { job_id: jobs[5].$id, author_id: profiles[0].$id, content: "Putting this on hold until the LED panel arrives. Will reschedule once we have it." },
      { job_id: jobs[6].$id, author_id: installers[2].$id, content: "All 8 directional signs installed. Had to use concrete anchors on level 3 — different wall material." },
    ];

    for (const n of notesData) {
      await create(COLLECTIONS.job_notes, n);
    }

    // ── Attachments (metadata only) ──────────────────────────────────────────
    const attachmentsData = [
      { job_id: jobs[0].$id, uploaded_by: installers[0].$id, file_name: "channel-letters-before.jpg", file_url: "https://placehold.co/800x600/eee/999?text=Before+Photo", file_type: "image/jpeg", file_size: 245000, file_id: "demo_file_001", category: "photo_before" },
      { job_id: jobs[0].$id, uploaded_by: installers[1].$id, file_name: "channel-letters-after.jpg", file_url: "https://placehold.co/800x600/eee/999?text=After+Photo", file_type: "image/jpeg", file_size: 310000, file_id: "demo_file_002", category: "photo_after" },
      { job_id: jobs[0].$id, uploaded_by: profiles[1].$id, file_name: "metro-mall-permit-2026.pdf", file_url: "https://placehold.co/800x600/eee/999?text=Permit+PDF", file_type: "application/pdf", file_size: 89000, file_id: "demo_file_003", category: "permit" },
      { job_id: jobs[1].$id, uploaded_by: installers[1].$id, file_name: "er-wing-progress.jpg", file_url: "https://placehold.co/800x600/eee/999?text=In+Progress", file_type: "image/jpeg", file_size: 198000, file_id: "demo_file_004", category: "photo_before" },
      { job_id: jobs[1].$id, uploaded_by: profiles[1].$id, file_name: "wayfinding-layout-drawing.pdf", file_url: "https://placehold.co/800x600/eee/999?text=Drawing", file_type: "application/pdf", file_size: 420000, file_id: "demo_file_005", category: "drawing" },
      { job_id: jobs[2].$id, uploaded_by: profiles[1].$id, file_name: "blade-sign-design-proof.pdf", file_url: "https://placehold.co/800x600/eee/999?text=Design+Proof", file_type: "application/pdf", file_size: 156000, file_id: "demo_file_006", category: "drawing" },
      { job_id: jobs[2].$id, uploaded_by: profiles[0].$id, file_name: "city-sign-permit-6th-st.pdf", file_url: "https://placehold.co/800x600/eee/999?text=Permit", file_type: "application/pdf", file_size: 72000, file_id: "demo_file_007", category: "permit" },
      { job_id: jobs[6].$id, uploaded_by: installers[2].$id, file_name: "garage-level1-complete.jpg", file_url: "https://placehold.co/800x600/eee/999?text=Garage+L1", file_type: "image/jpeg", file_size: 275000, file_id: "demo_file_008", category: "photo_after" },
      { job_id: jobs[6].$id, uploaded_by: installers[2].$id, file_name: "garage-level3-anchors.jpg", file_url: "https://placehold.co/800x600/eee/999?text=Garage+L3", file_type: "image/jpeg", file_size: 188000, file_id: "demo_file_009", category: "photo_after" },
    ];

    for (const a of attachmentsData) {
      await create(COLLECTIONS.job_attachments, a);
    }

    return NextResponse.json({
      message: "Demo data loaded successfully",
      counts: {
        profiles: profiles.length,
        clients: clients.length,
        jobs: jobs.length,
        assignments: assignmentsData.length,
        notes: notesData.length,
        attachments: attachmentsData.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to seed demo data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Seed script — populates Appwrite with demo data for Zign.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Reads APPWRITE_* vars from .env.local automatically.
 */

import { Client, Databases, ID, Query } from "node-appwrite";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const ENDPOINT = env.APPWRITE_ENDPOINT;
const PROJECT_ID = env.APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const DATABASE_ID = env.APPWRITE_DATABASE_ID;

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error("Missing required APPWRITE_* env vars in .env.local");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);

const COLLECTIONS = {
  profiles: env.APPWRITE_COLLECTION_PROFILES || "profiles",
  clients: env.APPWRITE_COLLECTION_CLIENTS || "clients",
  jobs: env.APPWRITE_COLLECTION_JOBS || "jobs",
  job_assignments: env.APPWRITE_COLLECTION_JOB_ASSIGNMENTS || "job_assignments",
  job_notes: env.APPWRITE_COLLECTION_JOB_NOTES || "job_notes",
  job_attachments: env.APPWRITE_COLLECTION_JOB_ATTACHMENTS || "job_attachments",
};

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

const today = new Date().toISOString().split("T")[0];

async function create(collection: string, data: Record<string, unknown>) {
  return db.createDocument(DATABASE_ID, collection, ID.unique(), data);
}

// ── Seed Data ────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Seeding Appwrite database...\n");

  // ── Profiles ───────────────────────────────────────────────────────────────
  console.log("  Creating profiles...");
  const profilesData = [
    {
      clerk_id: "demo_admin_001",
      email: "admin@zign.demo",
      first_name: "Jordan",
      last_name: "Rivera",
      role: "admin",
      phone: "+1-555-0100",
      avatar_url: null,
    },
    {
      clerk_id: "demo_office_001",
      email: "sarah@zign.demo",
      first_name: "Sarah",
      last_name: "Chen",
      role: "office",
      phone: "+1-555-0101",
      avatar_url: null,
    },
    {
      clerk_id: "demo_installer_001",
      email: "marcus@zign.demo",
      first_name: "Marcus",
      last_name: "Thompson",
      role: "installer",
      phone: "+1-555-0102",
      avatar_url: null,
    },
    {
      clerk_id: "demo_installer_002",
      email: "elena@zign.demo",
      first_name: "Elena",
      last_name: "Vazquez",
      role: "installer",
      phone: "+1-555-0103",
      avatar_url: null,
    },
    {
      clerk_id: "demo_installer_003",
      email: "david@zign.demo",
      first_name: "David",
      last_name: "Park",
      role: "installer",
      phone: "+1-555-0104",
      avatar_url: null,
    },
  ];

  const profiles = [];
  for (const p of profilesData) {
    const doc = await create(COLLECTIONS.profiles, p);
    profiles.push(doc);
    console.log(`    ✓ ${p.first_name} ${p.last_name} (${p.role})`);
  }

  // ── Clients ────────────────────────────────────────────────────────────────
  console.log("\n  Creating clients...");
  const clientsData = [
    {
      name: "Metro Mall Group",
      contact_name: "Patricia Wells",
      email: "pwells@metromall.com",
      phone: "+1-555-0200",
      address: "1200 Commerce Blvd",
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      lat: 30.2672,
      lng: -97.7431,
      notes: "Preferred client — 3-year contract for all mall locations.",
    },
    {
      name: "Sunrise Medical Center",
      contact_name: "Dr. Robert Huang",
      email: "facilities@sunrisemc.org",
      phone: "+1-555-0201",
      address: "4500 Health Parkway",
      city: "Austin",
      state: "TX",
      postal_code: "78745",
      lat: 30.2082,
      lng: -97.7694,
      notes: "Hospital campus — must check in with security before starting work.",
    },
    {
      name: "Lone Star Brewing Co.",
      contact_name: "Jake Morrison",
      email: "jake@lonestarbrewing.com",
      phone: "+1-555-0202",
      address: "820 East 6th Street",
      city: "Austin",
      state: "TX",
      postal_code: "78702",
      lat: 30.2659,
      lng: -97.7278,
      notes: "New taproom opening — needs full exterior signage package.",
    },
    {
      name: "Hill Country Realty",
      contact_name: "Amanda Foster",
      email: "amanda@hillcountryrealty.com",
      phone: "+1-555-0203",
      address: "9600 Research Blvd",
      city: "Austin",
      state: "TX",
      postal_code: "78759",
      lat: 30.3916,
      lng: -97.7479,
      notes: null,
    },
    {
      name: "Austin ISD — Facilities",
      contact_name: "Carlos Mendez",
      email: "cmendez@austinisd.org",
      phone: "+1-555-0204",
      address: "1111 W 6th Street",
      city: "Austin",
      state: "TX",
      postal_code: "78703",
      lat: 30.2717,
      lng: -97.7558,
      notes: "School installations must be done on weekends or after 5pm.",
    },
  ];

  const clients = [];
  for (const c of clientsData) {
    const doc = await create(COLLECTIONS.clients, c);
    clients.push(doc);
    console.log(`    ✓ ${c.name}`);
  }

  // ── Jobs ───────────────────────────────────────────────────────────────────
  console.log("\n  Creating jobs...");
  const jobsData = [
    {
      title: "Main Entrance Channel Letters",
      description: "Install illuminated channel letter signage above the main entrance. Includes electrical hookup.",
      client_id: clients[0].$id,
      address: "1200 Commerce Blvd",
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      lat: 30.2672,
      lng: -97.7431,
      status: "completed",
      scheduled_date: pastDate(5),
      scheduled_time: "08:00",
      estimated_duration_minutes: 240,
      completed_at: pastDate(5) + "T16:30:00.000Z",
      notes: "Completed ahead of schedule. Client very happy with the results.",
      created_by: profiles[0].$id,
    },
    {
      title: "Emergency Room Wayfinding Signs",
      description: "Replace 12 interior wayfinding signs in the ER wing. ADA compliant with braille.",
      client_id: clients[1].$id,
      address: "4500 Health Parkway",
      city: "Austin",
      state: "TX",
      postal_code: "78745",
      lat: 30.2082,
      lng: -97.7694,
      status: "in_progress",
      scheduled_date: today,
      scheduled_time: "07:00",
      estimated_duration_minutes: 360,
      completed_at: null,
      notes: "6 of 12 signs installed so far. Continuing tomorrow morning.",
      created_by: profiles[0].$id,
    },
    {
      title: "Taproom Exterior Blade Sign",
      description: "Mount double-sided projecting blade sign on east-facing wall. Requires boom lift.",
      client_id: clients[2].$id,
      address: "820 East 6th Street",
      city: "Austin",
      state: "TX",
      postal_code: "78702",
      lat: 30.2659,
      lng: -97.7278,
      status: "scheduled",
      scheduled_date: futureDate(2),
      scheduled_time: "09:00",
      estimated_duration_minutes: 180,
      completed_at: null,
      notes: "Boom lift rental confirmed. Permit on file.",
      created_by: profiles[1].$id,
    },
    {
      title: "Window Vinyl Graphics — Taproom",
      description: "Apply frosted vinyl graphics to 4 front-facing windows with brewery branding.",
      client_id: clients[2].$id,
      address: "820 East 6th Street",
      city: "Austin",
      state: "TX",
      postal_code: "78702",
      lat: 30.2659,
      lng: -97.7278,
      status: "scheduled",
      scheduled_date: futureDate(3),
      scheduled_time: "10:00",
      estimated_duration_minutes: 120,
      completed_at: null,
      notes: null,
      created_by: profiles[1].$id,
    },
    {
      title: "Office Park Monument Sign",
      description: "Install new illuminated monument sign at property entrance. Concrete base already poured.",
      client_id: clients[3].$id,
      address: "9600 Research Blvd",
      city: "Austin",
      state: "TX",
      postal_code: "78759",
      lat: 30.3916,
      lng: -97.7479,
      status: "scheduled",
      scheduled_date: futureDate(7),
      scheduled_time: "07:30",
      estimated_duration_minutes: 300,
      completed_at: null,
      notes: "Heavy sign — need at least 3 installers on site.",
      created_by: profiles[0].$id,
    },
    {
      title: "School Marquee LED Conversion",
      description: "Convert existing marquee sign from fluorescent to LED panel. Keep existing cabinet frame.",
      client_id: clients[4].$id,
      address: "1111 W 6th Street",
      city: "Austin",
      state: "TX",
      postal_code: "78703",
      lat: 30.2717,
      lng: -97.7558,
      status: "on_hold",
      scheduled_date: futureDate(14),
      scheduled_time: "17:30",
      estimated_duration_minutes: 240,
      completed_at: null,
      notes: "On hold — waiting for LED panel to ship from manufacturer. ETA 10 days.",
      created_by: profiles[0].$id,
    },
    {
      title: "Parking Garage Directional Signs",
      description: "Install 8 directional arrow signs in parking structure levels 1-4.",
      client_id: clients[0].$id,
      address: "1200 Commerce Blvd",
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      lat: 30.2672,
      lng: -97.7431,
      status: "completed",
      scheduled_date: pastDate(12),
      scheduled_time: "06:00",
      estimated_duration_minutes: 180,
      completed_at: pastDate(12) + "T11:00:00.000Z",
      notes: null,
      created_by: profiles[1].$id,
    },
    {
      title: "Suite Number Plaques — Building C",
      description: "Install brushed aluminum suite number plaques for 20 office suites in Building C.",
      client_id: clients[3].$id,
      address: "9600 Research Blvd",
      city: "Austin",
      state: "TX",
      postal_code: "78759",
      lat: 30.3916,
      lng: -97.7479,
      status: "scheduled",
      scheduled_date: futureDate(5),
      scheduled_time: "08:00",
      estimated_duration_minutes: 150,
      completed_at: null,
      notes: "All plaques ready in warehouse. Pre-drill holes to avoid noise complaints.",
      created_by: profiles[1].$id,
    },
  ];

  const jobs = [];
  for (const j of jobsData) {
    const doc = await create(COLLECTIONS.jobs, j);
    jobs.push(doc);
    console.log(`    ✓ ${j.title} [${j.status}]`);
  }

  // ── Job Assignments ────────────────────────────────────────────────────────
  console.log("\n  Creating job assignments...");
  const installers = profiles.filter((p) => p.role === "installer"); // indices 2,3,4
  const assignmentsData = [
    // Completed: channel letters — Marcus & Elena
    { job_id: jobs[0].$id, installer_id: installers[0].$id, assigned_by: profiles[0].$id },
    { job_id: jobs[0].$id, installer_id: installers[1].$id, assigned_by: profiles[0].$id },
    // In progress: ER signs — Elena
    { job_id: jobs[1].$id, installer_id: installers[1].$id, assigned_by: profiles[0].$id },
    // Scheduled: blade sign — Marcus
    { job_id: jobs[2].$id, installer_id: installers[0].$id, assigned_by: profiles[1].$id },
    // Scheduled: window vinyl — David
    { job_id: jobs[3].$id, installer_id: installers[2].$id, assigned_by: profiles[1].$id },
    // Scheduled: monument sign — all three
    { job_id: jobs[4].$id, installer_id: installers[0].$id, assigned_by: profiles[0].$id },
    { job_id: jobs[4].$id, installer_id: installers[1].$id, assigned_by: profiles[0].$id },
    { job_id: jobs[4].$id, installer_id: installers[2].$id, assigned_by: profiles[0].$id },
    // On hold: school marquee — Marcus
    { job_id: jobs[5].$id, installer_id: installers[0].$id, assigned_by: profiles[0].$id },
    // Completed: parking signs — David
    { job_id: jobs[6].$id, installer_id: installers[2].$id, assigned_by: profiles[1].$id },
    // Scheduled: suite plaques — Elena & David
    { job_id: jobs[7].$id, installer_id: installers[1].$id, assigned_by: profiles[1].$id },
    { job_id: jobs[7].$id, installer_id: installers[2].$id, assigned_by: profiles[1].$id },
  ];

  for (const a of assignmentsData) {
    await create(COLLECTIONS.job_assignments, a);
  }
  console.log(`    ✓ ${assignmentsData.length} assignments created`);

  // ── Job Notes ──────────────────────────────────────────────────────────────
  console.log("\n  Creating job notes...");
  const notesData = [
    // Completed channel letters
    { job_id: jobs[0].$id, author_id: installers[0].$id, content: "Arrived on site. Running conduit from electrical panel now." },
    { job_id: jobs[0].$id, author_id: installers[1].$id, content: "Letters mounted and wired. Testing illumination before final sign-off." },
    { job_id: jobs[0].$id, author_id: installers[0].$id, content: "All letters illuminate correctly. Client signed off. Job complete." },

    // In progress ER signs
    { job_id: jobs[1].$id, author_id: installers[1].$id, content: "Started removal of old signs in ER wing. Some wall damage — will need touch-up paint." },
    { job_id: jobs[1].$id, author_id: installers[1].$id, content: "6 of 12 signs installed. Had to stop at 3pm — hospital restricted access for shift change." },
    { job_id: jobs[1].$id, author_id: profiles[0].$id, content: "Hospital confirmed we can continue tomorrow at 7am. Check in at security desk B." },

    // Blade sign
    { job_id: jobs[2].$id, author_id: profiles[1].$id, content: "Boom lift reserved with Austin Equipment Rentals. Delivery confirmed for 8am day of install." },

    // Monument sign
    { job_id: jobs[4].$id, author_id: profiles[0].$id, content: "Concrete base passed inspection. We're clear to proceed on the scheduled date." },
    { job_id: jobs[4].$id, author_id: installers[0].$id, content: "Pre-checked the sign in warehouse — all panels and hardware accounted for." },

    // School marquee
    { job_id: jobs[5].$id, author_id: profiles[1].$id, content: "LED panel shipped from manufacturer — tracking number: 1Z999AA10123456784. ETA ~10 days." },
    { job_id: jobs[5].$id, author_id: profiles[0].$id, content: "Putting this on hold until the LED panel arrives. Will reschedule once we have it." },

    // Completed parking garage
    { job_id: jobs[6].$id, author_id: installers[2].$id, content: "All 8 directional signs installed. Had to use concrete anchors on level 3 — different wall material." },
  ];

  for (const n of notesData) {
    await create(COLLECTIONS.job_notes, n);
  }
  console.log(`    ✓ ${notesData.length} notes created`);

  // ── Job Attachments (metadata only — no actual files) ──────────────────────
  console.log("\n  Creating attachment records...");
  const attachmentsData = [
    // Completed channel letters
    {
      job_id: jobs[0].$id,
      uploaded_by: installers[0].$id,
      file_name: "channel-letters-before.jpg",
      file_url: "https://placehold.co/800x600/eee/999?text=Before+Photo",
      file_type: "image/jpeg",
      file_size: 245000,
      file_id: "demo_file_001",
      category: "photo_before",
    },
    {
      job_id: jobs[0].$id,
      uploaded_by: installers[1].$id,
      file_name: "channel-letters-after.jpg",
      file_url: "https://placehold.co/800x600/eee/999?text=After+Photo",
      file_type: "image/jpeg",
      file_size: 310000,
      file_id: "demo_file_002",
      category: "photo_after",
    },
    {
      job_id: jobs[0].$id,
      uploaded_by: profiles[1].$id,
      file_name: "metro-mall-permit-2026.pdf",
      file_url: "https://placehold.co/800x600/eee/999?text=Permit+PDF",
      file_type: "application/pdf",
      file_size: 89000,
      file_id: "demo_file_003",
      category: "permit",
    },

    // ER wayfinding
    {
      job_id: jobs[1].$id,
      uploaded_by: installers[1].$id,
      file_name: "er-wing-progress.jpg",
      file_url: "https://placehold.co/800x600/eee/999?text=In+Progress",
      file_type: "image/jpeg",
      file_size: 198000,
      file_id: "demo_file_004",
      category: "photo_before",
    },
    {
      job_id: jobs[1].$id,
      uploaded_by: profiles[1].$id,
      file_name: "wayfinding-layout-drawing.pdf",
      file_url: "https://placehold.co/800x600/eee/999?text=Drawing",
      file_type: "application/pdf",
      file_size: 420000,
      file_id: "demo_file_005",
      category: "drawing",
    },

    // Blade sign
    {
      job_id: jobs[2].$id,
      uploaded_by: profiles[1].$id,
      file_name: "blade-sign-design-proof.pdf",
      file_url: "https://placehold.co/800x600/eee/999?text=Design+Proof",
      file_type: "application/pdf",
      file_size: 156000,
      file_id: "demo_file_006",
      category: "drawing",
    },
    {
      job_id: jobs[2].$id,
      uploaded_by: profiles[0].$id,
      file_name: "city-sign-permit-6th-st.pdf",
      file_url: "https://placehold.co/800x600/eee/999?text=Permit",
      file_type: "application/pdf",
      file_size: 72000,
      file_id: "demo_file_007",
      category: "permit",
    },

    // Completed parking garage
    {
      job_id: jobs[6].$id,
      uploaded_by: installers[2].$id,
      file_name: "garage-level1-complete.jpg",
      file_url: "https://placehold.co/800x600/eee/999?text=Garage+L1",
      file_type: "image/jpeg",
      file_size: 275000,
      file_id: "demo_file_008",
      category: "photo_after",
    },
    {
      job_id: jobs[6].$id,
      uploaded_by: installers[2].$id,
      file_name: "garage-level3-anchors.jpg",
      file_url: "https://placehold.co/800x600/eee/999?text=Garage+L3",
      file_type: "image/jpeg",
      file_size: 188000,
      file_id: "demo_file_009",
      category: "photo_after",
    },
  ];

  for (const a of attachmentsData) {
    await create(COLLECTIONS.job_attachments, a);
  }
  console.log(`    ✓ ${attachmentsData.length} attachment records created`);

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log(`   ${profiles.length} profiles`);
  console.log(`   ${clients.length} clients`);
  console.log(`   ${jobs.length} jobs`);
  console.log(`   ${assignmentsData.length} assignments`);
  console.log(`   ${notesData.length} notes`);
  console.log(`   ${attachmentsData.length} attachments`);
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message || err);
  process.exit(1);
});

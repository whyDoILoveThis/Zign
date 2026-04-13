/**
 * Appwrite database setup — creates all collections, attributes, and indexes.
 *
 * Usage:
 *   npx tsx scripts/setup-db.ts
 *
 * Safe to re-run: skips anything that already exists.
 */

import { Client, Databases, DatabasesIndexType, OrderBy } from "node-appwrite";
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

// ── Collection definitions ───────────────────────────────────────────────────

interface AttrDef {
  name: string;
  type: "string" | "integer" | "float";
  size?: number;       // for strings
  required: boolean;
}

interface IndexDef {
  key: string;
  type: DatabasesIndexType;
  attributes: string[];
  orders?: OrderBy[];
}

interface CollectionDef {
  id: string;
  name: string;
  attributes: AttrDef[];
  indexes: IndexDef[];
}

const collections: CollectionDef[] = [
  {
    id: env.APPWRITE_COLLECTION_PROFILES || "profiles",
    name: "Profiles",
    attributes: [
      { name: "clerk_id", type: "string", size: 191, required: true },
      { name: "email", type: "string", size: 191, required: true },
      { name: "first_name", type: "string", size: 191, required: true },
      { name: "last_name", type: "string", size: 191, required: true },
      { name: "role", type: "string", size: 20, required: true },
      { name: "phone", type: "string", size: 30, required: false },
      { name: "avatar_url", type: "string", size: 2048, required: false },
    ],
    indexes: [
      { key: "idx_clerk_id", type: DatabasesIndexType.Key, attributes: ["clerk_id"], orders: [OrderBy.Asc] },
      { key: "idx_role", type: DatabasesIndexType.Key, attributes: ["role"], orders: [OrderBy.Asc] },
    ],
  },
  {
    id: env.APPWRITE_COLLECTION_CLIENTS || "clients",
    name: "Clients",
    attributes: [
      { name: "name", type: "string", size: 191, required: true },
      { name: "contact_name", type: "string", size: 191, required: false },
      { name: "email", type: "string", size: 191, required: false },
      { name: "phone", type: "string", size: 30, required: false },
      { name: "address", type: "string", size: 500, required: true },
      { name: "city", type: "string", size: 100, required: false },
      { name: "state", type: "string", size: 50, required: false },
      { name: "postal_code", type: "string", size: 20, required: false },
      { name: "lat", type: "float", required: false },
      { name: "lng", type: "float", required: false },
      { name: "notes", type: "string", size: 5000, required: false },
    ],
    indexes: [
      { key: "idx_name", type: DatabasesIndexType.Key, attributes: ["name"], orders: [OrderBy.Asc] },
      { key: "idx_name_search", type: DatabasesIndexType.Fulltext, attributes: ["name"] },
    ],
  },
  {
    id: env.APPWRITE_COLLECTION_JOBS || "jobs",
    name: "Jobs",
    attributes: [
      { name: "title", type: "string", size: 191, required: true },
      { name: "description", type: "string", size: 5000, required: false },
      { name: "client_id", type: "string", size: 36, required: true },
      { name: "address", type: "string", size: 500, required: true },
      { name: "city", type: "string", size: 100, required: false },
      { name: "state", type: "string", size: 50, required: false },
      { name: "postal_code", type: "string", size: 20, required: false },
      { name: "lat", type: "float", required: false },
      { name: "lng", type: "float", required: false },
      { name: "status", type: "string", size: 20, required: true },
      { name: "scheduled_date", type: "string", size: 10, required: false },
      { name: "scheduled_time", type: "string", size: 8, required: false },
      { name: "estimated_duration_minutes", type: "integer", required: false },
      { name: "completed_at", type: "string", size: 30, required: false },
      { name: "notes", type: "string", size: 5000, required: false },
      { name: "created_by", type: "string", size: 191, required: true },
    ],
    indexes: [
      { key: "idx_status", type: DatabasesIndexType.Key, attributes: ["status"], orders: [OrderBy.Asc] },
      { key: "idx_client_id", type: DatabasesIndexType.Key, attributes: ["client_id"], orders: [OrderBy.Asc] },
      { key: "idx_scheduled_date", type: DatabasesIndexType.Key, attributes: ["scheduled_date"], orders: [OrderBy.Asc] },
      { key: "idx_title_search", type: DatabasesIndexType.Fulltext, attributes: ["title"] },
    ],
  },
  {
    id: env.APPWRITE_COLLECTION_JOB_ASSIGNMENTS || "job_assignments",
    name: "Job Assignments",
    attributes: [
      { name: "job_id", type: "string", size: 36, required: true },
      { name: "installer_id", type: "string", size: 191, required: true },
      { name: "assigned_by", type: "string", size: 191, required: true },
    ],
    indexes: [
      { key: "idx_job_id", type: DatabasesIndexType.Key, attributes: ["job_id"], orders: [OrderBy.Asc] },
    ],
  },
  {
    id: env.APPWRITE_COLLECTION_JOB_NOTES || "job_notes",
    name: "Job Notes",
    attributes: [
      { name: "job_id", type: "string", size: 36, required: true },
      { name: "author_id", type: "string", size: 191, required: true },
      { name: "content", type: "string", size: 10000, required: true },
    ],
    indexes: [
      { key: "idx_job_id", type: DatabasesIndexType.Key, attributes: ["job_id"], orders: [OrderBy.Asc] },
    ],
  },
  {
    id: env.APPWRITE_COLLECTION_JOB_ATTACHMENTS || "job_attachments",
    name: "Job Attachments",
    attributes: [
      { name: "job_id", type: "string", size: 36, required: true },
      { name: "uploaded_by", type: "string", size: 191, required: true },
      { name: "file_name", type: "string", size: 191, required: true },
      { name: "file_url", type: "string", size: 2048, required: true },
      { name: "file_type", type: "string", size: 100, required: true },
      { name: "file_size", type: "integer", required: true },
      { name: "file_id", type: "string", size: 36, required: true },
      { name: "category", type: "string", size: 20, required: true },
    ],
    indexes: [
      { key: "idx_job_id", type: DatabasesIndexType.Key, attributes: ["job_id"], orders: [OrderBy.Asc] },
    ],
  },
  {
    id: env.APPWRITE_COLLECTION_NOTIFICATIONS || "notifications",
    name: "Notifications",
    attributes: [
      { name: "user_id", type: "string", size: 191, required: true },
      { name: "type", type: "string", size: 30, required: true },
      { name: "title", type: "string", size: 191, required: true },
      { name: "message", type: "string", size: 2000, required: true },
      { name: "link", type: "string", size: 500, required: false },
      { name: "read", type: "string", size: 5, required: true },
      { name: "job_id", type: "string", size: 36, required: false },
    ],
    indexes: [
      { key: "idx_user_id", type: DatabasesIndexType.Key, attributes: ["user_id"], orders: [OrderBy.Asc] },
      { key: "idx_read", type: DatabasesIndexType.Key, attributes: ["read"], orders: [OrderBy.Asc] },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function collectionExists(id: string): Promise<boolean> {
  try {
    await db.getCollection(DATABASE_ID, id);
    return true;
  } catch {
    return false;
  }
}

async function getExistingAttributes(collectionId: string): Promise<Set<string>> {
  try {
    const res = await db.listAttributes(DATABASE_ID, collectionId);
    return new Set((res.attributes as { key: string }[]).map((a) => a.key));
  } catch {
    return new Set();
  }
}

async function getExistingIndexes(collectionId: string): Promise<Set<string>> {
  try {
    const res = await db.listIndexes(DATABASE_ID, collectionId);
    return new Set(res.indexes.map((i) => i.key));
  } catch {
    return new Set();
  }
}

async function waitForAttributes(collectionId: string, expected: number) {
  // Appwrite processes attributes asynchronously — wait until all are "available"
  for (let attempt = 0; attempt < 60; attempt++) {
    const res = await db.listAttributes(DATABASE_ID, collectionId);
    const attrs = res.attributes as { key: string; status: string }[];
    const ready = attrs.filter((a) => a.status === "available").length;
    if (ready >= expected) return;
    await sleep(500);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function setup() {
  console.log("🔧 Setting up Appwrite collections...\n");

  for (const col of collections) {
    const exists = await collectionExists(col.id);

    if (!exists) {
      await db.createCollection(DATABASE_ID, col.id, col.name);
      console.log(`  ✓ Created collection: ${col.name} (${col.id})`);
    } else {
      console.log(`  • Collection already exists: ${col.name} (${col.id})`);
    }

    // ── Attributes ─────────────────────────────────────────────────────────
    const existingAttrs = await getExistingAttributes(col.id);
    let newAttrCount = 0;

    for (const attr of col.attributes) {
      if (existingAttrs.has(attr.name)) {
        continue;
      }

      try {
        if (attr.type === "string") {
          await db.createStringAttribute(
            DATABASE_ID, col.id, attr.name,
            attr.size || 255,
            attr.required,
          );
        } else if (attr.type === "integer") {
          await db.createIntegerAttribute(
            DATABASE_ID, col.id, attr.name,
            attr.required,
          );
        } else if (attr.type === "float") {
          await db.createFloatAttribute(
            DATABASE_ID, col.id, attr.name,
            attr.required,
          );
        }
        newAttrCount++;
        console.log(`    + ${attr.name} (${attr.type}${attr.required ? ", required" : ""})`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Attribute may already exist with slightly different params
        if (msg.includes("already exists")) {
          continue;
        }
        console.error(`    ✗ Failed to create ${attr.name}: ${msg}`);
      }
    }

    // Wait for all attributes to be processed before creating indexes
    if (newAttrCount > 0) {
      console.log(`    ⏳ Waiting for ${newAttrCount} attribute(s) to be ready...`);
      await waitForAttributes(col.id, existingAttrs.size + newAttrCount);
    }

    // ── Indexes ──────────────────────────────────────────────────────────
    const existingIndexes = await getExistingIndexes(col.id);

    for (const idx of col.indexes) {
      if (existingIndexes.has(idx.key)) {
        continue;
      }

      try {
        await db.createIndex(
          DATABASE_ID, col.id, idx.key,
          idx.type,
          idx.attributes,
          idx.orders,
        );
        console.log(`    + Index: ${idx.key} (${idx.type} on ${idx.attributes.join(", ")})`);
        // Small delay between index creations
        await sleep(300);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("already exists")) {
          continue;
        }
        console.error(`    ✗ Failed to create index ${idx.key}: ${msg}`);
      }
    }

    console.log("");
  }

  console.log("✅ Database setup complete!");
  console.log("\nCollection IDs for .env.local (if not using defaults):");
  for (const col of collections) {
    console.log(`  ${col.id}  →  ${col.name}`);
  }
  console.log("\nNext: run  npm run seed  to populate demo data.");
}

setup().catch((err) => {
  console.error("\n❌ Setup failed:", err.message || err);
  process.exit(1);
});

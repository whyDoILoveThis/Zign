import { Client, Databases, Storage, Query, ID } from "node-appwrite";

let _client: Client | null = null;
let _databases: Databases | null = null;
let _storage: Storage | null = null;

function getClient(): Client {
  if (!_client) {
    _client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);
  }
  return _client;
}

export const databases: Databases = new Proxy({} as Databases, {
  get(_, prop) {
    if (!_databases) _databases = new Databases(getClient());
    return (_databases as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const storage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    if (!_storage) _storage = new Storage(getClient());
    return (_storage as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { Query, ID };

export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
export const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || "zign-uploads";

// Collection IDs — set these in .env.local or use these defaults
export const COLLECTIONS = {
  profiles: process.env.APPWRITE_COLLECTION_PROFILES || "profiles",
  clients: process.env.APPWRITE_COLLECTION_CLIENTS || "clients",
  jobs: process.env.APPWRITE_COLLECTION_JOBS || "jobs",
  job_assignments:
    process.env.APPWRITE_COLLECTION_JOB_ASSIGNMENTS || "job_assignments",
  job_notes: process.env.APPWRITE_COLLECTION_JOB_NOTES || "job_notes",
  job_attachments:
    process.env.APPWRITE_COLLECTION_JOB_ATTACHMENTS || "job_attachments",
  notifications:
    process.env.APPWRITE_COLLECTION_NOTIFICATIONS || "notifications",
} as const;

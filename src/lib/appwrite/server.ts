import { Client, Databases, Storage, Query, ID } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const databases = new Databases(client);
export const storage = new Storage(client);
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

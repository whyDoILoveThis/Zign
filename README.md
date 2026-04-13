# Zign — Sign Installation Operations System

A modern, web-based operations management system built for sign installation companies. Manages jobs, scheduling, dispatch, routing, and field operations for office staff and installers.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 16 (App Router), React, TypeScript      |
| Styling  | Tailwind CSS 4                                  |
| Auth     | Clerk (`@clerk/nextjs`)                         |
| Database | Appwrite (`node-appwrite` server SDK)           |
| Maps     | TomTom API (swappable via provider abstraction) |
| Storage  | Appwrite Storage                                |
| Icons    | Lucide React                                    |

## Features

- **Dashboard** — Real-time stats, recent jobs, upcoming schedule
- **Job Management** — Full CRUD with status tracking, notes, file attachments
- **Client Directory** — Client profiles with contact info and geocoded addresses
- **Scheduling Calendar** — Monthly view with color-coded job indicators
- **Map View** — Job locations, route planning, and one-click navigation
- **Installer View** — Mobile-friendly interface for field installers (start/complete jobs, add notes)
- **Team Management** — View team members, assign roles (admin only)
- **File Uploads** — Before/after photos, permits, drawings attached to jobs
- **Settings** — Company info, maps provider config, appearance

## Architecture

### Overview

```
Browser (React)  →  Next.js API Routes  →  Appwrite (Database + Storage)
                         ↕
                    Clerk (Auth)
                         ↕
                  TomTom Maps API
```

The app follows an **API-first design**. The React frontend never talks to Appwrite directly — all data flows through server-side Next.js API routes under `/api/*`. This keeps credentials secure and makes the backend reusable for a future mobile app.

### How Database Operations Work

All database operations use the **Appwrite Node.js server SDK** (`node-appwrite`) via a single admin client defined in `src/lib/appwrite/server.ts`.

**Server client setup:**

```ts
// src/lib/appwrite/server.ts
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
export const COLLECTIONS = {
  profiles: "profiles",
  clients: "clients",
  jobs: "jobs",
  job_assignments: "job_assignments",
  job_notes: "job_notes",
  job_attachments: "job_attachments",
};
```

**CRUD patterns used in every API route:**

| Operation | Appwrite SDK Call                                             | Example                       |
| --------- | ------------------------------------------------------------- | ----------------------------- |
| List      | `databases.listDocuments(DB, COLLECTION, [Query...])`         | Fetch all clients with search |
| Get one   | `databases.getDocument(DB, COLLECTION, id)`                   | Get a job by ID               |
| Create    | `databases.createDocument(DB, COLLECTION, ID.unique(), data)` | Create a new client           |
| Update    | `databases.updateDocument(DB, COLLECTION, id, data)`          | Change job status             |
| Delete    | `databases.deleteDocument(DB, COLLECTION, id)`                | Remove a job                  |

**Filtering & querying** uses `Query` helpers:

```ts
// Filter by field
Query.equal("status", "scheduled");
Query.equal("client_id", someId);

// Date ranges
Query.greaterThanEqual("scheduled_date", "2026-04-01");
Query.lessThanEqual("scheduled_date", "2026-04-30");

// Full-text search (requires full-text index on the collection)
Query.search("name", searchTerm);

// Ordering & pagination
Query.orderAsc("name");
Query.orderDesc("created_at");
Query.limit(500);
```

**No SQL joins** — Appwrite is a document database. Related data is fetched with separate parallel queries. For example, loading a job with full details:

```ts
const [client, assignments, notes, attachments] = await Promise.all([
  databases.getDocument(DB, COLLECTIONS.clients, job.client_id),
  databases.listDocuments(DB, COLLECTIONS.job_assignments, [
    Query.equal("job_id", id),
  ]),
  databases.listDocuments(DB, COLLECTIONS.job_notes, [
    Query.equal("job_id", id),
  ]),
  databases.listDocuments(DB, COLLECTIONS.job_attachments, [
    Query.equal("job_id", id),
  ]),
]);
```

**Upsert pattern** (used in Clerk webhook sync): query first, then create or update:

```ts
const { documents } = await databases.listDocuments(DB, COLLECTIONS.profiles, [
  Query.equal("clerk_id", clerkUserId),
  Query.limit(1),
]);
if (documents.length > 0) {
  await databases.updateDocument(
    DB,
    COLLECTIONS.profiles,
    documents[0].$id,
    data,
  );
} else {
  await databases.createDocument(DB, COLLECTIONS.profiles, ID.unique(), data);
}
```

**File storage** uses Appwrite Storage for uploading attachments:

```ts
import { InputFile } from "node-appwrite/file";

const uploaded = await storage.createFile(
  BUCKET_ID,
  ID.unique(),
  InputFile.fromBuffer(buffer, fileName),
);
// File URL: ${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${PROJECT_ID}
```

### Auth & Roles

Three roles: **admin**, **office**, **installer**. Clerk handles authentication and session management. A webhook at `/api/webhooks/clerk` syncs user data to the Appwrite `profiles` collection on user create/update/delete. Middleware protects all `/dashboard/*` routes.

### Maps Abstraction

Maps functionality is behind a provider interface (`src/lib/maps/types.ts`) with a factory pattern (`src/lib/maps/provider-factory.ts`). Currently implements TomTom; easily extensible to Google Maps or Mapbox by adding a new provider class.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- [Clerk](https://clerk.com) account
- [Appwrite](https://appwrite.io) project (Cloud or self-hosted)
- [TomTom](https://developer.tomtom.com) API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_BUCKET_ID=zign-uploads

MAPS_PROVIDER=tomtom
TOMTOM_API_KEY=your-tomtom-key
```

### 3. Set Up Appwrite

In your Appwrite console:

1. **Create a database** and note its ID for `APPWRITE_DATABASE_ID`
2. **Create an API key** with permissions for databases and storage
3. **Create a storage bucket** named `zign-uploads`
4. **Create these 6 collections** (use these IDs or override via env vars):

| Collection        | ID                | Key Attributes                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`        | `profiles`        | `clerk_id` (string), `email` (string), `first_name` (string), `last_name` (string), `role` (string), `phone` (string), `avatar_url` (string)                                                                                                                                                                                                                   |
| `clients`         | `clients`         | `name` (string), `contact_name` (string), `email` (string), `phone` (string), `address` (string), `city` (string), `state` (string), `postal_code` (string), `lat` (float), `lng` (float), `notes` (string)                                                                                                                                                    |
| `jobs`            | `jobs`            | `title` (string), `description` (string), `client_id` (string), `address` (string), `city` (string), `state` (string), `postal_code` (string), `lat` (float), `lng` (float), `status` (string), `scheduled_date` (string), `scheduled_time` (string), `estimated_duration_minutes` (integer), `completed_at` (string), `notes` (string), `created_by` (string) |
| `job_assignments` | `job_assignments` | `job_id` (string), `installer_id` (string), `assigned_by` (string)                                                                                                                                                                                                                                                                                             |
| `job_notes`       | `job_notes`       | `job_id` (string), `author_id` (string), `content` (string)                                                                                                                                                                                                                                                                                                    |
| `job_attachments` | `job_attachments` | `job_id` (string), `uploaded_by` (string), `file_name` (string), `file_url` (string), `file_type` (string), `file_size` (integer), `file_id` (string), `category` (string)                                                                                                                                                                                     |

5. **Create indexes** for query performance:
   - `profiles`: index on `clerk_id`; index on `role`
   - `clients`: full-text index on `name`
   - `jobs`: index on `status`; index on `client_id`; index on `scheduled_date`; full-text index on `title`
   - `job_assignments`: index on `job_id`
   - `job_notes`: index on `job_id`
   - `job_attachments`: index on `job_id`

### 4. Configure Clerk Webhook

In the Clerk dashboard, add a webhook endpoint pointing to:

```
https://your-domain.com/api/webhooks/clerk
```

Subscribe to: `user.created`, `user.updated`, `user.deleted`

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes (backend)
│   │   ├── clients/            # Client CRUD
│   │   ├── jobs/               # Job CRUD + notes + attachments
│   │   ├── maps/               # Geocode & route proxies
│   │   ├── installers/         # List installers
│   │   ├── profile/            # Current user profile
│   │   ├── team/               # Team management (admin)
│   │   └── webhooks/clerk/     # Clerk → Appwrite profile sync
│   ├── dashboard/              # App pages
│   │   ├── page.tsx            # Dashboard overview
│   │   ├── jobs/               # Job list + detail
│   │   ├── clients/            # Client directory
│   │   ├── schedule/           # Calendar view
│   │   ├── map/                # Map view
│   │   ├── installer/          # Installer mobile view
│   │   ├── team/               # Team management
│   │   └── settings/           # Settings
│   ├── sign-in/                # Clerk sign-in
│   └── sign-up/                # Clerk sign-up
├── components/
│   ├── ui/                     # Base UI components
│   ├── layout/                 # Sidebar, Header
│   ├── clients/                # Client modal
│   └── jobs/                   # Job modal, file upload
├── lib/
│   ├── appwrite/               # Appwrite server client + exports
│   │   └── server.ts           # Client, Databases, Storage, Query, ID
│   ├── maps/                   # Maps provider abstraction
│   │   ├── types.ts            # MapsProvider interface
│   │   ├── provider-factory.ts # Factory pattern
│   │   └── providers/          # TomTom (+ future providers)
│   └── utils.ts                # Utility functions
└── types/                      # TypeScript types
    ├── database.ts             # Enum types (JobStatus, UserRole, AttachmentCategory)
    └── index.ts                # App-level interfaces (Job, Client, Profile, etc.)
```

## Database Schema

| Collection        | Purpose                                |
| ----------------- | -------------------------------------- |
| `profiles`        | User profiles synced from Clerk        |
| `clients`         | Client companies/contacts              |
| `jobs`            | Sign installation jobs                 |
| `job_assignments` | Installer-to-job many-to-many mapping  |
| `job_notes`       | Activity/progress notes on jobs        |
| `job_attachments` | File/photo attachments with storage ID |
| `jobs`            | Sign installation jobs                 |
| `job_assignments` | Installer-to-job assignments           |
| `job_notes`       | Activity notes on jobs                 |
| `job_attachments` | File/photo attachments                 |

## API Reference

| Method | Endpoint                                   | Description                                                                      |
| ------ | ------------------------------------------ | -------------------------------------------------------------------------------- |
| GET    | `/api/jobs`                                | List jobs (filters: status, client_id, installer_id, date_from, date_to, search) |
| POST   | `/api/jobs`                                | Create job                                                                       |
| GET    | `/api/jobs/:id`                            | Get job with details                                                             |
| PATCH  | `/api/jobs/:id`                            | Update job                                                                       |
| DELETE | `/api/jobs/:id`                            | Delete job                                                                       |
| POST   | `/api/jobs/:id/notes`                      | Add note                                                                         |
| POST   | `/api/jobs/:id/attachments`                | Upload file                                                                      |
| DELETE | `/api/jobs/:id/attachments?attachment_id=` | Delete file                                                                      |
| GET    | `/api/clients`                             | List clients                                                                     |
| POST   | `/api/clients`                             | Create client                                                                    |
| GET    | `/api/clients/:id`                         | Get client                                                                       |
| PATCH  | `/api/clients/:id`                         | Update client                                                                    |
| DELETE | `/api/clients/:id`                         | Delete client                                                                    |
| GET    | `/api/profile`                             | Current user profile                                                             |
| GET    | `/api/team`                                | List team members                                                                |
| PATCH  | `/api/team`                                | Update member role                                                               |
| GET    | `/api/installers`                          | List installers                                                                  |
| POST   | `/api/maps/geocode`                        | Geocode address                                                                  |
| POST   | `/api/maps/route`                          | Calculate route                                                                  |

## Adding a Maps Provider

1. Create `src/lib/maps/providers/your-provider.ts`
2. Implement the `MapsProvider` interface
3. Add a case in `provider-factory.ts`
4. Set `MAPS_PROVIDER=your-provider` in `.env.local`

## License

Private — all rights reserved.

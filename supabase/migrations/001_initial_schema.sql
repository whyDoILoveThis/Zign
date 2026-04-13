-- Zign Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE job_status AS ENUM ('scheduled', 'in_progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'office', 'installer');
CREATE TYPE attachment_category AS ENUM ('photo_before', 'photo_after', 'permit', 'drawing', 'document', 'other');

-- ============================================
-- PROFILES (synced from Clerk)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'installer',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- CLIENTS
-- ============================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_name ON clients(name);

-- ============================================
-- JOBS
-- ============================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status job_status NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE,
  scheduled_time TIME,
  estimated_duration_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by TEXT NOT NULL, -- clerk_id of creator
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);

-- ============================================
-- JOB ASSIGNMENTS (many-to-many: jobs <-> installers)
-- ============================================

CREATE TABLE job_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  installer_id TEXT NOT NULL, -- clerk_id of installer
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by TEXT NOT NULL, -- clerk_id of assigner
  UNIQUE(job_id, installer_id)
);

CREATE INDEX idx_job_assignments_job_id ON job_assignments(job_id);
CREATE INDEX idx_job_assignments_installer_id ON job_assignments(installer_id);

-- ============================================
-- JOB NOTES
-- ============================================

CREATE TABLE job_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL, -- clerk_id
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_notes_job_id ON job_notes(job_id);

-- ============================================
-- JOB ATTACHMENTS
-- ============================================

CREATE TABLE job_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL, -- clerk_id
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category attachment_category NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_attachments_job_id ON job_attachments(job_id);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_attachments ENABLE ROW LEVEL SECURITY;

-- Service role (used by our API) bypasses RLS automatically.
-- These policies allow the anon key (used by the client) read access
-- while our API routes handle write operations with the service role key.

-- Profiles: anyone authenticated can read
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);

-- Clients: anyone authenticated can read
CREATE POLICY "clients_read" ON clients FOR SELECT USING (true);

-- Jobs: anyone authenticated can read
CREATE POLICY "jobs_read" ON jobs FOR SELECT USING (true);

-- Job assignments: anyone authenticated can read
CREATE POLICY "job_assignments_read" ON job_assignments FOR SELECT USING (true);

-- Job notes: anyone authenticated can read
CREATE POLICY "job_notes_read" ON job_notes FOR SELECT USING (true);

-- Job attachments: anyone authenticated can read
CREATE POLICY "job_attachments_read" ON job_attachments FOR SELECT USING (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('zign-uploads', 'zign-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated uploads
CREATE POLICY "uploads_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'zign-uploads');

-- Allow public reads for uploaded files
CREATE POLICY "uploads_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'zign-uploads');

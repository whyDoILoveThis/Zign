export type { JobStatus, UserRole, AttachmentCategory, NotificationType } from "./database";

export interface Job {
  $id: string;
  title: string;
  description: string | null;
  client_id: string;
  address: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  status: import("./database").JobStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_duration_minutes: number | null;
  completed_at: string | null;
  notes: string | null;
  created_by: string;
  $createdAt: string;
  $updatedAt: string;
  // Joined data
  client?: Client;
  assignments?: JobAssignment[];
  attachments?: JobAttachment[];
}

export interface Client {
  $id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  $createdAt: string;
  $updatedAt: string;
}

export interface Profile {
  $id: string;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: import("./database").UserRole;
  phone: string | null;
  avatar_url: string | null;
  $createdAt: string;
  $updatedAt: string;
}

export interface JobAssignment {
  $id: string;
  job_id: string;
  installer_id: string;
  assigned_at: string;
  assigned_by: string;
  installer?: Profile;
}

export interface JobNote {
  $id: string;
  job_id: string;
  author_id: string;
  content: string;
  $createdAt: string;
  author?: Profile;
}

export interface JobAttachment {
  $id: string;
  job_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: import("./database").AttachmentCategory;
  $createdAt: string;
}

export interface Notification {
  $id: string;
  user_id: string;
  type: import("./database").NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: string; // "true" | "false"
  job_id: string | null;
  $createdAt: string;
}

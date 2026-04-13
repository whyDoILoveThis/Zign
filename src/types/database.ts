export type JobStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export type UserRole = "admin" | "office" | "installer";

export type NotificationType =
  | "job_assigned"
  | "job_status_changed"
  | "job_updated";

export type AttachmentCategory =
  | "photo_before"
  | "photo_after"
  | "permit"
  | "drawing"
  | "document"
  | "other";

import { databases, DATABASE_ID, COLLECTIONS, ID } from "@/lib/appwrite/server";
import type { NotificationType } from "@/types";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  jobId,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  jobId?: string;
}) {
  return databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.notifications,
    ID.unique(),
    {
      user_id: userId,
      type,
      title,
      message,
      link: link || null,
      read: "false",
      job_id: jobId || null,
    }
  );
}

export async function notifyInstallers({
  installerClerkIds,
  type,
  title,
  message,
  link,
  jobId,
}: {
  installerClerkIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  jobId?: string;
}) {
  if (installerClerkIds.length === 0) return;
  await Promise.all(
    installerClerkIds.map((clerkId) =>
      createNotification({ userId: clerkId, type, title, message, link, jobId })
    )
  );
}

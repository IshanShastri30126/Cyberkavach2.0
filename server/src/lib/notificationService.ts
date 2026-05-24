import prisma from "./prisma";
import { emitToUser } from "./socket";
import { NotificationType } from "@prisma/client";

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export async function sendNotification({
  userId,
  type,
  title,
  message,
  metadata,
}: SendNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, title, message, metadata },
    });

    // Emit real-time via Socket.io
    emitToUser(userId, "notification", notification);

    console.log(`[Notification] → ${userId}: ${title} — ${message}`);

    return notification;
  } catch (err) {
    console.error("[NotificationService] Error:", err);
  }
}

export async function sendBulkNotification(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  const promises = userIds.map((userId) =>
    sendNotification({ userId, type, title, message, metadata })
  );
  return Promise.allSettled(promises);
}

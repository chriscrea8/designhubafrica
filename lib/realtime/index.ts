import Pusher from "pusher";
let pusher: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusher) pusher = new Pusher({ appId: process.env.PUSHER_APP_ID!, key: process.env.NEXT_PUBLIC_PUSHER_KEY!, secret: process.env.PUSHER_SECRET!, cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!, useTLS: true });
  return pusher;
}

export async function triggerNewMessage(conversationId: string, message: any) {
  await getPusherServer().trigger(`private-conversation-${conversationId}`, "new-message", message);
}

export async function triggerNotification(userId: string, notification: any) {
  await getPusherServer().trigger(`private-user-${userId}`, "notification", notification);
}

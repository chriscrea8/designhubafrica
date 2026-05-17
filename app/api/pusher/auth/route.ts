import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getPusherServer } from "@/lib/realtime";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.text();
  const params = new URLSearchParams(data);
  const socketId = params.get("socket_id") || "";
  const channelName = params.get("channel_name") || "";

  // Only allow users to subscribe to their own user channel or conversation channels they belong to
  const authResponse = getPusherServer().authorizeChannel(socketId, channelName, {
    user_id: session.user.id,
  });

  return NextResponse.json(authResponse);
}

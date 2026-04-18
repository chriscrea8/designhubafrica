import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getPusherServer } from "@/lib/realtime";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const socketId = form.get("socket_id") as string;
  const channel = form.get("channel_name") as string;
  if (!socketId || !channel) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  const auth = getPusherServer().authorizeChannel(socketId, channel);
  return NextResponse.json(auth);
}

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { name, type } = await req.json();

    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    const profile = await currentProfile();

    if (!profile) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new Response("Server ID Missing", { status: 400 });
    }

    if (!name) {
      return new Response("Channel Name Missing", { status: 400 });
    }

    if (name === "general") {
      return new Response("Channel Name Cannot Be General", { status: 400 });
    }

    if (!type) {
      return new Response("Channel Type Missing", { status: 400 });
    }

    const server = await db.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          create: {
            profileId: profile.id,
            name,
            type,
          },
        },
      },
    });

    return new Response(JSON.stringify(server), { status: 200 });
  } catch (error) {
    console.log("[CHANNELS_POST]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

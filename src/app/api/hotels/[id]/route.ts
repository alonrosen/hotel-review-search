/* DELETE /api/hotels/[id] — remove a hotel and all its reviews */

import { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/hotels/[id]">
) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await prisma.hotel.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Hotel not found" }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/hotels/[id]">
) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { name, googlePlaceId, tripAdvisorId, tripAdvisorUrl, city, country } = body;

  try {
    const hotel = await prisma.hotel.update({
      where: { id },
      data: {
        name,
        googlePlaceId: googlePlaceId || null,
        tripAdvisorId: tripAdvisorId || null,
        tripAdvisorUrl: tripAdvisorUrl || null,
        city: city || null,
        country: country || null,
      },
    });
    return Response.json(hotel);
  } catch {
    return Response.json({ error: "Failed to update hotel" }, { status: 500 });
  }
}

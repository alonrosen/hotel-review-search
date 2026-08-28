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

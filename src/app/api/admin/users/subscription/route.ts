import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['admin']);
    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    if (action === 'grant') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSubscribed: true,
          stripeSubscriptionId: 'free_granted_by_admin'
        }
      });
    } else if (action === 'revoke') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSubscribed: false,
          stripeSubscriptionId: null
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update user subscription:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

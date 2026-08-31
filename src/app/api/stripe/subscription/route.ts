import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user || !user.stripeSubscriptionId || user.stripeSubscriptionId === 'free_granted_by_admin') {
      return NextResponse.json({ subscription: null });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    return NextResponse.json({
      subscription: {
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

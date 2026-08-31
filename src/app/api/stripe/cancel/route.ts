import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isSubscribed) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    if (!user.stripeSubscriptionId || user.stripeSubscriptionId === 'free_granted_by_admin') {
      return NextResponse.json({ error: "Cannot cancel this subscription via Stripe." }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
    
    // Update the subscription to cancel at the end of the billing period
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true, message: "Subscription will be canceled at the end of the billing period." });
  } catch (error: any) {
    console.error("Failed to cancel subscription:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return Response.json({ error: "User not found" }, { status: 401 });

  // Get price from settings
  const priceSetting = await prisma.setting.findUnique({ where: { key: "sub_price" } });
  const price = priceSetting ? parseFloat(priceSetting.value) : 99.00;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Apple Pay and Google Pay are automatically supported by Stripe Checkout if enabled in Stripe Dashboard
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Unlimited Searches Subscription",
              description: "Get unlimited hotel review searches.",
            },
            unit_amount: Math.round(price * 100),
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      ui_mode: "embedded",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    return Response.json({ clientSecret: checkoutSession.client_secret });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

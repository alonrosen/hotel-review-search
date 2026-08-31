import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireAuth(['admin']); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  
  const keys = [
    "provider_google", 
    "provider_tripadvisor",
    "sub_price",
    "sub_free_searches",
    "sub_free_period_value",
    "sub_free_period_unit"
  ];

  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });

  const config: Record<string, string> = {
    provider_google: "rapidapi",
    provider_tripadvisor: "rapidapi",
    sub_price: "99.00",
    sub_free_searches: "5",
    sub_free_period_value: "1",
    sub_free_period_unit: "day",
  };

  for (const s of settings) {
    if (keys.includes(s.key)) {
      config[s.key] = s.value;
    }
  }

  let isStripePrice = false;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
    const products = await stripe.products.search({
      query: 'name:"Unlimited Searches Subscription" AND active:"true"',
      expand: ['data.default_price']
    });
    
    if (products.data.length > 0) {
      const product = products.data[0];
      if (product.default_price && typeof product.default_price !== 'string') {
        const price = product.default_price as Stripe.Price;
        if (price.unit_amount) {
          config.sub_price = (price.unit_amount / 100).toFixed(2);
          isStripePrice = true;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch Stripe product:", error);
  }
  
  config.isStripePrice = String(isStripePrice);

  return Response.json(config);
}

export async function POST(req: NextRequest) {
  try { await requireAuth(['admin']); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json();
  const keys = [
    "provider_google", 
    "provider_tripadvisor",
    "sub_price",
    "sub_free_searches",
    "sub_free_period_value",
    "sub_free_period_unit"
  ];

  for (const key of keys) {
    if (body[key] !== undefined) {
      await prisma.setting.upsert({
        where: { key },
        create: { key, value: String(body[key]) },
        update: { value: String(body[key]) },
      });
    }
  }

  return Response.json({ success: true });
}

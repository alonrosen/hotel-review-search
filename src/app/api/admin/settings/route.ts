import { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ["provider_google", "provider_tripadvisor"] },
    },
  });

  const config = {
    provider_google: "rapidapi",
    provider_tripadvisor: "rapidapi",
  };

  for (const s of settings) {
    if (s.key === "provider_google" || s.key === "provider_tripadvisor") {
      config[s.key] = s.value;
    }
  }

  return Response.json(config);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { provider_google, provider_tripadvisor } = body;

  if (provider_google) {
    await prisma.setting.upsert({
      where: { key: "provider_google" },
      create: { key: "provider_google", value: provider_google },
      update: { value: provider_google },
    });
  }

  if (provider_tripadvisor) {
    await prisma.setting.upsert({
      where: { key: "provider_tripadvisor" },
      create: { key: "provider_tripadvisor", value: provider_tripadvisor },
      update: { value: provider_tripadvisor },
    });
  }

  return Response.json({ success: true });
}

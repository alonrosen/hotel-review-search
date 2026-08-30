import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

async function authenticate() {
  const reqHeaders = await headers();
  const adminSecret = reqHeaders.get("x-admin-secret");
  return adminSecret === process.env.ADMIN_SECRET;
}

export async function GET() {
  if (!(await authenticate())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.setting.findMany();
    const config: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
      config[s.key] = s.value;
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await authenticate())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, value } = await req.json();

    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}

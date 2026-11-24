import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Liveness check for the container HEALTHCHECK and Coolify. It touches the
// database so a container that can't reach Postgres never takes traffic.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

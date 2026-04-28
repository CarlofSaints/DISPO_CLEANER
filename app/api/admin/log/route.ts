import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { loadLog } from "@/lib/activityLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userOrRes = await requireAdmin(req);
  if (userOrRes instanceof NextResponse) return userOrRes;

  const log = await loadLog();

  return NextResponse.json(log, {
    headers: { "Cache-Control": "no-store" },
  });
}

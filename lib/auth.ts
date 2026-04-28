import { NextRequest, NextResponse } from "next/server";
import { loadUsers, type DispoUser } from "./userData";

export async function requireLogin(req: NextRequest): Promise<DispoUser | NextResponse> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const users = await loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<DispoUser | NextResponse> {
  const result = await requireLogin(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return result;
}

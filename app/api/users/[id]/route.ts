import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { loadUsers, saveUsers } from "@/lib/userData";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrRes = await requireAdmin(req);
  if (userOrRes instanceof NextResponse) return userOrRes;
  const admin = userOrRes;

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  users.splice(idx, 1);
  await saveUsers(users);

  return NextResponse.json({ ok: true });
}

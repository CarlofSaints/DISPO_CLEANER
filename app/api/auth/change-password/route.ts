import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loadUsers, saveUsers } from "@/lib/userData";
import { requireLogin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireLogin(req);
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    const { currentPassword, newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // If not forced, verify current password
    if (!user.forcePasswordChange) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
    }

    const users = await loadUsers();
    const target = users.find((u) => u.id === user.id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    target.passwordHash = await bcrypt.hash(newPassword, 10);
    target.forcePasswordChange = false;
    target.updatedAt = new Date().toISOString();
    await saveUsers(users);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}

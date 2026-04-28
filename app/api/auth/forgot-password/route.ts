import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loadUsers, saveUsers } from "@/lib/userData";
import { appendLog } from "@/lib/activityLog";
import { sendPasswordResetEmail } from "@/lib/email";

function generateTempPassword(): string {
  return crypto.randomUUID().slice(0, 8);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Always return ok to prevent email enumeration
    if (!email) return NextResponse.json({ ok: true });

    const users = await loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return NextResponse.json({ ok: true });

    const tempPw = generateTempPassword();
    user.passwordHash = await bcrypt.hash(tempPw, 10);
    user.forcePasswordChange = true;
    user.updatedAt = new Date().toISOString();
    await saveUsers(users);

    await appendLog({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.name} ${user.surname}`,
      action: "password_reset",
      details: user.email,
    });

    sendPasswordResetEmail(user.email, user.name, tempPw).catch((err) =>
      console.error("Reset email failed:", err)
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ ok: true });
  }
}

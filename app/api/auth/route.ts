import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loadUsers } from "@/lib/userData";
import { appendLog } from "@/lib/activityLog";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const users = await loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Non-blocking — login must succeed even if logging fails
    appendLog({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.name} ${user.surname}`,
      action: "login",
      details: user.email,
    }).catch((err) => console.error("Login log failed:", err));

    return NextResponse.json({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      forcePasswordChange: user.forcePasswordChange,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

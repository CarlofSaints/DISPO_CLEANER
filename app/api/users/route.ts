import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { loadUsers, saveUsers, type DispoUser } from "@/lib/userData";
import { appendLog } from "@/lib/activityLog";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userOrRes = await requireAdmin(req);
  if (userOrRes instanceof NextResponse) return userOrRes;

  const users = await loadUsers();
  const safe = users.map(({ passwordHash, ...u }) => u);

  return NextResponse.json(safe, {
    headers: { "Cache-Control": "no-store" },
  });
}

function generateTempPassword(): string {
  return crypto.randomUUID().slice(0, 8);
}

export async function POST(req: NextRequest) {
  const userOrRes = await requireAdmin(req);
  if (userOrRes instanceof NextResponse) return userOrRes;
  const admin = userOrRes;

  try {
    const { name, surname, email, role } = await req.json();
    if (!name || !surname || !email) {
      return NextResponse.json({ error: "Name, surname, and email are required" }, { status: 400 });
    }

    const users = await loadUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const tempPw = generateTempPassword();
    const now = new Date().toISOString();
    const newUser: DispoUser = {
      id: crypto.randomUUID(),
      name,
      surname,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(tempPw, 10),
      role: role === "admin" ? "admin" : "user",
      forcePasswordChange: true,
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    await saveUsers(users);

    await appendLog({
      userId: admin.id,
      userEmail: admin.email,
      userName: `${admin.name} ${admin.surname}`,
      action: "user_created",
      details: email,
    });

    // Non-blocking welcome email
    sendWelcomeEmail(email, name, tempPw).catch((err) =>
      console.error("Welcome email failed:", err)
    );

    return NextResponse.json({ id: newUser.id, email: newUser.email });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

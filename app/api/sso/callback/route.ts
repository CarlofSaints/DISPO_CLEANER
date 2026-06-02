import { NextRequest, NextResponse } from "next/server";
import { verifySSOToken } from "@/lib/sso";
import { loadUsers, saveUsers, type DispoUser } from "@/lib/userData";

export async function POST(req: NextRequest) {
  const { token } = (await req.json()) as { token?: string };
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const secret = process.env.IRAM_SSO_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SSO not configured" }, { status: 500 });
  }

  const payload = verifySSOToken(token, secret);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired SSO token" }, { status: 401 });
  }

  // Check module access
  if (!payload.modules.includes("dispo")) {
    return NextResponse.json(
      { error: "You do not have access to DISPO Cleaner" },
      { status: 403 },
    );
  }

  const users = await loadUsers();

  // Find existing user by email (case-insensitive)
  let user = users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());

  if (!user) {
    // Create new user with default role 'user'
    const now = new Date().toISOString();
    user = {
      id: crypto.randomUUID(),
      name: payload.name,
      surname: payload.surname,
      email: payload.email,
      passwordHash: "", // No password — SSO-only user
      role: "user",
      forcePasswordChange: false,
      createdAt: now,
      updatedAt: now,
    } satisfies DispoUser;

    users.push(user);
    await saveUsers(users);
  }

  // Return session matching dispo_session format
  return NextResponse.json({
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    role: user.role,
  });
}

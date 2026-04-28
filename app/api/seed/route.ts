import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loadUsers, saveUsers, type DispoUser } from "@/lib/userData";

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    if (secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    const users = await loadUsers();
    const existing = users.find((u) => u.email === "carl@outerjoin.co.za");
    if (existing) {
      return NextResponse.json({ message: "Admin already exists" });
    }

    const now = new Date().toISOString();
    const admin: DispoUser = {
      id: crypto.randomUUID(),
      name: "Carl",
      surname: "Dos Santos",
      email: "carl@outerjoin.co.za",
      passwordHash: await bcrypt.hash("dispo2026", 10),
      role: "admin",
      forcePasswordChange: false,
      createdAt: now,
      updatedAt: now,
    };

    users.push(admin);
    await saveUsers(users);

    return NextResponse.json({ message: "Admin user created", email: admin.email });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}

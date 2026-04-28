import { readJson, writeJson } from "./blob";

export interface DispoUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  forcePasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

const KEY = "users.json";

export async function loadUsers(): Promise<DispoUser[]> {
  return readJson<DispoUser[]>(KEY, []);
}

export async function saveUsers(users: DispoUser[]): Promise<void> {
  await writeJson(KEY, users);
}

import { readJson, writeJson } from "./blob";

export interface LogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: "login" | "upload" | "generate" | "error" | "user_created" | "password_reset";
  details: string;
  timestamp: string;
}

const KEY = "activity-log.json";

export async function loadLog(): Promise<LogEntry[]> {
  return readJson<LogEntry[]>(KEY, []);
}

export async function appendLog(entry: Omit<LogEntry, "id" | "timestamp">): Promise<void> {
  const log = await loadLog();
  log.push({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  await writeJson(KEY, log);
}

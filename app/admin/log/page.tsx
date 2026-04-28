"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch } from "@/lib/useAuth";

interface LogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  upload: "Upload",
  generate: "Generate",
  error: "Error",
  user_created: "User Created",
  password_reset: "Password Reset",
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-blue-100 text-blue-700",
  upload: "bg-green-100 text-green-700",
  generate: "bg-purple-100 text-purple-700",
  error: "bg-red-100 text-red-700",
  user_created: "bg-oj-orange-light text-oj-orange",
  password_reset: "bg-amber-100 text-amber-700",
};

export default function AdminLogPage() {
  const router = useRouter();
  const { session, ready, logout } = useAuth();

  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchLog = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/log", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load log");
      setLog(await res.json());
    } catch { setError("Failed to load activity log"); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready && !session) { router.replace("/login"); return; }
    if (ready && session?.role !== "admin") { router.replace("/"); return; }
    if (ready && session) fetchLog();
  }, [ready, session, router, fetchLog]);

  // Unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    log.forEach((e) => map.set(e.userEmail, e.userName));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [log]);

  // Unique actions for filter dropdown
  const uniqueActions = useMemo(() => {
    return [...new Set(log.map((e) => e.action))].sort();
  }, [log]);

  // Filtered + reversed (newest first)
  const filtered = useMemo(() => {
    return log
      .filter((e) => {
        if (filterUser && e.userEmail !== filterUser) return false;
        if (filterAction && e.action !== filterAction) return false;
        if (filterDateFrom) {
          const entryDate = e.timestamp.slice(0, 10);
          if (entryDate < filterDateFrom) return false;
        }
        if (filterDateTo) {
          const entryDate = e.timestamp.slice(0, 10);
          if (entryDate > filterDateTo) return false;
        }
        return true;
      })
      .reverse();
  }, [log, filterUser, filterAction, filterDateFrom, filterDateTo]);

  if (!ready) return null;
  if (!session || session.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-oj-dark text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/oj-logo-white.png" alt="OuterJoin" className="h-7" />
          <div className="h-5 w-px bg-white/20" />
          <div className="flex items-center gap-1.5">
            <span className="text-oj-orange font-black text-lg tracking-tight">DISPO</span>
            <span className="text-white font-light text-lg tracking-tight">CLEANER</span>
          </div>
          <span className="text-gray-500 text-sm">/ Admin / Activity Log</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-white transition-colors">Home</a>
          <a href="/admin/users" className="text-xs text-oj-orange hover:text-oj-orange-hover transition-colors">Users</a>
          <button onClick={() => { logout(); router.push("/login"); }} className="text-xs text-gray-400 hover:text-white transition-colors">Logout</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Log</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-oj-orange"
          >
            <option value="">All users</option>
            {uniqueUsers.map(([email, name]) => (
              <option key={email} value={email}>{name} ({email})</option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-oj-orange"
          >
            <option value="">All actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-oj-orange"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-oj-orange"
          />
          {(filterUser || filterAction || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterUser(""); setFilterAction(""); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="px-3 py-2 text-sm text-oj-orange hover:text-oj-orange-hover"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-oj-charcoal">When</th>
                  <th className="text-left px-4 py-3 font-medium text-oj-charcoal">Who</th>
                  <th className="text-left px-4 py-3 font-medium text-oj-charcoal">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-oj-charcoal">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{entry.userName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-600"
                      }`}>
                        {ACTION_LABELS[entry.action] || entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={entry.details}>
                      {entry.details}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No log entries</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-400 border-t border-gray-100">
              Showing {filtered.length} of {log.length} entries
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

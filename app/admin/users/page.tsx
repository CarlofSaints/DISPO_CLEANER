"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch } from "@/lib/useAuth";

interface UserRow {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: "admin" | "user";
  forcePasswordChange: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { session, ready, logout } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add user modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addSurname, setAddSurname] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<"user" | "admin">("user");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch("/api/users", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load users");
      setUsers(await res.json());
    } catch { setError("Failed to load users"); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready && !session) { router.replace("/login"); return; }
    if (ready && session?.role !== "admin") { router.replace("/"); return; }
    if (ready && session) fetchUsers();
  }, [ready, session, router, fetchUsers]);

  if (!ready) return null;
  if (!session || session.role !== "admin") return null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await authFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName, surname: addSurname, email: addEmail, role: addRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setShowAdd(false);
      setAddName(""); setAddSurname(""); setAddEmail(""); setAddRole("user");
      fetchUsers();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Delete ${email}?`)) return;
    try {
      const res = await authFetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

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
          <span className="text-gray-500 text-sm">/ Admin / Users</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-white transition-colors">Home</a>
          <a href="/admin/log" className="text-xs text-oj-orange hover:text-oj-orange-hover transition-colors">Activity Log</a>
          <button onClick={() => { logout(); router.push("/login"); }} className="text-xs text-gray-400 hover:text-white transition-colors">Logout</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-oj-orange hover:bg-oj-orange-hover text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Add User
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-oj-charcoal">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-oj-charcoal">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-oj-charcoal">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-oj-charcoal">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{u.name} {u.surname}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === "admin" ? "bg-oj-orange-light text-oj-orange" : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== session.id && (
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-oj-charcoal mb-4">Add User</h2>

            {addError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{addError}</div>
            )}

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-oj-charcoal mb-1">Name</label>
                <input
                  type="text" value={addName} onChange={(e) => setAddName(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-oj-orange focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-oj-charcoal mb-1">Surname</label>
                <input
                  type="text" value={addSurname} onChange={(e) => setAddSurname(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-oj-orange focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-oj-charcoal mb-1">Email</label>
                <input
                  type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-oj-orange focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-oj-charcoal mb-1">Role</label>
                <select
                  value={addRole} onChange={(e) => setAddRole(e.target.value as "user" | "admin")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-oj-orange focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => { setShowAdd(false); setAddError(""); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={addLoading}
                  className="flex-1 py-2.5 bg-oj-orange hover:bg-oj-orange-hover disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {addLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

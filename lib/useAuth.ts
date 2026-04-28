"use client";

import { useState, useEffect, useCallback } from "react";

export interface Session {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: "admin" | "user";
}

const STORAGE_KEY = "dispo_session";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  const login = useCallback((s: Session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  return { session, ready, login, logout };
}

export function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  let userId = "";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) userId = JSON.parse(raw).id;
  } catch { /* ignore */ }

  const headers = new Headers(opts.headers);
  if (userId) headers.set("x-user-id", userId);

  return fetch(url, { ...opts, headers });
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiLogin } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppUser {
  userId?: string | number
  firstName: string
  lastName: string
  email: string
  role: string
  supportCategory?: string
}

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth-token";
const USER_KEY = "ticket-app-user";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      if (stored && token) {
        setUser(JSON.parse(stored) as AppUser);
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deptCategoryMap: Record<number, string> = {
    1: "HR",
    2: "IT",
    7: "Finance",
    8: "Other",
  }
  
  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
  
    const [firstName = "", ...rest] = (data.full_name ?? "").trim().split(" ");
    const lastName = rest.join(" ");
  
    const appUser: AppUser = {
      userId: data.user_id,
      firstName,
      lastName,
      email: data.email,
      role: data.role,
      supportCategory: deptCategoryMap[data.department_id ?? 0] ?? "IT",
    };
  
    console.log("department_id from API:", data.department_id)
console.log("supportCategory:", deptCategoryMap[data.department_id ?? 0] ?? "IT")
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    setUser(appUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type AuthUser } from "./api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<AuthUser>;
  register: (fullName: string, email: string, pass: string, phone?: string) => Promise<AuthUser>;
  logout: () => void;
  quickLogin: (role: "ADMIN" | "STAFF" | "CUSTOMER") => Promise<AuthUser>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "cinema_token";
const USER_KEY = "cinema_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    loadStoredSession();
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setShowLoginModal(false);
    return res.user;
  };

  const loginSafe = async (rawEmail: unknown, pass: string) => {
    if (typeof rawEmail !== "string" || rawEmail === "") {
      throw new Error("Invalid email");
    }
    return login(rawEmail, pass);
  };

  const loadStoredSession = () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUserRaw = localStorage.getItem(USER_KEY);
      if (storedToken && storedUserRaw) {
        setToken(storedToken);
      const parsed = JSON.parse(storedUserRaw);
      if (typeof parsed === "object" && parsed !== null && "role" in parsed && typeof (parsed as any).role === "string" && typeof (parsed as any).email === "string") {
        setUser(parsed as AuthUser);
      }
      }
    } catch (e) {
      console.error("Failed to load auth session", e);
    }
  };

  const register = async (fullName: string, email: string, pass: string, phone?: string) => {
    const regPayload: { fullName: string; email: string; password: string; phone?: string } = { fullName, email, password: pass };
    if (phone !== undefined) regPayload.phone = phone;
    const res = await api.register(regPayload);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setShowLoginModal(false);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const quickLogin = (role: "ADMIN" | "STAFF" | "CUSTOMER") => loginSafe(emails[role], "123456");
  const emails: Record<string, string> = {
    ADMIN: "admin@cinema.vn",
    STAFF: "staff@cinema.vn",
    CUSTOMER: "khach@cinema.vn",
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        quickLogin,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

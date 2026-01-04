"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch } from "@/lib/apiClient"; 
import { AuthUser } from "@/types/auth";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // const [accessToken, setAccessToken] = useState<string | null>(null);
  // const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // useEffect(() => {
  //   const stored = loadAuth(); 
  //   setUser(stored.user || null);
  //   setAccessToken(stored.accessToken || null);
  //   setRefreshToken(stored.refreshToken || null);

  //   setTokens(stored.accessToken || null, stored.refreshToken || null);

  //   setLoading(false);
  // }, []);
  const refreshMe = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/auth/me", { method: "GET" });
      setUser(me);
    } catch (err) {
      // not logged in
      setUser(null);
    }
  }, []);
    useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  // const setAuth = useCallback((resp: AuthResponse) => {
  //   setUser(resp.user);
  //   setAccessToken(resp.accessToken);
  //   setRefreshToken(resp.refreshToken);

  //   // persist
  //   saveAuth({
  //     user: resp.user,
  //     accessToken: resp.accessToken,
  //     refreshToken: resp.refreshToken,
  //   });

  //   setTokens(resp.accessToken, resp.refreshToken);
  // }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let data: any = null;
        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        }
        const message = (data && data.message) || res.statusText || "Login failed";
        throw new Error(message);
      }

      await refreshMe();

      // router.refresh();
      router.push("/dashboard");
    },
    [router, refreshMe]
  );

  // const register = useCallback(
  //   async (name: string, email: string, password: string) => {
  //     await apiFetch("/auth/register", {
  //       method: "POST",
  //       body: JSON.stringify({ name, email, password }),
  //     });
  //     router.push(`/verify-email/sent?email=${encodeURIComponent(email)}`);
  //   },
  //   [ router]
  // );
    const register = useCallback(
      async (name: string, email: string, password: string) => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let data: any = null;
          if (text.trim()) {
            try {
              data = JSON.parse(text);
            } catch {
              data = text;
            }
          }
          const message =
            (data && data.message) || res.statusText || "Registration failed";
          throw new Error(message);
        }

        router.push(`/verify-email/sent?email=${encodeURIComponent(email)}`);
      },
      [router]
    );
  // const logout = useCallback(async () => {
  //   try {
  //     await apiFetch("/auth/logout", { method: "POST" });
  //   } finally {
  //     setUser(null);
  //     router.push("/login");
  //   }
  // }, [router]);
const logout = useCallback(async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    setUser(null);
    router.push("/");
  }
}, [router]);


  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user ,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

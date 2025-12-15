"use client";

import { FormEvent, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to login");
      setShowResend(err.code === "EMAIL_NOT_VERIFIED");
    } finally {
      setSubmitting(false);
      
    }
  };
  const resendVerify = async () => {
  setResendLoading(true);
  setResendMsg(null);
  try {
    await apiFetch("/auth/resend-verify-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setResendMsg("If that account exists, we sent a verification email.");
  } catch (e: any) {
    setResendMsg(e?.message || "Failed to resend verification email.");
  } finally {
    setResendLoading(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-gray-500">
            Welcome back. Log in to access your dashboard.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
            {error}
          </div>
        )}
        {showResend && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={resendVerify}
              disabled={!email || resendLoading}
              className="w-full py-2 rounded border text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {resendLoading ? "Sending..." : "Resend verification email"}
            </button>
            {resendMsg && <p className="text-xs text-gray-600">{resendMsg}</p>}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="flex items-center justify-between">
              <span />
              <a
                href="/forgot-password"
                className="text-xs text-indigo-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-xs text-gray-500">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-indigo-600 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}

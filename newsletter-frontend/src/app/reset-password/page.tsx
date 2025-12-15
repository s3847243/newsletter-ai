"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 800);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Choose a new password</h1>
          <p className="text-sm text-gray-500">
            Set a new password for your account.
          </p>
        </div>

        {!token && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
            Missing reset token. Please use the link from your email.
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
            {error}
          </div>
        )}

        {done ? (
          <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded p-3">
            Password updated. Redirecting to login...
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                New password
              </label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !token}
              className="w-full py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

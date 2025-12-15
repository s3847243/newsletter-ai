"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      // always show success (don’t leak whether user exists)
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-sm text-gray-500">
            We’ll email you a reset link.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
            {error}
          </div>
        )}

        {done ? (
          <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded p-3">
            If that account exists, we sent a password reset email.
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-xs text-gray-500">
          <a href="/login" className="text-indigo-600 hover:underline">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}

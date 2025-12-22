"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

function VerifyEmailContent() {
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const resend = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await apiFetch("/auth/resend-verify-email", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMsg("If that account exists, we sent an email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-8 space-y-4">
        <h1 className="text-2xl font-semibold">Check your inbox</h1>
        <p className="text-sm text-gray-600">
          We sent a verification link to <span className="font-medium">{email}</span>.
        </p>

        {msg && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded p-2">
            {msg}
          </div>
        )}

        <button
          disabled={!email || loading}
          onClick={resend}
          className="w-full py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Resending..." : "Resend email"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
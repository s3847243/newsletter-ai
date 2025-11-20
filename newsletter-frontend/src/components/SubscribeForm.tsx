"use client";

import { FormEvent, useState } from "react";
import { apiFetch, ApiError } from "@/lib/apiClient";

interface SubscribeFormProps {
  creatorHandle: string;
}

export function SubscribeForm({ creatorHandle }: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      await apiFetch(
        "/subscribe",
        {
          method: "POST",
          body: JSON.stringify({
            creatorHandle,
            email,
          }),
        },
        // no access token – anonymous subscribe is allowed
        undefined
      );
      setSuccess("You are subscribed! Check your inbox for future issues.");
      setEmail("");
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Subscription failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Subscribing..." : "Subscribe"}
        </button>
      </div>
      {success && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1">
          {success}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
          {error}
        </p>
      )}
    </form>
  );
}

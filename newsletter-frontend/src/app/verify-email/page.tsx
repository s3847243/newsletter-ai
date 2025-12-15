"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

export default function VerifyEmailPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [status, setStatus] = useState<"loading"|"ok"|"error">("loading");

  useEffect(() => {
    (async () => {
      try {
        await apiFetch<{ success: true }>("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        setStatus("ok");
        setTimeout(() => router.push("/login"), 1200);
      } catch {
        setStatus("error");
      }
    })();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {status === "loading" && <p>Verifying…</p>}
      {status === "ok" && <p>Email verified ✅ Redirecting…</p>}
      {status === "error" && <p>Invalid or expired link ❌</p>}
    </div>
  );
}

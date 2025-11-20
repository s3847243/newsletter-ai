"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  creatorId: string;
  initialIsFollowing?: boolean;
}

export function FollowButton({
  creatorId,
  initialIsFollowing = false,
}: FollowButtonProps) {
  const { isAuthenticated, accessToken } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);

    if (!isAuthenticated || !accessToken) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        await apiFetch(
          `/creators/${creatorId}/unfollow`,
          { method: "POST" },
          accessToken
        );
        setIsFollowing(false);
      } else {
        await apiFetch(
          `/creators/${creatorId}/follow`,
          { method: "POST" },
          accessToken
        );
        setIsFollowing(true);
      }
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Follow action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`px-3 py-1.5 rounded text-xs font-medium border ${
          isFollowing
            ? "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
            : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
        } disabled:opacity-60`}
      >
        {loading
          ? "Saving..."
          : isFollowing
          ? "Following"
          : "Follow"}
      </button>
      {error && (
        <p className="text-[11px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

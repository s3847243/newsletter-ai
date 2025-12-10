"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { TimelineItem, TimelineResponse } from "@/types/timeline";

type CreatorSummary = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
};

export default function TimelinePage() {
  const { accessToken } = useAuth();

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [following, setFollowing] = useState<CreatorSummary[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CreatorSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const followingIds = new Set(following.map((c) => c.id));

  useEffect(() => {
    let cancelled = false;
    if (!accessToken) return;

    async function loadTimeline() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<TimelineResponse>(
          `/timeline?page=${page}&pageSize=${pageSize}`,
          {}
        );
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.total);
        }
      } catch (err: any) {
        const apiErr = err as ApiError;
        if (!cancelled)
          setError(apiErr.message || "Failed to load timeline");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTimeline();
    return () => {
      cancelled = true;
    };
  }, [accessToken, page, pageSize]);

  const loadFollowing = async () => {
    if (!accessToken) return;
    setFollowingLoading(true);
    try {
      const data = await apiFetch<{ items: CreatorSummary[] }>(
        "/creators/following",
        {}
      );
      setFollowing(data.items || []);
    } catch (err) {
      console.error("Failed to load following", err);
    } finally {
      setFollowingLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    loadFollowing();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const handle = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const data = await apiFetch<{ items: CreatorSummary[] }>(
          `/creators/search?query=${encodeURIComponent(searchQuery.trim())}`,
          {}
        );
        setSearchResults(data.items || []);
      } catch (err: any) {
        const apiErr = err as ApiError;
        setSearchError(apiErr.message || "Failed to search creators");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery, accessToken]);

  const toggleFollow = async (creatorId: string, shouldFollow: boolean) => {
    if (!accessToken) return;
    try {
      if (shouldFollow) {
        await apiFetch(
          `/creators/${creatorId}/follow`,
          { method: "POST" }
        );
      } else {
        await apiFetch(
          `/creators/${creatorId}/unfollow`,
          { method: "POST" }
        );
      }

      // Refresh both lists so UI stays in sync
      await Promise.all([loadFollowing(), reloadTimeline()]);
    } catch (err) {
      console.error("Failed to toggle follow", err);
    }
  };

  const reloadTimeline = async () => {
    if (!accessToken) return;
    try {
      const data = await apiFetch<TimelineResponse>(
        `/timeline?page=${page}&pageSize=${pageSize}`,
        {}
      );
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to reload timeline after follow change", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT: Feed */}
      <div className="flex-1 lg:max-w-[65%] space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Timeline</h2>
          <p className="text-sm text-gray-600">
            Recent issues from creators you follow.
          </p>
        </div>

        {loading && <p>Loading timeline...</p>}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-gray-600">
            Your timeline is empty. Follow some creators or publish issues on
            your own profile.
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <TimelineCard key={item.id} item={item} />
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 border rounded disabled:opacity-40"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 border rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Sidebar */}
      <aside className="w-full lg:w-80 space-y-4">
        {/* Creator search */}
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <h3 className="text-sm font-semibold">Find creators</h3>
          <p className="text-xs text-gray-500">
            Search for creators to follow. Their new issues will appear in your
            timeline.
          </p>

          <input
            type="text"
            className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="Search by name or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchLoading && (
            <p className="text-xs text-gray-500">Searching…</p>
          )}

          {searchError && (
            <p className="text-xs text-red-600">{searchError}</p>
          )}

          {!searchLoading && searchQuery.trim() && searchResults.length === 0 && !searchError && (
            <p className="text-xs text-gray-500">No creators found.</p>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((creator) => {
                const isFollowing = followingIds.has(creator.id);
                return (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {creator.avatarUrl && (
                        <img
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {creator.displayName}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          @{creator.handle}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        toggleFollow(creator.id, !isFollowing)
                      }
                      className={`text-[11px] px-2 py-1 rounded border ${
                        isFollowing
                          ? "border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200"
                          : "border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Following list */}
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <h3 className="text-sm font-semibold">You&apos;re following</h3>
          {followingLoading && (
            <p className="text-xs text-gray-500">Loading…</p>
          )}

          {!followingLoading && following.length === 0 && (
            <p className="text-xs text-gray-500">
              You&apos;re not following anyone yet.
            </p>
          )}

          {!followingLoading && following.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {following.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {creator.avatarUrl && (
                      <img
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/${creator.handle}`}
                        className="text-xs font-medium truncate hover:underline"
                      >
                        {creator.displayName}
                      </Link>
                      <p className="text-[11px] text-gray-500 truncate">
                        @{creator.handle}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFollow(creator.id, false)}
                    className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}


function TimelineCard({ item }: { item: TimelineItem }) {
  const published = item.publishedAt
    ? new Date(item.publishedAt).toLocaleString()
    : null;

  const publicUrl = `/${item.creator.handle}/${item.slug}`;

  return (
    <article className="bg-white border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {item.creator.avatarUrl && (
          <img
            src={item.creator.avatarUrl}
            alt={item.creator.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/${item.creator.handle}`}
              className="font-medium hover:underline"
            >
              {item.creator.displayName}
            </Link>
            <span className="text-xs text-gray-500">
              @{item.creator.handle}
            </span>
          </div>
          {published && (
            <p className="text-xs text-gray-500">Published {published}</p>
          )}
        </div>
      </div>

      <div className="pt-1">
        <Link href={publicUrl} className="group">
          <h3 className="font-semibold text-sm group-hover:underline">
            {item.title}
          </h3>
        </Link>
        {item.emailIntro && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {item.emailIntro}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
        <span>{item.viewCount} views</span>
        <Link
          href={publicUrl}
          className="text-indigo-600 hover:underline font-medium"
        >
          Read online
        </Link>
      </div>
    </article>
  );
}

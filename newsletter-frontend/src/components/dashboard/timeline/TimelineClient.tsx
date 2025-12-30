"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch, ApiError } from "@/lib/apiClient";
import type { TimelineItem, TimelineResponse } from "@/types/timeline";
import { TimelineCard } from "./TimelineCard";

type CreatorSummary = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
};

export default function TimelineClient(props: {
  initialTimeline: TimelineResponse;
  initialFollowing: CreatorSummary[];
  pageSize: number;
}) {
  const pageSize = props.pageSize;

  const [items, setItems] = useState<TimelineItem[]>(props.initialTimeline.items);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(props.initialTimeline.total);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [following, setFollowing] = useState<CreatorSummary[]>(props.initialFollowing);
  const followingIds = useMemo(() => new Set(following.map((c) => c.id)), [following]);

  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CreatorSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchTimeline = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<TimelineResponse>(
          `/timeline?page=${nextPage}&pageSize=${pageSize}`,
          { method: "GET" }
        );
        setItems(data.items);
        setTotal(data.total);
      } catch (err: any) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load timeline");
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // Page changes (page 1 is already hydrated)
  useEffect(() => {
    if (page === 1) return;
    fetchTimeline(page);
  }, [page, fetchTimeline]);

  const loadFollowing = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: CreatorSummary[] }>("/creators/following", {
        method: "GET",
      });
      setFollowing(data.items || []);
    } catch (err) {
      console.error("Failed to load following", err);
    }
  }, []);

  // Search with debounce + abort
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();

    const t = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const data = await apiFetch<{ items: CreatorSummary[] }>(
          `/creators/search?query=${encodeURIComponent(q)}`,
          { method: "GET", signal: controller.signal }
        );
        setSearchResults(data.items || []);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        const apiErr = err as ApiError;
        setSearchError(apiErr.message || "Failed to search creators");
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [searchQuery]);

  // Optimistic follow/unfollow (prevents refetch storm)
  const toggleFollow = useCallback(
    async (creator: CreatorSummary, shouldFollow: boolean) => {
      const prev = following;

      setFollowing((cur) => {
        if (shouldFollow) {
          if (cur.some((c) => c.id === creator.id)) return cur;
          return [creator, ...cur];
        }
        return cur.filter((c) => c.id !== creator.id);
      });

      try {
        await apiFetch(`/creators/${creator.id}/${shouldFollow ? "follow" : "unfollow"}`, {
          method: "POST",
        });

        // If your timeline is derived from following, refreshing page=1 is enough
        if (page === 1) {
          const data = await apiFetch<TimelineResponse>(`/timeline?page=1&pageSize=${pageSize}`, {
            method: "GET",
          });
          setItems(data.items);
          setTotal(data.total);
        }
      } catch (err) {
        // rollback
        setFollowing(prev);
        console.error("Failed to toggle follow", err);
      }
    },
    [following, page, pageSize]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light tracking-tight text-neutral-900 mb-3">
            Your Timeline
          </h1>
          <p className="text-lg text-neutral-600 font-light">
            Stay updated with the latest from creators you follow
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Feed */}
          <div className="flex-1 lg:max-w-[720px]">
            {loading && (
              <div className="bg-white rounded-3xl border border-neutral-200 p-16 text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-neutral-200 border-r-neutral-900"></div>
                <p className="mt-4 text-neutral-600 font-light">Loading your timeline...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
                <p className="text-red-700 font-light">{error}</p>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-16 text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-10 h-10 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-light text-neutral-900 mb-2">
                    Your timeline is empty
                  </h3>
                  <p className="text-neutral-600 font-light max-w-md mx-auto">
                    Follow some creators to see their latest issues and stay updated with fresh
                    content.
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="space-y-4">
                {items.map((item) => (
                  <TimelineCard key={item.id} item={item} />
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-8">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-6 py-3 text-sm font-light rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-neutral-600 font-light px-4">
                      {page} / {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-6 py-3 text-sm font-light rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <aside className="w-full lg:w-96 space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Discover */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-light tracking-tight text-neutral-900">
                  Discover Creators
                </h3>
                <p className="text-sm text-neutral-600 font-light">
                  Find and follow creators to fill your timeline
                </p>
              </div>

              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  className="w-full rounded-full border border-neutral-300 pl-12 pr-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchLoading && (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-neutral-200 border-r-neutral-900"></div>
                </div>
              )}

              {searchError && (
                <p className="text-sm text-red-600 font-light mt-4">{searchError}</p>
              )}

              {!searchLoading && searchQuery.trim() && searchResults.length === 0 && !searchError && (
                <p className="text-sm text-neutral-500 font-light text-center py-8">
                  No creators found
                </p>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-4 mt-6 max-h-96 overflow-y-auto pr-2">
                  {searchResults.map((creator) => {
                    const isFollowing = followingIds.has(creator.id);

                    return (
                      <div
                        key={creator.id}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 transition-colors"
                      >
                        {creator.avatarUrl ? (
                          <Image
                            src={creator.avatarUrl}
                            alt={creator.displayName}
                            width={48}
                            height={48}
                            sizes="48px"
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-light flex-shrink-0">
                            {creator.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {creator.displayName}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">@{creator.handle}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFollow(creator, !isFollowing)}
                          className={`text-xs px-4 py-2 rounded-full font-light transition-all flex-shrink-0 ${
                            isFollowing
                              ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105"
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

            {/* Following */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
              <div className="space-y-1 mb-6">
                <h3 className="text-2xl font-light tracking-tight text-neutral-900">Following</h3>
                <p className="text-sm text-neutral-600 font-light">
                  {following.length} {following.length === 1 ? "creator" : "creators"}
                </p>
              </div>

              {following.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-500 font-light">Not following anyone yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {following.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 transition-colors"
                    >
                      {creator.avatarUrl ? (
                        <Image
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          width={48}
                          height={48}
                          sizes="48px"
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-light flex-shrink-0">
                          {creator.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/${creator.handle}`}
                          className="text-sm font-medium text-neutral-900 hover:text-indigo-600 transition-colors truncate block"
                        >
                          {creator.displayName}
                        </Link>
                        <p className="text-xs text-neutral-500 truncate">@{creator.handle}</p>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          await toggleFollow(creator, false);
                          // optional: keep following list in sync with backend
                          await loadFollowing();
                        }}
                        className="text-xs px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all font-light flex-shrink-0"
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
      </div>
    </div>
  );
}
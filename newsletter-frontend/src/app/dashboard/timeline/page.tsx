"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { TimelineItem, TimelineResponse } from "@/types/timeline";
import Link from "next/link";

export default function TimelinePage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    let cancelled = false;

    async function loadTimeline() {
      if (!accessToken) return;
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<TimelineResponse>(
          `/timeline?page=${page}&pageSize=${pageSize}`,
          {},
          accessToken
        );
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.total);
        }
      } catch (err: any) {
        const apiErr = err as ApiError;
        if (!cancelled) setError(apiErr.message || "Failed to load timeline");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTimeline();
    return () => {
      cancelled = true;
    };
  }, [accessToken, page, pageSize]);

  return (
    <div className="space-y-4 max-w-3xl">
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
          Your timeline is empty. Follow some creators or publish issues on your
          own profile.
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

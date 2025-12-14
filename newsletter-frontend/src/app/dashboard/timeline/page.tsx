// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { useAuth } from "@/context/AuthContext";
// import { apiFetch, ApiError } from "@/lib/apiClient";
// import { TimelineItem, TimelineResponse } from "@/types/timeline";

// type CreatorSummary = {
//   id: string;
//   handle: string;
//   displayName: string;
//   avatarUrl?: string | null;
// };

// export default function TimelinePage() {
//   const { accessToken } = useAuth();

//   const [items, setItems] = useState<TimelineItem[]>([]);
//   const [page, setPage] = useState(1);
//   const [total, setTotal] = useState(0);
//   const [pageSize] = useState(20);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const totalPages = Math.max(1, Math.ceil(total / pageSize));
//   const [following, setFollowing] = useState<CreatorSummary[]>([]);
//   const [followingLoading, setFollowingLoading] = useState(false);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState<CreatorSummary[]>([]);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [searchError, setSearchError] = useState<string | null>(null);

//   const followingIds = new Set(following.map((c) => c.id));

//   useEffect(() => {
//     let cancelled = false;
//     if (!accessToken) return;

//     async function loadTimeline() {
//       setLoading(true);
//       setError(null);

//       try {
//         const data = await apiFetch<TimelineResponse>(
//           `/timeline?page=${page}&pageSize=${pageSize}`,
//           {}
//         );
//         if (!cancelled) {
//           setItems(data.items);
//           setTotal(data.total);
//         }
//       } catch (err: any) {
//         const apiErr = err as ApiError;
//         if (!cancelled)
//           setError(apiErr.message || "Failed to load timeline");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }

//     loadTimeline();
//     return () => {
//       cancelled = true;
//     };
//   }, [accessToken, page, pageSize]);

//   const loadFollowing = async () => {
//     if (!accessToken) return;
//     setFollowingLoading(true);
//     try {
//       const data = await apiFetch<{ items: CreatorSummary[] }>(
//         "/creators/following",
//         {}
//       );
//       setFollowing(data.items || []);
//     } catch (err) {
//       console.error("Failed to load following", err);
//     } finally {
//       setFollowingLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!accessToken) return;
//     loadFollowing();
//   }, [accessToken]);

//   useEffect(() => {
//     if (!accessToken) return;

//     if (!searchQuery.trim()) {
//       setSearchResults([]);
//       setSearchError(null);
//       return;
//     }

//     const handle = setTimeout(async () => {
//       setSearchLoading(true);
//       setSearchError(null);

//       try {
//         const data = await apiFetch<{ items: CreatorSummary[] }>(
//           `/creators/search?query=${encodeURIComponent(searchQuery.trim())}`,
//           {}
//         );
//         setSearchResults(data.items || []);
//       } catch (err: any) {
//         const apiErr = err as ApiError;
//         setSearchError(apiErr.message || "Failed to search creators");
//       } finally {
//         setSearchLoading(false);
//       }
//     }, 300);

//     return () => clearTimeout(handle);
//   }, [searchQuery, accessToken]);

//   const toggleFollow = async (creatorId: string, shouldFollow: boolean) => {
//     if (!accessToken) return;
//     try {
//       if (shouldFollow) {
//         await apiFetch(
//           `/creators/${creatorId}/follow`,
//           { method: "POST" }
//         );
//       } else {
//         await apiFetch(
//           `/creators/${creatorId}/unfollow`,
//           { method: "POST" }
//         );
//       }

//       // Refresh both lists so UI stays in sync
//       await Promise.all([loadFollowing(), reloadTimeline()]);
//     } catch (err) {
//       console.error("Failed to toggle follow", err);
//     }
//   };

//   const reloadTimeline = async () => {
//     if (!accessToken) return;
//     try {
//       const data = await apiFetch<TimelineResponse>(
//         `/timeline?page=${page}&pageSize=${pageSize}`,
//         {}
//       );
//       setItems(data.items);
//       setTotal(data.total);
//     } catch (err) {
//       console.error("Failed to reload timeline after follow change", err);
//     }
//   };

//   return (
//     <div className="flex flex-col lg:flex-row gap-6">
//       {/* LEFT: Feed */}
//       <div className="flex-1 lg:max-w-[65%] space-y-4">
//         <div>
//           <h2 className="text-xl font-semibold">Timeline</h2>
//           <p className="text-sm text-gray-600">
//             Recent issues from creators you follow.
//           </p>
//         </div>

//         {loading && <p>Loading timeline...</p>}

//         {error && (
//           <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
//             {error}
//           </div>
//         )}

//         {!loading && !error && items.length === 0 && (
//           <p className="text-sm text-gray-600">
//             Your timeline is empty. Follow some creators or publish issues on
//             your own profile.
//           </p>
//         )}

//         {!loading && !error && items.length > 0 && (
//           <div className="space-y-4">
//             {items.map((item) => (
//               <TimelineCard key={item.id} item={item} />
//             ))}

//             {totalPages > 1 && (
//               <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
//                 <button
//                   disabled={page <= 1}
//                   onClick={() => setPage((p) => Math.max(1, p - 1))}
//                   className="px-2 py-1 border rounded disabled:opacity-40"
//                 >
//                   Previous
//                 </button>
//                 <span>
//                   Page {page} of {totalPages}
//                 </span>
//                 <button
//                   disabled={page >= totalPages}
//                   onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                   className="px-2 py-1 border rounded disabled:opacity-40"
//                 >
//                   Next
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* RIGHT: Sidebar */}
//       <aside className="w-full lg:w-80 space-y-4">
//         {/* Creator search */}
//         <div className="rounded-lg border bg-white p-4 space-y-3">
//           <h3 className="text-sm font-semibold">Find creators</h3>
//           <p className="text-xs text-gray-500">
//             Search for creators to follow. Their new issues will appear in your
//             timeline.
//           </p>

//           <input
//             type="text"
//             className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
//             placeholder="Search by name or handle..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />

//           {searchLoading && (
//             <p className="text-xs text-gray-500">Searching…</p>
//           )}

//           {searchError && (
//             <p className="text-xs text-red-600">{searchError}</p>
//           )}

//           {!searchLoading && searchQuery.trim() && searchResults.length === 0 && !searchError && (
//             <p className="text-xs text-gray-500">No creators found.</p>
//           )}

//           {!searchLoading && searchResults.length > 0 && (
//             <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
//               {searchResults.map((creator) => {
//                 const isFollowing = followingIds.has(creator.id);
//                 return (
//                   <div
//                     key={creator.id}
//                     className="flex items-center justify-between gap-2"
//                   >
//                     <div className="flex items-center gap-2 min-w-0">
//                       {creator.avatarUrl && (
//                         <img
//                           src={creator.avatarUrl}
//                           alt={creator.displayName}
//                           className="w-6 h-6 rounded-full object-cover"
//                         />
//                       )}
//                       <div className="min-w-0">
//                         <p className="text-xs font-medium truncate">
//                           {creator.displayName}
//                         </p>
//                         <p className="text-[11px] text-gray-500 truncate">
//                           @{creator.handle}
//                         </p>
//                       </div>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         toggleFollow(creator.id, !isFollowing)
//                       }
//                       className={`text-[11px] px-2 py-1 rounded border ${
//                         isFollowing
//                           ? "border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200"
//                           : "border-indigo-500 text-indigo-600 hover:bg-indigo-50"
//                       }`}
//                     >
//                       {isFollowing ? "Following" : "Follow"}
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* Following list */}
//         <div className="rounded-lg border bg-white p-4 space-y-3">
//           <h3 className="text-sm font-semibold">You&apos;re following</h3>
//           {followingLoading && (
//             <p className="text-xs text-gray-500">Loading…</p>
//           )}

//           {!followingLoading && following.length === 0 && (
//             <p className="text-xs text-gray-500">
//               You&apos;re not following anyone yet.
//             </p>
//           )}

//           {!followingLoading && following.length > 0 && (
//             <div className="space-y-2 max-h-64 overflow-y-auto">
//               {following.map((creator) => (
//                 <div
//                   key={creator.id}
//                   className="flex items-center justify-between gap-2"
//                 >
//                   <div className="flex items-center gap-2 min-w-0">
//                     {creator.avatarUrl && (
//                       <img
//                         src={creator.avatarUrl}
//                         alt={creator.displayName}
//                         className="w-6 h-6 rounded-full object-cover"
//                       />
//                     )}
//                     <div className="min-w-0">
//                       <Link
//                         href={`/${creator.handle}`}
//                         className="text-xs font-medium truncate hover:underline"
//                       >
//                         {creator.displayName}
//                       </Link>
//                       <p className="text-[11px] text-gray-500 truncate">
//                         @{creator.handle}
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => toggleFollow(creator.id, false)}
//                     className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200"
//                   >
//                     Unfollow
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </aside>
//     </div>
//   );
// }


// function TimelineCard({ item }: { item: TimelineItem }) {
//   const published = item.publishedAt
//     ? new Date(item.publishedAt).toLocaleString()
//     : null;

//   const publicUrl = `/${item.creator.handle}/${item.slug}`;

//   return (
//     <article className="bg-white border rounded-lg p-4 flex flex-col gap-2">
//       <div className="flex items-center gap-3">
//         {item.creator.avatarUrl && (
//           <img
//             src={item.creator.avatarUrl}
//             alt={item.creator.displayName}
//             className="w-8 h-8 rounded-full object-cover"
//           />
//         )}
//         <div>
//           <div className="flex items-center gap-2 text-sm">
//             <Link
//               href={`/${item.creator.handle}`}
//               className="font-medium hover:underline"
//             >
//               {item.creator.displayName}
//             </Link>
//             <span className="text-xs text-gray-500">
//               @{item.creator.handle}
//             </span>
//           </div>
//           {published && (
//             <p className="text-xs text-gray-500">Published {published}</p>
//           )}
//         </div>
//       </div>

//       <div className="pt-1">
//         <Link href={publicUrl} className="group">
//           <h3 className="font-semibold text-sm group-hover:underline">
//             {item.title}
//           </h3>
//         </Link>
//         {item.emailIntro && (
//           <p className="text-sm text-gray-600 mt-1 line-clamp-2">
//             {item.emailIntro}
//           </p>
//         )}
//       </div>

//       <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
//         <span>{item.viewCount} views</span>
//         <Link
//           href={publicUrl}
//           className="text-indigo-600 hover:underline font-medium"
//         >
//           Read online
//         </Link>
//       </div>
//     </article>
//   );
// }
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
        await apiFetch(`/creators/${creatorId}/follow`, { method: "POST" });
      } else {
        await apiFetch(`/creators/${creatorId}/unfollow`, { method: "POST" });
      }

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
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
                <p className="mt-4 text-neutral-600 font-light">
                  Loading your timeline...
                </p>
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
                    Follow some creators to see their latest issues and stay
                    updated with fresh content.
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="px-6 py-3 text-sm font-light rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <aside className="w-full lg:w-96 space-y-6 lg:sticky lg:top-6 lg:self-start">
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
                <p className="text-sm text-red-600 font-light mt-4">
                  {searchError}
                </p>
              )}
              {!searchLoading &&
                searchQuery.trim() &&
                searchResults.length === 0 &&
                !searchError && (
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
                          <img
                            src={creator.avatarUrl}
                            alt={creator.displayName}
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
                          <p className="text-xs text-neutral-500 truncate">
                            @{creator.handle}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            toggleFollow(creator.id, !isFollowing)
                          }
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
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
              <div className="space-y-1 mb-6">
                <h3 className="text-2xl font-light tracking-tight text-neutral-900">
                  Following
                </h3>
                <p className="text-sm text-neutral-600 font-light">
                  {following.length}{" "}
                  {following.length === 1 ? "creator" : "creators"}
                </p>
              </div>

              {followingLoading && (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-neutral-200 border-r-neutral-900"></div>
                </div>
              )}
              {!followingLoading && following.length === 0 && (
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
                  <p className="text-sm text-neutral-500 font-light">
                    Not following anyone yet
                  </p>
                </div>
              )}
              {!followingLoading && following.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {following.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 transition-colors"
                    >
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt={creator.displayName}
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
                        <p className="text-xs text-neutral-500 truncate">
                          @{creator.handle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFollow(creator.id, false)}
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
function TimelineCard({ item }: { item: TimelineItem }) {
  const published = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const publicUrl = `/${item.creator.handle}/${item.slug}`;

  return (
    <Link href={publicUrl}>
      <article className="group bg-white border border-neutral-200 rounded-2xl p-5 hover:shadow-lg hover:border-neutral-300 transition-all duration-300 cursor-pointer mb-2">
        <div className="flex items-start gap-3 mb-3">
          {item.creator.avatarUrl ? (
            <img
              src={item.creator.avatarUrl}
              alt={item.creator.displayName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-light flex-shrink-0">
              {item.creator.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-neutral-900 group-hover:text-indigo-600 transition-colors">
                {item.creator.displayName}
              </span>
              <span className="text-xs text-neutral-500 font-light">
                @{item.creator.handle}
              </span>
            </div>
            {published && (
              <p className="text-xs text-neutral-500 font-light mt-0.5">
                {published}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-light tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors leading-snug">
            {item.title}
          </h3>
          {item.emailIntro && (
            <p className="text-sm text-neutral-600 font-light leading-relaxed line-clamp-2">
              {item.emailIntro}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="font-light">{item.viewCount.toLocaleString()} views</span>
          <span className="text-indigo-600 group-hover:text-indigo-700 font-light flex items-center gap-1.5">
            Read article
            <svg
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
}
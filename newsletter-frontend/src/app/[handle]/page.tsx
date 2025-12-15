import { API_BASE_URL } from "@/lib/config";
import Link from "next/link";
import { CreatorPublic } from "@/types/creator";
import { PublicIssueSummary, PublicIssuesResponse } from "@/types/creator";

async function getCreator(handle: string): Promise<CreatorPublic | null> {
  const res = await fetch(`${API_BASE_URL}/public/creators/${handle}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return (await res.json()) as CreatorPublic;
}

async function getRecentIssues(handle: string): Promise<PublicIssueSummary[]> {
  const res = await fetch(
    `${API_BASE_URL}/public/creators/${handle}/issues?page=1&pageSize=20`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as PublicIssuesResponse;
  return data.items;
}

export default async function PublicCreatorPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const [creator, issues] = await Promise.all([
    getCreator(handle),
    getRecentIssues(handle),
  ]);

  if (!creator) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-neutral-100 rounded-full flex items-center justify-center">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-neutral-900 mb-2">
              Creator not found
            </h1>
            <p className="text-neutral-600 font-light">
              The page you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex px-6 py-3 text-sm rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors font-light"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    creator.displayName || creator.user?.name || creator.handle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-light tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            Newsletter<span className="font-normal">.ai</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-light"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile header */}
        <section className="mb-12">
          <div className="text-center space-y-4">
            {/* Avatar */}
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-light mx-auto shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name & Handle */}
            <div>
              <h1 className="text-4xl font-light tracking-tight text-neutral-900 mb-1">
                {displayName}
              </h1>
              <p className="text-neutral-500 font-light">
                @{creator.handle}
              </p>
            </div>

            {/* Niche Badge */}
            {creator.niche && (
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm font-light rounded-full">
                  {creator.niche}
                </span>
              </div>
            )}

            {/* Bio */}
            {creator.bio && (
              <p className="text-neutral-600 font-light leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                {creator.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="text-center">
                <div className="text-2xl font-light text-neutral-900">
                  {creator._count?.followers ?? 0}
                </div>
                <div className="text-xs text-neutral-500 font-light mt-0.5">
                  followers
                </div>
              </div>
              <div className="w-px h-10 bg-neutral-200"></div>
              <div className="text-center">
                <div className="text-2xl font-light text-neutral-900">
                  {creator.followingCount ?? 0}
                </div>
                <div className="text-xs text-neutral-500 font-light mt-0.5">
                  following
                </div>
              </div>
              <div className="w-px h-10 bg-neutral-200"></div>
              <div className="text-center">
                <div className="text-2xl font-light text-neutral-900">
                  {creator._count?.newsletters ?? 0}
                </div>
                <div className="text-xs text-neutral-500 font-light mt-0.5">
                  issues
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Issues list */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-light tracking-tight text-neutral-900">
              Recent Issues
            </h2>
            <span className="text-sm text-neutral-500 font-light">
              {issues.length} {issues.length === 1 ? "issue" : "issues"}
            </span>
          </div>

          {issues.length === 0 ? (
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl p-16 text-center">
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-neutral-600 font-light">
                No published issues yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/${handle}/${issue.slug}`}
                  className="group block bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg hover:border-neutral-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-light tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors flex-1">
                      {issue.title}
                    </h3>
                    {issue.publishedAt && (
                      <span className="text-sm text-neutral-500 font-light flex-shrink-0">
                        {new Date(issue.publishedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    )}
                  </div>

                  {issue.emailIntro && (
                    <p className="text-neutral-600 font-light leading-relaxed line-clamp-2 mb-4">
                      {issue.emailIntro}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-neutral-500 font-light">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      {issue.viewCount.toLocaleString()} views
                    </div>

                    <span className="text-sm text-indigo-600 group-hover:text-indigo-700 font-light flex items-center gap-2">
                      Read article
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-neutral-500 font-light">
            Powered by{" "}
            <span className="text-neutral-700">Newsletter.ai</span> —
            AI-powered publishing for modern creators
          </p>
        </div>
      </footer>
    </div>
  );
}
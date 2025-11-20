import { API_BASE_URL } from "@/lib/config";
import { CreatorPublic } from "@/types/creator";
import Link from "next/link";
import { NewsletterIssue } from "@/types/creator";

async function getCreator(handle: string): Promise<CreatorPublic | null> {
  const res = await fetch(`${API_BASE_URL}/public/creators/${handle}`, {
    // cache behaviour – you can tweak later
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }
  return (await res.json()) as CreatorPublic;
}

// Optional: show latest issues in sidebar
async function getRecentIssues(handle: string): Promise<NewsletterIssue[]> {
  // If you don’t have a dedicated endpoint, you can skip this for now
  // or later add a backend route. For now, we’ll just return [].
  return [];
}

export default async function PublicCreatorPage({
  params,
}: {
  params: { handle: string };
}) {
  const handle = params.handle;
  const creator = await getCreator(handle);

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Creator not found</h1>
          <p className="text-sm text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-flex px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const displayName = creator.displayName || creator.user?.name || creator.handle;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold">
            Newsletter AI
          </Link>
          <Link
            href="/login"
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section className="flex gap-4">
          {creator.avatarUrl && (
            <img
              src={creator.avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <p className="text-sm text-gray-600">@{creator.handle}</p>
            {creator.bio && (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                {creator.bio}
              </p>
            )}
            {creator.niche && (
              <p className="text-xs text-gray-500 mt-1">
                Writing about: {creator.niche}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
              <span>{creator._count.followers} followers</span>
              <span>{creator._count.subscribers} email subscribers</span>
              <span>{creator._count.newsletters} issues</span>
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Subscribe</h2>
          <p className="text-xs text-gray-600 mb-3">
            Get new issues from {displayName} via email.
          </p>
          {/* For now this is just a message. Later: real form calling /api/subscribe */}
          <p className="text-xs text-gray-500">
            (Subscription UI will go here – frontend will call{" "}
            <code>/api/subscribe</code>.)
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Recent issues</h2>
          <p className="text-xs text-gray-500">
            To show actual issues here, we can add a dedicated backend endpoint
            later. For now, readers can access issues via direct links.
          </p>
        </section>
      </main>
    </div>
  );
}

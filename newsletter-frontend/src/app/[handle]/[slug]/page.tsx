import { API_BASE_URL } from "@/lib/config";
import { NewsletterIssue } from "@/types/creator";
import { CreatorPublic } from "@/types/creator";
import Link from "next/link";

async function getIssue(handle: string, slug: string) {
  const [creatorRes, issueRes] = await Promise.all([
    fetch(`${API_BASE_URL}/public/creators/${handle}`, {
      next: { revalidate: 60 },
    }),
    fetch(`${API_BASE_URL}/public/creators/${handle}/issues/${slug}`, {
      next: { revalidate: 60 },
    }),
  ]);

  if (!creatorRes.ok || !issueRes.ok) {
    return { creator: null as CreatorPublic | null, issue: null as NewsletterIssue | null };
  }

  const creator = (await creatorRes.json()) as CreatorPublic;
  const issue = (await issueRes.json()) as NewsletterIssue;

  return { creator, issue };
}

export default async function PublicIssuePage({
  params,
}: {
  params: { handle: string; slug: string };
}) {
  const { handle, slug } = params;
  const { creator, issue } = await getIssue(handle, slug);

  if (!creator || !issue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Issue not found</h1>
          <p className="text-sm text-gray-600">
            The issue you&apos;re looking for doesn&apos;t exist or is not
            published.
          </p>
          <Link
            href={`/${handle}`}
            className="inline-flex px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Back to creator
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    creator.displayName || creator.user?.name || creator.handle;
  const published = issue.publishedAt
    ? new Date(issue.publishedAt).toLocaleString()
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold">
            Newsletter AI
          </Link>
          <Link
            href={`/${creator.handle}`}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            {displayName}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <article className="bg-white border rounded-lg p-6">
          <header className="space-y-2 mb-4">
            <p className="text-xs text-gray-500">
              From{" "}
              <Link
                href={`/${creator.handle}`}
                className="text-indigo-600 hover:underline"
              >
                {displayName}
              </Link>{" "}
              (@{creator.handle})
            </p>
            <h1 className="text-2xl font-semibold">{issue.title}</h1>
            {published && (
              <p className="text-xs text-gray-500">Published {published}</p>
            )}
          </header>

          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: issue.htmlContent }}
          />
        </article>
      </main>
    </div>
  );
}

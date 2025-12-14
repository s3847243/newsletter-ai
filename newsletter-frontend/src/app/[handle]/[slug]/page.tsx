// import { API_BASE_URL } from "@/lib/config";
// import Link from "next/link";
// type PublicIssueResponse = {
//   creator: {
//     id: string;
//     handle: string;
//     displayName: string;
//     bio: string | null;
//     avatarUrl: string | null;
//     user?: { name?: string | null; image?: string | null };
//   };
//   issue: {
//     id: string;
//     title: string;
//     slug: string;
//     htmlContent: string;
//     publishedAt: string | null;
//     viewCount: number;
//     emailIntro?: string | null;
//   };
// };

// async function getIssue(handle: string, slug: string) {
//   if (!handle || !slug) {
//     console.error("getIssue called with invalid params:", { handle, slug });
//     return null as PublicIssueResponse | null;
//   }

//   const res = await fetch(
//     `${API_BASE_URL}/public/creators/${handle}/issues/${slug}`,
//     {
//       cache: "no-store", // so new publishes show immediately
//     }
//   );

//   if (!res.ok) {
//     console.error("Failed to fetch public issue", res.status);
//     return null;
//   }

//   const data = (await res.json()) as PublicIssueResponse;
//   return data;
// }

// // 👇 Note: params is now a Promise
// export default async function PublicIssuePage(props: {
//   params: Promise<{ handle: string; slug: string }>;
// }) {
//   const { handle, slug } = await props.params; // ✅ unwrap params

//   console.log("PublicIssuePage params:", { handle, slug });

//   const data = await getIssue(handle, slug);

//   if (!data) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center space-y-2">
//           <h1 className="text-xl font-semibold">Issue not found</h1>
//           <p className="text-sm text-gray-600">
//             The issue you&apos;re looking for doesn&apos;t exist or is not
//             published.
//           </p>
//           <Link
//             href={`/${handle}`}
//             className="inline-flex px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
//           >
//             Back to creator
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const { creator, issue } = data;

//   const displayName =
//     creator.displayName || creator.user?.name || creator.handle;

//   const published = issue.publishedAt
//     ? new Date(issue.publishedAt).toLocaleString()
//     : null;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <header className="border-b bg-white">
//         <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
//           <Link href="/" className="text-sm font-semibold">
//             Newsletter AI
//           </Link>
//           <Link
//             href={`/${creator.handle}`}
//             className="text-xs text-gray-600 hover:text-gray-900"
//           >
//             {displayName}
//           </Link>
//         </div>
//       </header>

//       <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
//         <article className="bg-white border rounded-lg p-6">
//           <header className="space-y-2 mb-4">
//             <p className="text-xs text-gray-500">
//               From{" "}
//               <Link
//                 href={`/${creator.handle}`}
//                 className="text-indigo-600 hover:underline"
//               >
//                 {displayName}
//               </Link>{" "}
//               (@{creator.handle})
//             </p>
//             <h1 className="text-2xl font-semibold">{issue.title}</h1>
//             {published && (
//               <p className="text-xs text-gray-500">Published {published}</p>
//             )}
//           </header>

//           <div
//             className="prose prose-sm max-w-none"
//             dangerouslySetInnerHTML={{ __html: issue.htmlContent }}
//           />
//         </article>
//       </main>
//     </div>
//   );
// }
import { API_BASE_URL } from "@/lib/config";
import Link from "next/link";

type PublicIssueResponse = {
  creator: {
    id: string;
    handle: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    user?: { name?: string | null; image?: string | null };
  };
  issue: {
    id: string;
    title: string;
    slug: string;
    htmlContent: string;
    publishedAt: string | null;
    viewCount: number;
    emailIntro?: string | null;
  };
};

async function getIssue(handle: string, slug: string) {
  if (!handle || !slug) {
    console.error("getIssue called with invalid params:", { handle, slug });
    return null as PublicIssueResponse | null;
  }

  const res = await fetch(
    `${API_BASE_URL}/public/creators/${handle}/issues/${slug}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch public issue", res.status);
    return null;
  }

  const data = (await res.json()) as PublicIssueResponse;
  return data;
}

export default async function PublicIssuePage(props: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await props.params;

  console.log("PublicIssuePage params:", { handle, slug });

  const data = await getIssue(handle, slug);

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-3">
            <h1 className="text-3xl font-light tracking-tight text-neutral-900">
              Issue not found
            </h1>
            <p className="text-neutral-600 font-light leading-relaxed">
              The issue you&apos;re looking for doesn&apos;t exist or is not
              published.
            </p>
          </div>
          <Link
            href={`/${handle}`}
            className="inline-flex px-6 py-3 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors font-light"
          >
            Back to creator
          </Link>
        </div>
      </div>
    );
  }

  const { creator, issue } = data;

  const displayName =
    creator.displayName || creator.user?.name || creator.handle;

  const published = issue.publishedAt
    ? new Date(issue.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-light tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            Newsletter<span className="font-normal">.ai</span>
          </Link>
          <Link
            href={`/${creator.handle}`}
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-light"
          >
            More from {displayName}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <article className="space-y-12">
          {/* Article Header */}
          <header className="space-y-6 border-b border-neutral-200 pb-10">
            <div className="space-y-3">
              <h1 className="text-5xl font-light tracking-tight text-neutral-900 leading-tight">
                {issue.title}
              </h1>
              {issue.emailIntro && (
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  {issue.emailIntro}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-3">
                {creator.avatarUrl || creator.user?.image ? (
                  <img
                    src={creator.avatarUrl || creator.user?.image || ""}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <Link
                    href={`/${creator.handle}`}
                    className="text-sm font-medium text-neutral-900 hover:text-indigo-600 transition-colors block"
                  >
                    {displayName}
                  </Link>
                  <p className="text-xs text-neutral-500">@{creator.handle}</p>
                </div>
              </div>

              <div className="h-8 w-px bg-neutral-200"></div>

              <div className="text-xs text-neutral-500 space-y-0.5">
                {published && <p>{published}</p>}
                <p>{issue.viewCount.toLocaleString()} views</p>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div
            className="prose prose-lg prose-neutral max-w-none
              prose-headings:font-light prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mt-12 prose-h1:mb-6
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:font-light
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:text-indigo-700 hover:prose-a:underline prose-a:transition-all
              prose-blockquote:border-l-2 prose-blockquote:border-neutral-300 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-neutral-600 prose-blockquote:font-light
              prose-strong:font-medium prose-strong:text-neutral-900
              prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:text-neutral-800 prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-neutral-900 prose-pre:text-neutral-100
              prose-ul:list-disc prose-ol:list-decimal
              prose-li:text-neutral-700 prose-li:font-light
              prose-img:rounded-lg prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: issue.htmlContent }}
          />
        </article>

        {/* Footer CTA */}
        <div className="mt-16 pt-12 border-t border-neutral-200">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center space-y-4">
            <h3 className="text-2xl font-light text-neutral-900">
              Enjoyed this issue?
            </h3>
            <p className="text-neutral-600 font-light">
              Subscribe to get {displayName}&apos;s latest insights delivered to
              your inbox.
            </p>
            <Link
              href={`/${creator.handle}`}
              className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-light text-sm"
            >
              Subscribe to Newsletter
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-200 mt-20">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
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
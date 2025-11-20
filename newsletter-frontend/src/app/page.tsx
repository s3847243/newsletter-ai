import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-x-0 top-[-200px] -z-10 h-[400px] bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.35),_transparent_65%)]" />

      {/* Page container */}
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Navbar */}
        <header className="flex items-center justify-between py-4 sm:py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/40">
              <span className="text-xs font-bold text-indigo-200">AI</span>
            </div>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Newsletter Copilot
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-slate-200 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-indigo-500 px-3 py-1.5 font-medium text-white shadow-sm shadow-indigo-500/40 hover:bg-indigo-400"
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex flex-1 flex-col gap-12 py-6 sm:py-10 lg:flex-row lg:items-center lg:gap-16">
          {/* Hero left */}
          <section className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-slate-300">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI-native newsletter platform for solo creators
            </div>

            <div className="space-y-4">
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Write, publish, and grow your newsletter — with an{" "}
                <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                  AI copilot
                </span>
                .
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Draft issues in minutes, send them with Mailgun, and grow an
                audience through followers and email subscribers. It&apos;s like
                Substack + Beehiiv + ChatGPT — but simpler and built for speed.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow shadow-indigo-500/40 hover:bg-indigo-400"
              >
                Start writing for free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-500"
              >
                View dashboard demo
              </Link>
            </div>

            <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-3 sm:text-[11px]">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <p className="font-medium text-slate-100">
                  AI drafting &amp; rewriting
                </p>
                <p className="mt-1 text-slate-400">
                  Highlight text to improve, shorten, change tone, or fix
                  grammar instantly.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <p className="font-medium text-slate-100">
                  Followers &amp; email subscribers
                </p>
                <p className="mt-1 text-slate-400">
                  Build a public profile, collect subscribers, and send new
                  issues with one click.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <p className="font-medium text-slate-100">Timeline feed</p>
                <p className="mt-1 text-slate-400">
                  See a feed of issues from creators you follow — like a focused
                  Twitter for newsletters.
                </p>
              </div>
            </div>
          </section>

          {/* Hero right – fake UI preview */}
          <section className="flex-1">
            <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-2xl shadow-indigo-900/40 backdrop-blur">
              {/* Window header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                </div>
                <span className="text-[10px] text-slate-400">
                  Editor • Draft
                </span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[3fr_2fr]">
                {/* Editor mock */}
                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="h-6 w-2/3 rounded-md bg-slate-800/80" />
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {["Improve", "Shorten", "Friendlier", "Formal", "Fix grammar"].map(
                      (label) => (
                        <span
                          key={label}
                          className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300"
                        >
                          {label}
                        </span>
                      )
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded bg-slate-800/70" />
                    <div className="h-2 w-11/12 rounded bg-slate-800/70" />
                    <div className="h-2 w-9/12 rounded bg-slate-800/60" />
                    <div className="h-2 w-10/12 rounded bg-slate-800/50" />
                  </div>
                </div>

                {/* Copilot mock */}
                <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[10px]">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-slate-100">
                      AI Copilot
                    </span>
                    <span className="text-[9px] text-emerald-300">
                      • Ready
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="space-y-1 rounded-md bg-slate-900 p-2">
                      <p className="font-semibold text-slate-100">You</p>
                      <p className="text-slate-300">
                        Make this intro more engaging but keep it concise.
                      </p>
                    </div>
                    <div className="space-y-1 rounded-md bg-indigo-950/60 p-2 ring-1 ring-indigo-500/40">
                      <p className="font-semibold text-indigo-100">Copilot</p>
                      <p className="text-slate-200">
                        Hook the reader with a single clear outcome, then tease
                        one practical takeaway from this issue.
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] text-slate-200">
                          Insert at cursor
                        </span>
                        <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] text-slate-200">
                          Replace selection
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="h-7 rounded-md bg-slate-900/80" />
                    <div className="flex justify-end gap-2">
                      <span className="h-6 w-14 rounded-md bg-indigo-600/80" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-400">
                <span>AI-assisted newsletter editor</span>
                <span>Mailgun • Postgres • Next.js</span>
              </div>
            </div>
          </section>
        </main>

        {/* Secondary section */}
        <section className="mb-10 mt-4 grid gap-6 border-t border-slate-800 py-8 text-xs text-slate-300 sm:grid-cols-3 sm:text-[11px]">
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">For solo creators</p>
            <p>
              Whether you&apos;re writing about tech, investing, or lifestyle,
              keep everything in one place: writing, publishing, and
              distribution.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">
              Zero-setup infrastructure
            </p>
            <p>
              Hosted on Next.js with Postgres, Prisma, and Mailgun. You focus on
              your content, not on wiring servers and SMTP.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">AI that fits in</p>
            <p>
              No juggling separate tools. Inline rewrites, AI subject lines, and
              a chat-style copilot — all inside your editor.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mb-6 flex flex-col items-center justify-between gap-3 border-t border-slate-900 pt-4 text-[11px] text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Newsletter Copilot</span>
          <div className="flex items-center gap-3">
            <span>Built with Next.js + Postgres + Mailgun</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

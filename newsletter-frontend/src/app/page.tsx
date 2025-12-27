import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.08),_transparent_50%)] pointer-events-none" />
      
      {/* Navigation */}
      <nav className="relative z-10 border-b border-neutral-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-xl font-light tracking-tight text-neutral-900">
                Newsletter<span className="font-semibold">.ai</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors">
                Sign in
              </a>
              <a href="/register" className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-all">
                Get Started Free
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-16 lg:px-8 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5">
                <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-sm font-light text-sky-900">AI-powered newsletter platform</span>
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-light tracking-tight text-neutral-900 leading-tight">
                  Write newsletters
                  <br />
                  <span className="font-normal text-sky-600">
                    that sound like you
                  </span>
                </h1>
                
                <p className="text-xl font-light text-neutral-600 leading-relaxed max-w-xl">
                  An intelligent editor that learns your unique writing style and helps you craft newsletters your audience will love—faster and better than ever before.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-8 py-4 text-base font-medium text-white hover:bg-neutral-800 transition-all">
                  Start Writing Free
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a href="#demo" className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-8 py-4 text-base font-light text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition-all">
                  Watch Demo
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
              </div>

              <div className="flex items-center gap-8 pt-4">
                {/* <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 ring-2 ring-white" />
                  ))}
                </div> */}
                {/* <div className="text-sm font-light text-neutral-600">
                  <span className="font-medium text-neutral-900">500+</span> creators already writing smarter
                </div> */}
              </div>
            </div>

            {/* Right - Editor Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-3xl blur-3xl opacity-10" />
              <div className="relative rounded-3xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center text-xs text-neutral-500 font-light">
                    Editor • AI Active
                  </div>
                </div>

                {/* Editor Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="h-8 w-3/4 bg-neutral-100 rounded-lg animate-pulse" />
                    <div className="flex gap-2">
                      {['Bold', 'Italic', 'Link', 'AI'].map((btn) => (
                        <div key={btn} className="px-3 py-1.5 bg-neutral-100 rounded-lg text-xs text-neutral-600">
                          {btn}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-3 w-full bg-neutral-100 rounded" />
                    <div className="h-3 w-11/12 bg-neutral-100 rounded" />
                    <div className="h-3 w-10/12 bg-sky-50 border border-sky-200 rounded relative">
                      <div className="absolute -right-2 -top-8 bg-neutral-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
                        ✨ AI Suggestion
                      </div>
                    </div>
                    <div className="h-3 w-9/12 bg-neutral-100 rounded" />
                  </div>

                  {/* AI Assistant Panel */}
                  <div className="border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-neutral-900 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-neutral-900">AI Writing Assistant</span>
                    </div>
                    <p className="text-xs text-neutral-600 font-light leading-relaxed">
                      "This paragraph could be more engaging. Try starting with a question to hook your readers immediately."
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs hover:bg-neutral-800">
                        Apply
                      </button>
                      <button className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-700 hover:bg-neutral-50">
                        Rewrite
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 lg:px-8 bg-neutral-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-neutral-900">
              An editor that <span className="font-normal">understands you</span>
            </h2>
            <p className="text-lg font-light text-neutral-600 max-w-2xl mx-auto">
              Powered by AI that learns from your writing patterns and adapts to your unique voice
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: "Smart Suggestions",
                description: "Real-time AI recommendations that improve clarity, tone, and engagement based on your writing style."
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                ),
                title: "Learns Your Rhythm",
                description: "The AI adapts to your unique voice, sentence structure, and preferred vocabulary over time."
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Instant Improvements",
                description: "Highlight any text to get instant AI-powered rewrites, tone adjustments, or grammar fixes."
              }
            ].map((feature, i) => (
              <div key={i} className="group relative rounded-2xl border border-neutral-200 bg-white p-8 hover:shadow-xl transition-all hover:border-sky-300">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-light text-neutral-900">{feature.title}</h3>
                  <p className="text-neutral-600 font-light leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Vision Section */}
      <section className="relative z-10 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-neutral-900 p-12 lg:p-16 text-center space-y-8 shadow-2xl">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-white">
                The future of personalized writing
              </h2>
              <p className="text-xl font-light text-neutral-300 max-w-3xl mx-auto">
                Soon, Newsletter.ai will train personalized AI models on your entire writing history—understanding not just what you write, but how you think, your unique perspectives, and your authentic voice.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 text-left">
              {[
                "AI trained on your complete writing style",
                "Personalized suggestions that sound like you",
                "Smart content recommendations based on your audience"
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <svg className="h-6 w-6 text-sky-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-200 font-light">{text}</span>
                </div>
              ))}
            </div>

            <a href="/register" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-neutral-900 hover:bg-neutral-100 transition-all">
              Be an Early Adopter
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-200 bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-sm font-light text-neutral-600">
                © 2025 Newsletter.ai — AI-powered writing for modern creators
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm font-light text-neutral-600">
              <a href="/privacy" className="hover:text-neutral-900 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-neutral-900 transition-colors">Terms</a>
              <a href="/contact" className="hover:text-neutral-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
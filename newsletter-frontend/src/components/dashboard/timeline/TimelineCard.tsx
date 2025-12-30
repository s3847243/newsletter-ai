import { TimelineItem } from "@/types/timeline";
import Link from "next/link";
import React from "react";
import Image from "next/image";
export const TimelineCard = React.memo(function TimelineCard({ item }: { item: TimelineItem }) {  
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
            <Image
                src={item.creator.avatarUrl}
                alt={item.creator.displayName}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                sizes="48px"
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
});
"use client";

import Image from "next/image";

type FollowListItem = {
  handle: string | null;
  displayName: string;
  avatarUrl: string | null;
  followedAt: string;
};

export default function FollowModal(props: {
  type: "followers" | "following";
  loading: boolean;
  items: FollowListItem[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-sm font-medium">
            {props.type === "followers" ? "Followers" : "Following"}
          </h3>
          <button
            onClick={props.onClose}
            className="text-neutral-500 hover:text-neutral-900"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-auto">
          {props.loading ? (
            <p className="text-sm text-neutral-500">Loading...</p>
          ) : props.items.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing here yet.</p>
          ) : (
            <div className="space-y-3">
              {props.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {it.avatarUrl ? (
                      <Image
                        src={it.avatarUrl}
                        alt={`${it.displayName} avatar`}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-neutral-200" />
                    )}

                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{it.displayName}</div>
                      {it.handle && (
                        <div className="text-xs text-neutral-500 truncate">@{it.handle}</div>
                      )}
                    </div>
                  </div>

                  {it.handle && (
                    <a href={`/${it.handle}`} className="text-xs text-indigo-600 hover:underline">
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

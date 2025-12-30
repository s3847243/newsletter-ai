"use client";

import React from "react";
import Image from "next/image";

export default React.memo(function ProfilePreview(props: {
  baseUrl: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  niche: string;
  followersCount: number;
  followingCount: number;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
}) {
  const publicUrl = `${props.baseUrl}/${props.handle || "yourhandle"}`;

  return (
    <>
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm sticky top-6">
        <h3 className="text-lg font-light tracking-tight text-neutral-900 mb-6">
          Profile Preview
        </h3>

        <div className="space-y-6">
          <div className="flex justify-center">
            {props.avatarUrl ? (
              <img src={props.avatarUrl} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-light">
                {props.displayName ? props.displayName.charAt(0).toUpperCase() : "?"}
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-xl font-light text-neutral-900">
              {props.displayName || "Your Name"}
            </h4>
            <p className="text-sm text-neutral-500 font-light">
              @{props.handle || "yourhandle"}
            </p>
          </div>

          {props.niche && (
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-light rounded-full">
                {props.niche}
              </span>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-100">
            <p className="text-sm text-neutral-600 font-light leading-relaxed text-center">
              {props.bio || "Your bio will appear here..."}
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-500 font-light text-center">
              Public profile:
            </p>
            <p className="text-xs text-indigo-600 font-light text-center truncate mt-1">
              {publicUrl}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={props.onOpenFollowers}
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left hover:bg-neutral-100 cursor-pointer"
        >
          <div className="text-lg font-medium text-neutral-900">
            {props.followersCount}
          </div>
          <div className="text-xs text-neutral-500 font-light">Followers</div>
        </button>

        <button
          type="button"
          onClick={props.onOpenFollowing}
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left hover:bg-neutral-100 cursor-pointer"
        >
          <div className="text-lg font-medium text-neutral-900">
            {props.followingCount}
          </div>
          <div className="text-xs text-neutral-500 font-light">Following</div>
        </button>
      </div>
    </>
  );
});

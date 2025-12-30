"use client";

import React, { FormEvent } from "react";
import { CreatorProfile } from "@/types/creator";

export default function ProfileForm(props: {
  loading: boolean;  
  baseUrl: string;
  profile: CreatorProfile | null;

  handle: string;
  setHandle: (v: string) => void;

  displayName: string;
  setDisplayName: (v: string) => void;

  bio: string;
  setBio: (v: string) => void;

  avatarUrl: string;
  setAvatarUrl: (v: string) => void;

  niche: string;
  setNiche: (v: string) => void;

  handleStatus: "idle" | "checking" | "available" | "taken" | "invalid" | "error";

  saving: boolean;
  error: string | null;
  success: string | null;

  onSubmit: () => Promise<void>;
}) {
  const hasProfile = !!props.profile;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await props.onSubmit();
  };

  return (
    <div className=" relative bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
       {props.loading && (
        <div className="absolute inset-0 rounded-3xl bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-neutral-200 border-r-neutral-900"></div>
            <p className="mt-4 text-neutral-600 font-light">
              Loading profile…
            </p>
          </div>
        </div>
      )}
      {props.error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl p-4 font-light">
          {props.error}
        </div>
      )}
      {props.success && (
        <div className="mb-6 text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl p-4 font-light flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {props.success}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-2">
            Handle <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
            <span className="text-sm text-neutral-500 font-light">
              {props.baseUrl}/
            </span>
            <input
              type="text"
              className="flex-1 bg-transparent text-sm font-light focus:outline-none placeholder:text-neutral-400"
              value={props.handle}
              onChange={(e) =>
                props.setHandle(e.target.value.toLowerCase().replace(/\s+/g, ""))
              }
              required
              placeholder="yourname"
            />
          </div>

          <p className="text-xs text-neutral-500 font-light mt-2">
            Your public URL:{" "}
            <code className="bg-neutral-100 px-1.5 py-0.5 rounded">
              /{props.handle || "yourname"}
            </code>
          </p>

          <div className="mt-2 text-xs font-light">
            {props.handleStatus === "checking" && (
              <span className="text-neutral-500">Checking availability...</span>
            )}
            {props.handleStatus === "available" && (
              <span className="text-green-600">✅ Handle is available</span>
            )}
            {props.handleStatus === "taken" && (
              <span className="text-red-600">❌ Handle is taken</span>
            )}
            {props.handleStatus === "invalid" && (
              <span className="text-red-600">
                Handle must be 3–30 chars (a–z, 0–9, underscore)
              </span>
            )}
            {props.handleStatus === "error" && (
              <span className="text-red-600">Couldn’t check handle</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-2">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400"
            value={props.displayName}
            onChange={(e) => props.setDisplayName(e.target.value)}
            required
            placeholder="Your public name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-2">Bio</label>
          <textarea
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400 resize-none"
            value={props.bio}
            onChange={(e) => props.setBio(e.target.value)}
            rows={4}
            placeholder="Tell readers what you write about..."
          />
          <p className="text-xs text-neutral-500 font-light mt-2">
            {props.bio.length} / 500 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-2">Avatar URL</label>
          <input
            type="url"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400"
            value={props.avatarUrl}
            onChange={(e) => props.setAvatarUrl(e.target.value)}
            placeholder="https://example.com/your-avatar.jpg"
          />
          <p className="text-xs text-neutral-500 font-light mt-2">Link to your profile picture</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-2">Niche</label>
          <input
            type="text"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400"
            value={props.niche}
            onChange={(e) => props.setNiche(e.target.value)}
            placeholder="AI, indie hacking, design, etc."
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={
              props.saving ||
              props.handleStatus === "checking" ||
              props.handleStatus === "taken" ||
              props.handleStatus === "invalid"
            }
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-light hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
          >
            {props.saving
              ? hasProfile
                ? "Saving changes..."
                : "Creating profile..."
              : hasProfile
              ? "Save changes"
              : "Create profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

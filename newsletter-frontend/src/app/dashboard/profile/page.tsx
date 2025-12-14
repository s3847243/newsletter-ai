"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { CreatorProfile } from "@/types/creator";
import { API_BASE_URL } from "@/lib/config";
export default function ProfilePage() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "error"
  >("idle");

  useEffect(() => {
    const h = handle.trim().toLowerCase();

    if (!h) {
      setHandleStatus("idle");
      return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(h)) {
      setHandleStatus("invalid");
      return;
    }

    setHandleStatus("checking");

    const t = setTimeout(async () => {
      try {
        const currentHandle = profile?.handle ? `&currentHandle=${encodeURIComponent(profile.handle)}` : "";
        const data = await apiFetch<{ available: boolean }>(
          `/public/creators/slug-available?handle=${encodeURIComponent(h)}${currentHandle}`
        );

        setHandleStatus(data.available ? "available" : "taken");
      } catch {
        setHandleStatus("error");
      }
    }, 500);

    return () => clearTimeout(t);
  }, [handle, profile?.handle]);


  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<CreatorProfile>("/creator-profile/me", {});
        if (!cancelled) {
          setProfile(data);
          setHandle(data.handle);
          setDisplayName(data.displayName);
          setBio(data.bio ?? "");
          setAvatarUrl(data.avatarUrl ?? "");
          setNiche(data.niche ?? "");
        }
      } catch (err: any) {
        const apiErr = err as ApiError;
        if (apiErr.status === 404) {
          if (!cancelled) {
            setProfile(null);
          }
        } else {
          if (!cancelled) {
            setError(apiErr.message || "Failed to load profile");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const normalized = handle.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
      setError("Handle must be 3–30 chars (a–z, 0–9, underscore).");
      setSaving(false);
      return;
    }

    if (handleStatus !== "available") {
      setError("Please choose an available handle before saving.");
      setSaving(false);
      return;
    }
    const payload = {
      handle: normalized,
      displayName,
      bio: bio ? bio : null,
      avatarUrl: avatarUrl ? avatarUrl : null,
      niche: niche ? niche : null,
    };


    try {
      let result: CreatorProfile;
      if (profile) {
        result = await apiFetch<CreatorProfile>("/creator-profile", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        result = await apiFetch<CreatorProfile>("/creator-profile", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setProfile(result);
      setSuccess("Profile saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-neutral-200 border-r-neutral-900"></div>
          <p className="mt-4 text-neutral-600 font-light">Loading profile...</p>
        </div>
      </div>
    );
  }

  const hasProfile = !!profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light tracking-tight text-neutral-900 mb-3">
            {hasProfile ? "Edit Profile" : "Create Your Profile"}
          </h1>
          <p className="text-lg text-neutral-600 font-light">
            This is how readers will discover and connect with you
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
              {error && (
                <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl p-4 font-light">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl p-4 font-light flex items-center gap-2">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {success}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Handle <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
                    <span className="text-sm text-neutral-500 font-light">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/`
                        : "yourdomain.com/"}
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent text-sm font-light focus:outline-none placeholder:text-neutral-400"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      required
                      placeholder="yourname"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 font-light mt-2">
                    Your public URL: <code className="bg-neutral-100 px-1.5 py-0.5 rounded">/{handle || "yourname"}</code>
                  </p>
                  <div className="mt-2 text-xs font-light">
                    {handleStatus === "checking" && <span className="text-neutral-500">Checking availability...</span>}
                    {handleStatus === "available" && <span className="text-green-600">✅ Handle is available</span>}
                    {handleStatus === "taken" && <span className="text-red-600">❌ Handle is taken</span>}
                    {handleStatus === "invalid" && (
                      <span className="text-red-600">Handle must be 3–30 chars (a–z, 0–9, underscore)</span>
                    )}
                    {handleStatus === "error" && <span className="text-red-600">Couldn’t check handle</span>}
                  </div>

                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="Your public name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Bio
                  </label>
                  <textarea
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400 resize-none"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell readers what you write about..."
                  />
                  <p className="text-xs text-neutral-500 font-light mt-2">
                    {bio.length} / 500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/your-avatar.jpg"
                  />
                  <p className="text-xs text-neutral-500 font-light mt-2">
                    Link to your profile picture
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Niche
                  </label>
                  <input
                    type="text"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-neutral-400"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="AI, indie hacking, design, etc."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving || handleStatus === "checking" || handleStatus === "taken" || handleStatus === "invalid"}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-light hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                  >
                    {saving
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
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm sticky top-6">
              <h3 className="text-lg font-light tracking-tight text-neutral-900 mb-6">
                Profile Preview
              </h3>

              <div className="space-y-6">
                {/* Avatar preview */}
                <div className="flex justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || "Avatar"}
                      className="w-24 h-24 rounded-full object-cover border-4 border-neutral-100"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-light">
                      {displayName ? displayName.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                </div>

                {/* Name & handle */}
                <div className="text-center space-y-1">
                  <h4 className="text-xl font-light text-neutral-900">
                    {displayName || "Your Name"}
                  </h4>
                  <p className="text-sm text-neutral-500 font-light">
                    @{handle || "yourhandle"}
                  </p>
                </div>

                {/* Niche badge */}
                {niche && (
                  <div className="flex justify-center">
                    <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-light rounded-full">
                      {niche}
                    </span>
                  </div>
                )}

                {/* Bio */}
                <div className="pt-4 border-t border-neutral-100">
                  <p className="text-sm text-neutral-600 font-light leading-relaxed text-center">
                    {bio || "Your bio will appear here..."}
                  </p>
                </div>

                {/* Public link */}
                <div className="pt-4 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 font-light text-center">
                    Public profile:
                  </p>
                  <p className="text-xs text-indigo-600 font-light text-center truncate mt-1">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/${handle || "yourhandle"}`
                      : `yourdomain.com/${handle || "yourhandle"}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
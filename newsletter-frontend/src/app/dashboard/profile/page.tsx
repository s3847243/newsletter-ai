"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { CreatorProfile } from "@/types/creator";

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

  // Load existing profile (if any)
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<CreatorProfile>(
          "/creator-profile/me",
          {}
        );
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
          // No profile yet – this is fine
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

    const payload = {
      handle,
      displayName,
      bio: bio || undefined,
      avatarUrl: avatarUrl || undefined,
      niche: niche || undefined,
    };

    try {
      let result: CreatorProfile;
      if (profile) {
        // Update
        result = await apiFetch<CreatorProfile>(
          "/creator-profile",
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Create
        result = await apiFetch<CreatorProfile>(
          "/creator-profile",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }
      setProfile(result);
      setSuccess("Profile saved successfully.");
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  const hasProfile = !!profile;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {hasProfile ? "Edit creator profile" : "Set up your creator profile"}
        </h2>
        <p className="text-sm text-gray-600">
          This is how readers will see you on your public creator page.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded p-2">
          {success}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Handle <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {typeof window !== "undefined"
                ? `${window.location.origin}/`
                : "yourdomain.com/"}
            </span>
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
              placeholder="yourname"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Public URL for your creator page, e.g.{" "}
            <code>/{handle || "yourname"}</code>. Only letters, numbers, and
            underscores (backend is enforcing).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Display name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="Your public name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="What do you write about?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <input
            type="url"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Niche</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="AI, indie hacking, design, etc."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving
            ? hasProfile
              ? "Saving..."
              : "Creating..."
            : hasProfile
            ? "Save changes"
            : "Create profile"}
        </button>
      </form>
    </div>
  );
}

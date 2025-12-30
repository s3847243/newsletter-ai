"use client"
import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { CreatorProfile } from "@/types/creator";
import ProfileForm from "@/components/dashboard/profile/ProfileForm";
import ProfilePreview from "@/components/dashboard/profile/ProfilePreview";
import dynamic from "next/dynamic";

const FollowModal = dynamic(() => import("./FollowModal"), {
  ssr: false,
});
type FollowListItem = {
  userId?: string;
  creatorId?: string;
  handle: string | null;
  displayName: string;
  avatarUrl: string | null;
  followedAt: string;
};
export interface FollowUserListItem {
  userId: string;
  displayName: string;
  handle: string | null;      
  avatarUrl: string | null;
  followedAt: string;
}

export interface FollowCreatorListItem {
  creatorId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  followedAt: string;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}


export default function ProfileClient() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

    const [form, setForm] = useState({
    handle: "",
    displayName: "",
    bio: "",
    avatarUrl: "",
    niche: "",
    });

  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "error"
  >("idle");
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following">("followers");
  const [followItems, setFollowItems] = useState<FollowListItem[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://newsletter-ai-ashy.vercel.app/");
  const handleCache = useRef(new Map<string, boolean>());
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => setBaseUrl(window.location.origin), []);
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<CreatorProfile>("/creator-profile/me", { method: "GET" });
        if (cancelled) return;

        setProfile(data);
        setForm({
            handle: data.handle,
            displayName: data.displayName,
            bio: data.bio ?? "",
            avatarUrl: data.avatarUrl ?? "",
            niche: data.niche ?? "",
        });
      } catch (err: any) {
        const apiErr = err as ApiError;
        if (apiErr.status !== 404 && !cancelled) {
          setError(apiErr.message || "Failed to load profile");
        }
        if (apiErr.status === 404 && !cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const h = form.handle.trim().toLowerCase();

    if (!h) {
      setHandleStatus("idle");
      return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(h)) {
      setHandleStatus("invalid");
      return;
    }
    if (handleCache.current.has(h)) {
      const available = handleCache.current.get(h)!;
      setHandleStatus(available ? "available" : "taken");
      return;
    }
    setHandleStatus("checking");

    const t = setTimeout(async () => {
      try {
        const currentHandle = profile?.handle ? `&currentHandle=${encodeURIComponent(profile.handle)}` : "";
        const data = await apiFetch<{ available: boolean }>(
          `/public/creators/slug-available?handle=${encodeURIComponent(h)}${currentHandle}`
        );
        handleCache.current.set(h, data.available);
        setHandleStatus(data.available ? "available" : "taken");
      } catch {
        setHandleStatus("error");
      }
    }, 350);

    return () => clearTimeout(t);
  }, [form.handle, profile?.handle]);

  const onSubmit = async () => {

    setSaving(true);
    setError(null);
    setSuccess(null);

    const normalized = form.handle.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
      setError("Handle must be 3–30 chars (a–z, 0–9, underscore).");
      setSaving(false);
      return;
    }
    const handleUnchanged = profile?.handle === normalized;
    if (!handleUnchanged && handleStatus !== "available") {
      setError("Please choose an available handle before saving.");
      setSaving(false);
      return;
    }
    
    const payload = {
    handle: normalized,
    displayName: form.displayName,
    bio: form.bio ? form.bio : null,
    avatarUrl: form.avatarUrl ? form.avatarUrl : null,
    niche: form.niche ? form.niche : null,
    };


     try {
      const result = await apiFetch<CreatorProfile>("/creator-profile", {
        method: profile ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setProfile(result);
      setSuccess("Profile saved successfully.");
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };
  const loadFollowList = async (type: "followers" | "following") => {
    setFollowLoading(true);
    try {
      const data = await apiFetch<{ items: FollowListItem[] }>(
        `/creator-profile/me/${type}?page=1&pageSize=50`,
        { method: "GET" }
      );
      setFollowItems(data.items);
    } finally {
      setFollowLoading(false);
    }
  };


  const openFollowers = async () => {
  setFollowModalType("followers");
  setFollowModalOpen(true);
  await loadFollowList("followers");
  };

  const openFollowing = async () => {
    setFollowModalType("following");
    setFollowModalOpen(true);
    await loadFollowList("following");
  };


  return (
    <div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-light tracking-tight text-neutral-900 mb-3">
            {profile ? "Edit Profile" : "Create Your Profile"}
          </h1>
          <p className="text-lg text-neutral-600 font-light">
            This is how readers will discover and connect with you
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

             <ProfileForm
             loading= {loading}
              baseUrl={baseUrl}
              profile={profile}
              handle={form.handle}
            setHandle={(v) => setField("handle", v)}
            displayName={form.displayName}
            setDisplayName={(v) => setField("displayName", v)}
            bio={form.bio}
            setBio={(v) => setField("bio", v)}
            avatarUrl={form.avatarUrl}
            setAvatarUrl={(v) => setField("avatarUrl", v)}
            niche={form.niche}
            setNiche={(v) => setField("niche", v)}
              handleStatus={handleStatus}
              saving={saving}
              error={error}
              success={success}
              onSubmit={onSubmit}
            />
          </div>

          <div className="lg:col-span-1">


               <ProfilePreview
                baseUrl={baseUrl}
                handle={form.handle}
                displayName={form.displayName}
                bio={form.bio}
                avatarUrl={form.avatarUrl}
                niche={form.niche}
                followersCount={profile?._count?.followers ?? 0}
                followingCount={profile?.followingCount ?? 0}
                onOpenFollowers={openFollowers}
                onOpenFollowing={openFollowing}
              />
          </div>
        </div>
      </div>
      {followModalOpen && (

          <FollowModal
            type={followModalType}
            loading={followLoading}
            items={followItems}
            onClose={() => setFollowModalOpen(false)}
          />
        )}
    </div>
  );
}

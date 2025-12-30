"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

export default function ViewCount({ handle, slug, initial }: { handle: string; slug: string; initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/creators/${handle}/issues/${slug}/views`, {
          next: { revalidate: 60 }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.viewCount === "number") setCount(data.viewCount);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [handle, slug]);

  return <p>{count.toLocaleString()} views</p>;
}

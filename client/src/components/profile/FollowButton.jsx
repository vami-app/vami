"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

/**
 * Follow / unfollow toggle for an author's profile.
 * @param {{ username: string, initialFollowing: boolean, initialCount: number }} props
 */
export default function FollowButton({ username, initialFollowing, initialCount }) {
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(Boolean(initialFollowing));
  const [count, setCount] = useState(initialCount || 0);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!user) {
      router.push(`/login?next=/@${username}`);
      return;
    }
    setBusy(true);
    const optimistic = !following;
    setFollowing(optimistic);
    setCount((c) => c + (optimistic ? 1 : -1));
    try {
      const data = await api.post(`/api/users/${username}/follow`);
      setFollowing(data.following);
      setCount(data.followersCount);
    } catch (err) {
      setFollowing(!optimistic);
      setCount((c) => c + (optimistic ? -1 : 1));
      if (err instanceof ApiError && err.status === 401) router.push("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={following ? "secondary" : "primary"} size="sm" onClick={toggle} disabled={busy}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}

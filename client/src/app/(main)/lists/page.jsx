"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ReadingListsPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [createErr, setCreateErr] = useState("");

  const fetchLists = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lists/mine");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch lists");
      setLists(json.data.lists);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchLists();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateErr("");
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, visibility }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create list");
      setName("");
      fetchLists();
    } catch (err) {
      setCreateErr(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this list?")) return;
    try {
      const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete list");
      fetchLists();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink">Your Reading Lists</h1>
        <p className="mt-2 text-ink-soft">Please sign in to view and manage your reading lists.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-ink mb-6">Your Reading Lists</h1>

      {/* Create List Form */}
      <form onSubmit={handleCreate} className="mb-8 rounded-lg bg-gray-50 p-4 border border-gray-200 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="New list name (e.g. Must Read, Architecture)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[200px] rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          required
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
        <button
          type="submit"
          className="rounded bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 transition"
        >
          Create List
        </button>
        {createErr && <p className="w-full text-xs text-red-600 font-medium mt-1">{createErr}</p>}
      </form>

      {/* Lists Grid */}
      {loading ? (
        <div className="py-12 text-center text-ink-soft">Loading reading lists...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600 font-medium">{error}</div>
      ) : lists.length === 0 ? (
        <div className="py-12 text-center text-ink-soft">
          You haven't created any reading lists yet. Create your first list above!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <div key={list.id} className="flex flex-col justify-between rounded-lg border border-gray-200 p-5 shadow-sm bg-white hover:border-gray-300 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${list.visibility === 'public' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {list.visibility}
                  </span>
                  <span className="text-xs text-ink-soft">{list.postsCount} stories</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-ink mt-3">
                  <Link href={`/lists/${list.slug}?username=${user.username}`} className="hover:underline">
                    {list.name}
                  </Link>
                </h3>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                <Link
                  href={`/lists/${list.slug}?username=${user.username}`}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  View stories &rarr;
                </Link>
                <button
                  onClick={() => handleDelete(list.id)}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function AddToListModal({ postId, postSlug, onClose }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedListIds, setAddedListIds] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");

  const fetchMine = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lists/mine");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load lists");
      setLists(json.data.lists);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const handleAddToList = async (listId) => {
    try {
      const res = await fetch(`/api/lists/${listId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, postSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to add story to list");
      setAddedListIds((prev) => [...prev, listId]);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListTitle, visibility: "private" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create list");
      const newList = json.data.list;
      setNewListTitle("");
      await handleAddToList(newList.id);
      fetchMine();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <h3 className="font-serif text-xl font-bold text-ink">Save story to list</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-sm font-bold">
            &times;
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-ink-soft text-sm">Loading your reading lists...</div>
        ) : error ? (
          <div className="py-4 text-center text-xs text-red-600 font-medium">{error}</div>
        ) : (
          <div className="space-y-4">
            {lists.length === 0 ? (
              <p className="text-xs text-ink-soft">No reading lists found. Create one below!</p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                {lists.map((list) => {
                  const isAdded = addedListIds.includes(list.id);
                  return (
                    <div key={list.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-ink">{list.name}</p>
                        <p className="text-[11px] text-ink-soft capitalize">{list.visibility} &bull; {list.postsCount} stories</p>
                      </div>
                      <button
                        onClick={() => handleAddToList(list.id)}
                        disabled={isAdded}
                        className={`px-3 py-1 text-xs font-semibold rounded transition ${
                          isAdded
                            ? "bg-emerald-100 text-emerald-700 cursor-default"
                            : "bg-gray-100 text-ink hover:bg-accent hover:text-white"
                        }`}
                      >
                        {isAdded ? "Saved ✓" : "Save"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Create List Form */}
            <form onSubmit={handleCreateAndAdd} className="pt-4 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                placeholder="New list title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90"
              >
                Create & Save
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

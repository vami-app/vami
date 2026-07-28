"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = (currentPage = 1, currentSearch = "") => {
    setLoading(true);
    setError("");
    api
      .get(`/api/admin/users?page=${currentPage}&limit=10&search=${encodeURIComponent(currentSearch)}`)
      .then((res) => {
        setUsers(res.users);
        setPage(res.pagination.page);
        setTotalPages(res.pagination.pages);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load users list.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers(1, search);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const handleBanToggle = async (userId, currentStatus, currentRole) => {
    setError("");
    setSuccess("");
    const action = currentStatus === "banned" ? "unban" : "ban";
    try {
      const res = await api.patch(`/api/admin/users/${userId}/${action}`);
      setSuccess(`User ${res.user.name} successfully ${action}ned.`);
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: res.user.status } : u))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${action} user.`);
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    setError("");
    setSuccess("");
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await api.patch(`/api/admin/users/${userId}/role`, { role: nextRole });
      setSuccess(`User ${res.user.name} role updated to ${nextRole}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: res.user.role } : u))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">User Management</h1>
        <p className="text-sm text-ink-soft">Review accounts, ban/unban users, or adjust access privileges.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, or email..."
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
        <Button type="submit" size="sm">Search</Button>
      </form>

      {/* User Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-ink-soft py-12 text-center">No users matched your search criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <th className="px-6 py-3">User Details</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Stories</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-ink">{u.name}</span>
                        <span className="text-xs text-ink-soft">@{u.username} · {u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.status === "banned" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-soft">{u.postCount}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleRoleToggle(u.id, u.role)}
                        >
                          Toggle Role
                        </Button>
                        <button
                          onClick={() => handleBanToggle(u.id, u.status, u.role)}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                            u.status === "banned"
                              ? "bg-green-50 text-green-600 hover:bg-green-100"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {u.status === "banned" ? "Unban" : "Ban"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-soft">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => fetchUsers(page - 1, search)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => fetchUsers(page + 1, search)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

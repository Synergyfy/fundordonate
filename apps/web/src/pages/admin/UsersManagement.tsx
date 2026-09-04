import { useEffect, useState } from "react";
import { adminApi } from "@/services/admin.service";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  _count: { donations: number; pledges: number; campaigns: number };
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  fundraiser: "bg-blue-100 text-blue-700",
  collaborator: "bg-indigo-100 text-indigo-700",
  backer: "bg-green-100 text-green-700",
  donor: "bg-gray-100 text-gray-600",
};

const formatDate = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({ page, limit: 20, role: roleFilter || undefined, search: search || undefined });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, roleFilter]);

  const handleSearch = () => { setPage(1); load(); };

  const handleRole = async (userId: string, role: string) => {
    if (!confirm(`Change user role to ${role}?`)) return;
    await adminApi.updateUserRole(userId, role);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-400">{users.length} users</span>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2">
        {["", "admin", "fundraiser", "collaborator", "backer", "donor"].map((r) => (
          <button
            key={r}
            onClick={() => { setRoleFilter(r); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              roleFilter === r ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r || "All"}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search users by name or email..."
        className="input-field w-full"
      />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">User</th>
              <th className="px-3 py-3 font-medium text-gray-500">Role</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Verified</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Activity</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Loading...</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No users found.</td></tr>}
            {!loading && users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  <p className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  {u.emailVerified ? (
                    <span className="text-green-600 text-xs">✓ Verified</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Unverified</span>
                  )}
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>{u._count.donations} donations</span>
                    <span>{u._count.pledges} pledges</span>
                    <span>{u._count.campaigns} campaigns</span>
                  </div>
                </td>
                <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {u.role !== "admin" && (
                      <button onClick={() => handleRole(u.id, "admin")} className="rounded px-2 py-1 text-xs text-purple-600 hover:bg-purple-50">Make Admin</button>
                    )}
                    {u.role !== "fundraiser" && (
                      <button onClick={() => handleRole(u.id, "fundraiser")} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">Make Fundraiser</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { formatDateShort } from "../utils/date";

export default function UsersPage({ showToast }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    setLoading(true);
    setError("");
    api.users({
      status: statusFilter !== "all" ? statusFilter : undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      q: query,
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_dir: sortDir,
    })
      .then((res) => {
        setUsers(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((e) => {
        setError(e.message);
        setUsers([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, [statusFilter, roleFilter, query, page, sortBy, sortDir]);

  const updateUser = async (userId, action) => {
    try {
      await api.reviewUser(userId, action, `Reviewed by admin`);
      setMessage(`User ${action}d successfully.`);
      loadUsers();
    } catch (e) {
      setError(e.message);
      showToast?.(e.message, "error");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page-card">
      <PageHeader title="User Approvals" subtitle="Filter and review registration requests quickly." />

      <div className="approvals-toolbar">
        <input
          type="text"
          placeholder="Search by username, email, phone"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="user">User</option>
        </select>
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
          <option value="updated_at">Date Joined</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
          <option value="role">Role</option>
        </select>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {loading ? (
        <p className="notice">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="empty">No users found.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td>{u.status}</td>
                  <td>{formatDateShort(u.updated_at)}</td>
                  <td>
                    {u.status !== "approved" && (
                      <button className="primary" onClick={() => updateUser(u.id, "approve")}>Approve</button>
                    )}
                    {u.status !== "rejected" && (
                      <button className="danger" onClick={() => updateUser(u.id, "reject")}>Reject</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button className="primary" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button className="primary" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

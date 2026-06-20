import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { formatDateShort } from "../utils/date";

export default function UsersPage({ showToast, isStaff = false }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleResetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setRoleFilter("all");
    setSortBy("updated_at");
    setSortDir("desc");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "pending";
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      default:
        return "";
    }
  };

  return (
    <div className="page-card admin-page-card">
      <PageHeader title={isStaff ? "Users Directory" : "User Approvals"} />

      {/* Modern Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-row">
          <div className="search-box-wrapper">
            <input
              type="text"
              className="search-box"
              placeholder="🔍 Search by username, email, or phone..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <div className="filter-group">
            <select 
              className="filter-select"
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select 
              className="filter-select"
              value={roleFilter} 
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="sort-group">
            <select 
              className="filter-select"
              value={sortBy} 
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            >
              <option value="updated_at">Sort: Date Joined</option>
              <option value="name">Sort: Name</option>
              <option value="status">Sort: Status</option>
              <option value="role">Sort: Role</option>
            </select>
            <select 
              className="filter-select"
              value={sortDir} 
              onChange={(e) => setSortDir(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <button 
            className="btn-reset"
            onClick={handleResetFilters}
            title="Clear all filters"
          >
            ↻ Reset
          </button>
        </div>

        {/* Page Size Selector */}
        <div className="page-size-row">
          <label htmlFor="page-size" className="page-size-label">Records per page:</label>
          <select 
            id="page-size"
            className="page-size-select"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p>👥 No users found</p>
          <p className="empty-hint">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <div className="table-info">
            Showing <strong>{startRecord}-{endRecord}</strong> of <strong>{total}</strong> users
          </div>

          <div className="table-wrapper">
            <table className="users-table">
              <thead className="table-sticky-header">
                <tr>
                  <th className="col-username">Username</th>
                  <th className="col-email">Email</th>
                  <th className="col-phone">Phone</th>
                  <th className="col-role">Role</th>
                  <th className="col-status">Status</th>
                  <th className="col-date">Requested</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id} className={`table-row ${index % 2 === 0 ? "even" : "odd"}`}>
                    <td className="col-username">
                      <span className="username-badge">{u.username}</span>
                    </td>
                    <td className="col-email">{u.email}</td>
                    <td className="col-phone">{u.phone || "—"}</td>
                    <td className="col-role">
                      <span className={`role-badge role-${u.role}`}>{u.role}</span>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge status-${getStatusBadgeClass(u.status)}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="col-date">{formatDateShort(u.updated_at)}</td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        {!isStaff && u.status !== "approved" && (
                          <button 
                            className="btn-approve"
                            onClick={() => updateUser(u.id, "approve")}
                            title="Approve user"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {!isStaff && u.status !== "rejected" && (
                          <button 
                            className="btn-reject"
                            onClick={() => updateUser(u.id, "reject")}
                            title="Reject user"
                          >
                            ✕ Reject
                          </button>
                        )}
                        {!isStaff && u.status === "approved" && (
                          <span className="status-done">Approved</span>
                        )}
                        {!isStaff && u.status === "rejected" && (
                          <span className="status-done">Rejected</span>
                        )}
                        {isStaff && (
                          <span className="status-view-only">View Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modern Pagination */}
          <div className="pagination-modern">
            <button 
              className="btn-pagination"
              disabled={page <= 1} 
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              ← Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`page-num ${page === pageNum ? "active" : ""}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && (
                <>
                  <span className="page-ellipsis">...</span>
                  <button 
                    className="page-num"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button 
              className="btn-pagination"
              disabled={page >= totalPages} 
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next →
            </button>
          </div>

          <div className="pagination-info">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>
        </>
      )}
    </div>
  );
}

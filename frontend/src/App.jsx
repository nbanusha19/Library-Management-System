import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import { api } from "./api";
import { useToast, ToastContainer } from "./Toast";

const USER_TABS = [
  { key: "books", label: "Browse Books" },
  { key: "active", label: "Currently Borrowed" },
  { key: "history", label: "Return History" },
];
const ADMIN_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "books", label: "Books" },
  { key: "users", label: "Users" },
  { key: "borrowed", label: "Borrowed Books" },
  { key: "returned", label: "Returned Books" },
];
const STAFF_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "books", label: "Books" },
  { key: "requests", label: "Pending Requests" },
  { key: "borrowed", label: "Borrowed Books" },
  { key: "returned", label: "Returned Books" },
];

function formatDateShort(s) {
  if (!s) return "";
  // Try parsing ISO-like strings; fall back to extracting tokens
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  // Fallback: try to extract month and day from a space-separated string
  const parts = String(s).split(/\s+/);
  // look for parts that look like month or numeric day
  // return second and third tokens if present: e.g., ['Mon','Jun','15','2026','12:34:56'] -> 'Jun 15'
  if (parts.length >= 3) return parts[1] + ' ' + parts[2].replace(/,/, '');
  return s;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("books");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const { toasts, showToast, removeToast } = useToast();
  const [overdueCount, setOverdueCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("lms_theme") === "dark";
  });

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      api.notifications().then(setNotifications).catch(() => {});
    }
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("lms_auth") || "null");
    if (stored && stored.id && stored.role) {
      api.me()
        .then((data) => {
          const merged = { ...stored, ...data };
          setUser(merged);
          if (merged.role === "admin" || merged.role === "staff") {
            api.overdueCount().then((d) => setOverdueCount(d.count)).catch(() => {});
          }
        })
        .catch(() => {
          localStorage.removeItem("lms_auth");
          setUser(null);
        });
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("lms_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const doLogout = () => {
    localStorage.removeItem("lms_auth");
    setUser(null);
    setTab("books");
    setMode("login");
    setMessage("");
  };

  const handleLogin = (authUser) => {
    localStorage.setItem("lms_auth", JSON.stringify(authUser));
    setUser(authUser);
    setMode(authUser.role === "admin" ? "admin" : authUser.role === "staff" ? "staff" : "user");
    setTab(authUser.role === "admin" || authUser.role === "staff" ? "dashboard" : "books");
    setMessage("");
  };

  const handleRegisterSuccess = (msg) => {
    setMode("login");
    setMessage(msg);
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <header>
        <div className="header-top">
          <h1>📚 Library Management System</h1>
          {user && (
            <div className="user-panel">
              <div className="user-avatar">
            {user.profile_photo ? (
              <img src={user.profile_photo} alt={user.username} />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="user-info">
            <span>{user.username}</span>
            <small>{user.email}</small>
          </div>

          <div className="notifications">
            <button className="bell" onClick={toggleNotifications}>
              🔔 { (user.role === "admin" || user.role === "staff") ? (overdueCount > 0 ? <span className="count">{overdueCount}</span> : null) : (notifications.length > 0 ? <span className="count">{notifications.length}</span> : null)}
            </button>
            {showNotifications && (
              <div className="notif-dropdown card">
                <h4>Notifications</h4>
                {notifications.length === 0 ? <p className="empty">No notifications</p> : (
                  <>
                    {notifications.some((n) => !String(n.message || "").trim()) && (
                      <p className="notice">Some notifications are blank; showing fallback text.</p>
                    )}
                    <ul>
                      {notifications.map((n) => {
                        const msg = String(n.message || "").trim();
                        return <li key={n.id}>{msg || "No notification message."} <small className="muted">{n.created_at}</small></li>;
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          <button onClick={() => { setDarkMode((d) => !d); }} title="Toggle dark mode">{darkMode ? '🌙' : '☀️'}</button>
          {user && (
            <button className="secondary" onClick={() => setTab("profile")}>Edit Profile</button>
          )}
          <button onClick={doLogout}>Logout</button>
        </div>
          )}
        </div>
        {user ? (
          <nav>
            {(user.role === "admin" ? ADMIN_TABS : user.role === "staff" ? STAFF_TABS : USER_TABS).map((t) => (
              <button
                key={t.key}
                className={tab === t.key ? "active" : ""}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        ) : (
          <nav>
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
          </nav>
        )}
      </header>

      <main>
        {user ? (
          user.role === "admin" ? (
              tab === "dashboard" ? <AdminDashboardView />
              : tab === "books" ? <AdminBooksView />
              : tab === "users" ? <UserApprovalsView />
              : tab === "borrowed" ? <BorrowedAdminView />
              : tab === "returned" ? <ReturnedAdminView />
              : tab === "profile" ? <ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem("lms_auth", JSON.stringify(updated)); }} showToast={showToast} />
              : <AdminDashboardView />
            ) : user.role === "staff" ? (
              tab === "dashboard" ? <AdminDashboardView />
              : tab === "books" ? <BooksView canBorrow={false} />
              : tab === "requests" ? <StaffRequestsView showToast={showToast} />
              : tab === "borrowed" ? <BorrowedAdminView />
              : tab === "returned" ? <ReturnedAdminView />
              : tab === "profile" ? <ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem("lms_auth", JSON.stringify(updated)); }} showToast={showToast} />
              : <AdminDashboardView />
            ) : (
              tab === "books" ? <BooksView />
                : tab === "active" ? <RecordsView mode="active" />
                : tab === "history" ? <RecordsView mode="history" />
                : tab === "profile" ? <ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem("lms_auth", JSON.stringify(updated)); }} showToast={showToast} />
                : <BooksView />
            )
          ) : (
          mode === "login" ? <LoginView onLogin={handleLogin} message={message} showToast={showToast} /> : <RegisterView onRegister={handleRegisterSuccess} message={message} showToast={showToast} />
        )}
      </main>
    </>
  );
}

function LoginView({ onLogin, message, showToast }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      const msg = "Username and password are required";
      setError(msg);
      showToast(msg, "warning");
      return;
    }
    try {
      const res = await api.login(username.trim(), password.trim());
      const user = res.user;
      showToast(`Welcome, ${user.username}!`, "success");
      onLogin(user);
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    }
  };

  return (
    <div className="card form-card">
      <h2>Login</h2>
      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}
      <div className="form-group">
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="primary" onClick={submit}>Login</button>
    </div>
  );
}

function RegisterView({ onRegister, message, showToast }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [temporaryAddress, setTemporaryAddress] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      const msg = "All required fields must be filled";
      setError(msg);
      showToast(msg, "warning");
      return;
    }
    try {
      const res = await api.register(
        username.trim(),
        email.trim(),
        phone.trim(),
        password.trim(),
        permanentAddress.trim(),
        temporaryAddress.trim(),
        photoFile
      );
      setSuccess(res.message);
      showToast("Registration successful! Your account is approved.", "success");
      onRegister(res.message);
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    }
  };

  return (
    <div className="card form-card">
      <h2>Register</h2>
      {message && <p className="notice">{message}</p>}
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}
      <div className="form-group">
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Permanent Address</label>
        <textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} rows={3} />
      </div>
      <div className="form-group">
        <label>Temporary Address</label>
        <textarea value={temporaryAddress} onChange={(e) => setTemporaryAddress(e.target.value)} rows={2} />
      </div>
      <div className="form-group">
        <label>Profile Photo</label>
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="primary" onClick={submit}>Register</button>
    </div>
  );
}

function ProfileView({ user, onUpdate, showToast }) {
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [password, setPassword] = useState("");
  const [permanentAddress, setPermanentAddress] = useState(user.permanent_address || "");
  const [temporaryAddress, setTemporaryAddress] = useState(user.temporary_address || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setMessage("");
    if (!username.trim() || !email.trim() || !phone.trim()) {
      const msg = "Username, email, and phone are required.";
      setMessage(msg);
      showToast(msg, "warning");
      return;
    }

    const formData = new FormData();
    formData.append("username", username.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    if (password.trim()) {
      formData.append("password", password.trim());
    }
    formData.append("permanent_address", permanentAddress.trim());
    formData.append("temporary_address", temporaryAddress.trim());
    if (photoFile) {
      formData.append("profile_photo", photoFile);
    }

    try {
      const updated = await api.updateProfile(formData);
      onUpdate(updated);
      localStorage.setItem("lms_auth", JSON.stringify(updated));
      setMessage("Profile updated successfully.");
      showToast("Profile saved", "success");
      setPassword("");
    } catch (e) {
      setMessage(e.message);
      showToast(e.message, "error");
    }
  };

  return (
    <div className="card form-card">
      <h2>Profile</h2>
      {message && <p className={message.includes("success") ? "success" : "notice"}>{message}</p>}
      <div className="profile-grid">
        <div className="profile-avatar-box">
          {user.profile_photo ? <img className="profile-avatar" src={user.profile_photo} alt="Profile" /> : <div className="avatar-placeholder-large">👤</div>}
          <p>{user.username}</p>
          <small>{user.role?.toUpperCase()}</small>
        </div>
        <div className="profile-fields">
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep existing password" />
          </div>
          <div className="form-group">
            <label>Permanent Address</label>
            <textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} rows={3} />
          </div>
          <div className="form-group">
            <label>Temporary Address</label>
            <textarea value={temporaryAddress} onChange={(e) => setTemporaryAddress(e.target.value)} rows={2} />
          </div>
          <div className="form-group">
            <label>Profile Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
          </div>
          <button className="primary" onClick={submit}>Save Profile</button>
        </div>
      </div>
    </div>
  );
}

function BooksView({ canBorrow = true }) {
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [books, setBooks] = useState([]);
  const [borrowMsg, setBorrowMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => api.books(subject).then(setBooks).catch((e) => setBorrowMsg(e.message));

  useEffect(() => { api.subjects().then(setSubjects); }, []);
  useEffect(() => { load(); }, [subject]);

  const borrow = async (book) => {
    setBorrowMsg("");
    setLoading(true);
    try {
      await api.borrow(book.id);
      setBorrowMsg(`Request sent for "${book.title}". Waiting for staff approval.`);
      load();
    } catch (e) {
      setBorrowMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Books</h2>
      <div className="subjects">
        <button className={!subject ? "active" : ""} onClick={() => setSubject("")}>All</button>
        {subjects.map((s) => (
          <button key={s} className={subject === s ? "active" : ""} onClick={() => setSubject(s)}>{s}</button>
        ))}
      </div>
      {borrowMsg && <p className="notice">{borrowMsg}</p>}
      {books.length === 0 ? (
        <p className="empty">No books found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Subject</th>
              <th>Available</th>
              {canBorrow && <th></th>}
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>{b.subject}</td>
                <td>{b.available_copies} / {b.total_copies}</td>
                {canBorrow && (
                  <td>
                    <button
                      className="primary"
                      disabled={b.available_copies <= 0 || loading}
                      onClick={() => borrow(b)}
                    >
                      {loading ? "Loading..." : "Borrow"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function groupRecordsByBorrower(records) {
  const groups = {};
  records.forEach((record) => {
    const key = `${record.user_id}-${record.borrower_name}`;
    if (!groups[key]) {
      groups[key] = {
        borrower_name: record.borrower_name,
        user_id: record.user_id,
        books: [],
      };
    }
    groups[key].books.push(record);
  });
  return Object.values(groups);
}

function RecordsView({ mode }) {
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState("");

  const load = () => {
    const p = mode === "active" ? api.active() : api.history();
    p.then(setRecords).catch((e) => setMsg(e.message));
  };
  useEffect(load, [mode]);

  const ret = async (id) => {
    try { await api.returnBook(id); load(); }
    catch (e) { setMsg(e.message); }
  };

  const grouped = groupRecordsByBorrower(records);
  const isGroupOverdue = (group) =>
    group.books.some((r) => r.status === "borrowed" && new Date(r.due_date) < new Date(new Date().toDateString()));

  const getStatusBadge = (group) => {
    // Check if any book is pending (requested)
    if (group.books.some(r => r.status === "requested")) {
      return <span className="badge pending">Pending Approval</span>;
    }
    // Check if any book is overdue
    if (isGroupOverdue(group)) {
      return <span className="badge overdue">Overdue</span>;
    }
    // Otherwise it's borrowed
    return <span className="badge borrowed">Borrowed</span>;
  };

  const isOverdueRow = (book) => book.status === "borrowed" && new Date(book.due_date) < new Date(new Date().toDateString());

  return (
    <div className="card">
      <h2>{mode === "active" ? "Currently Borrowed" : "Return History"}</h2>
      {msg && <p className="error">{msg}</p>}
      {grouped.length === 0 ? (
        <p className="empty">No records.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Borrower</th><th>Book</th><th>Borrowed</th><th>Due</th>
              {mode === "history" ? <th>Returned</th> : <th>Status</th>}
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => (
              group.books.map((book, index) => (
                <tr key={book.id} className={isOverdueRow(book) ? 'row-overdue' : ''}>
                  {index === 0 && (
                    <td rowSpan={group.books.length}>{group.borrower_name}</td>
                  )}
                  <td>
                    <div className="book-group-item">
                      <div>
                        <strong>{book.title}</strong> <span className="meta">({book.subject})</span>
                      </div>
                      {mode === "active" && book.status === "borrowed" && (
                        <button
                          className="button-return"
                          onClick={() => ret(book.id)}
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{formatDateShort(book.borrow_date) || "-"}</td>
                  <td>{formatDateShort(book.due_date) || "-"}</td>
                  {mode === "history" ? (
                    <td>{formatDateShort(book.returned_date) || "-"}</td>
                  ) : (
                    index === 0 ? (
                      <td rowSpan={group.books.length}>
                        {getStatusBadge(group)}
                      </td>
                    ) : null
                  )}
                </tr>
              ))
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatusHistoryView() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.myStatusHistory().then(setHistory).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="card">
      <h2>Approval History</h2>
      {error && <p className="error">{error}</p>}
      {history.length === 0 ? (
        <p className="empty">No history available.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Status</th><th>Comment</th><th>When</th></tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={index}>
                <td>{item.status}</td>
                <td>{item.comment}</td>
                <td>{item.changed_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UserApprovalsView() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    setMessage("");
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
        console.error("Error loading users:", e);
        setError(e.message);
        setUsers([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter, roleFilter, query, page, sortBy, sortDir]);

  const updateUser = async (userId, action) => {
    try {
      setError("");
      await api.reviewUser(userId, action, "Reviewed by admin");
      setMessage(`User ${action}d successfully.`);
      load();
    } catch (e) {
      console.error("Error updating user:", e);
      setError(e.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="card">
      <h2>User Approvals</h2>

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
          <option value="created_at">Date Joined</option>
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
                  <td>{formatDateShort(u.created_at)}</td>
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
            <button className="primary" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button className="primary" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AdminRecordsView() {
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState("");
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);

  const load = () => {
    setMsg("");
    api.active().then(setActive).catch((e) => setMsg(e.message));
    api.history().then(setHistory).catch((e) => setMsg((p) => (p ? p + ' | ' + e.message : e.message)));
    api.requests().then(setRequests).catch(()=>{});
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <h2>Borrow Records</h2>
      {msg && <p className="error">{msg}</p>}

      <section>
        <h3>Pending Requests</h3>
        {requests.length === 0 ? <p className="empty">No pending requests.</p> : (
          <table>
            <thead><tr><th>Book</th><th>User</th><th>Requested</th><th>Action</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}><td>{r.title}</td><td>{r.borrower_name}</td><td>{formatDateShort(r.borrow_date) || '-'}</td><td><button className="primary" onClick={async ()=>{ try{ await api.approveRequest(r.id); load(); showToast('Approved','success'); } catch(e){ showToast(e.message,'error'); } }}>Approve</button></td></tr>
              ))}
            </tbody>
          </table>
        )}

        <h3>Currently Borrowed</h3>
        {active.length === 0 ? (
          <p className="empty">No active borrows.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Book</th><th>Subject</th><th>User</th><th>Borrowed</th><th>Due</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {active.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.subject}</td>
                  <td>{r.borrower_name}</td>
                  <td>{formatDateShort(r.borrow_date)}</td>
                  <td>{formatDateShort(r.due_date)}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Returned</h3>
        {history.length === 0 ? (
          <p className="empty">No returned records.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Book</th><th>User</th><th>Borrowed</th><th>Returned</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.borrower_name}</td>
                  <td>{formatDateShort(r.borrow_date)}</td>
                  <td>{formatDateShort(r.returned_date) || "—"}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StaffRequestsView({ showToast }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    api.requests().then(setRequests).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const approve = async (recordId) => {
    try {
      await api.approveRequest(recordId);
      showToast("Request approved", "success");
      load();
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    }
  };

  const reject = async (recordId) => {
    try {
      await api.rejectRequest(recordId);
      showToast("Request rejected", "success");
      load();
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    }
  };

  return (
    <div className="card">
      <h2>Pending Borrow Requests</h2>
      {error && <p className="error">{error}</p>}
      {requests.length === 0 ? (
        <p className="empty">No pending requests.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Book</th><th>User</th><th>Requested</th><th>Action</th></tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.borrower_name}</td>
                <td>{r.borrow_date || '-'}</td>
                <td>
                  <button className="primary" onClick={() => approve(r.id)}>
                    Approve
                  </button>
                  <button className="danger" onClick={() => reject(r.id)} style={{ marginLeft: 8 }}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BorrowedAdminView() {
  const [active, setActive] = useState([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { api.active().then((data) => setActive(data.filter((r) => r.status === "borrowed"))).catch((e)=>setMsg(e.message)); }, []);
  return (
    <div className="card">
      <h2>Borrowed Books</h2>
      {msg && <p className="error">{msg}</p>}
      {active.length === 0 ? <p className="empty">No active borrows.</p> : (
        <table>
          <thead><tr><th>Book</th><th>User</th><th>Borrowed</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {active.map(r => (
              <tr key={r.id}><td>{r.title}</td><td>{r.borrower_name}</td><td>{r.borrow_date}</td><td>{r.due_date}</td><td>{r.status}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ReturnedAdminView() {
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { api.history().then(setHistory).catch((e)=>setMsg(e.message)); }, []);
  return (
    <div className="card">
      <h2>Returned Books</h2>
      {msg && <p className="error">{msg}</p>}
      {history.length === 0 ? <p className="empty">No returned records.</p> : (
        <table>
          <thead><tr><th>Book</th><th>User</th><th>Borrowed</th><th>Returned</th></tr></thead>
          <tbody>
            {history.map(r => (
              <tr key={r.id}><td>{r.title}</td><td>{r.borrower_name}</td><td>{r.borrow_date}</td><td>{r.returned_date || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminDashboardView() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.adminDashboard().then(setData).catch((e) => setErr(e.message));
  }, []);
  if (err) return <div className="card"><h2>Dashboard</h2><p className="error">{err}</p></div>;
  if (!data) return <div className="card"><h2>Dashboard</h2><p className="notice">Loading...</p></div>;
  const labels = (data.activity || []).map((a) => a.date);
  const counts = (data.activity || []).map((a) => a.count);
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Borrows',
        data: counts,
        backgroundColor: 'rgba(67,56,202,0.8)'
      }
    ]
  };
  const chartOptions = { responsive: true, plugins: { legend: { display: false } } };
  return (
    <div className="card">
      <h2>Dashboard</h2>
      <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
        <div className="card" style={{minWidth:120}}><strong>Books</strong><div>{data.total_books}</div></div>
        <div className="card" style={{minWidth:120}}><strong>Users</strong><div>{data.total_users}</div></div>
        <div className="card" style={{minWidth:120}}><strong>Borrowed</strong><div>{data.borrowed}</div></div>
        <div className="card" style={{minWidth:120}}><strong>Overdue</strong><div>{data.overdue}</div></div>
      </div>

      <section style={{marginTop:16}}>
        <h3>Upcoming Due Dates (7 days)</h3>
        {data.upcoming.length === 0 ? <p className="empty">No upcoming dues.</p> : (
          <table>
            <thead><tr><th>Due</th><th>Book</th><th>User</th></tr></thead>
            <tbody>
              {data.upcoming.map((r) => (
                <tr key={r.id}><td>{r.due_date}</td><td>{r.title}</td><td>{r.borrower_name}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{marginTop:16}}>
        <h3>Activity (last 7 days)</h3>
        {data.activity.length === 0 ? <p className="empty">No recent activity.</p> : (
          <div>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </section>
    </div>
  );
}

function AdminBooksView() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [copies, setCopies] = useState(1);
  const [msg, setMsg] = useState("");

  const load = () => { setLoading(true); api.books().then(setBooks).catch((e)=>setMsg(e.message)).finally(()=>setLoading(false)); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    try {
      await api.createBook(title, author, subject, copies);
      setTitle(""); setAuthor(""); setSubject(""); setCopies(1);
      load();
    } catch (e) { setMsg(e.message); }
  };

  const remove = async (id) => {
    try { await api.deleteBook(id); load(); } catch (e) { setMsg(e.message); }
  };

  return (
    <div className="card">
      <h2>Manage Books</h2>
      {msg && <p className="error">{msg}</p>}
      <div className="form-card">
        <div className="form-group"><label>Title</label><input value={title} onChange={(e)=>setTitle(e.target.value)} /></div>
        <div className="form-group"><label>Author</label><input value={author} onChange={(e)=>setAuthor(e.target.value)} /></div>
        <div className="form-group"><label>Subject</label><input value={subject} onChange={(e)=>setSubject(e.target.value)} /></div>
        <div className="form-group"><label>Copies</label><input type="number" value={copies} min={1} onChange={(e)=>setCopies(Number(e.target.value))} /></div>
        <button className="primary" onClick={add}>Add Book</button>
      </div>

      <section style={{marginTop:16}}>
        <h3>All Books</h3>
        {loading ? <p className="notice">Loading...</p> : books.length === 0 ? <p className="empty">No books.</p> : (
          <table>
            <thead><tr><th>Title</th><th>Author</th><th>Subject</th><th>Available</th><th></th></tr></thead>
            <tbody>
              {books.map(b => (
                <tr key={b.id}><td>{b.title}</td><td>{b.author}</td><td>{b.subject}</td><td>{b.available_copies}</td><td><button className="danger" onClick={()=>remove(b.id)}>Delete</button></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
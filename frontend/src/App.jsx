import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { useToast, ToastContainer } from "./Toast";

const USER_TABS = [
  { key: "books", label: "Browse Books" },
  { key: "active", label: "Currently Borrowed" },
  { key: "history", label: "Return History" },
  { key: "status", label: "Approval History" },
];
const ADMIN_TABS = [
  { key: "users", label: "Users" },
  { key: "borrowed", label: "Borrowed Books" },
  { key: "returned", label: "Returned Books" },
  { key: "records", label: "Borrow Records" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("books");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const { toasts, showToast, removeToast } = useToast();
  const [overdueCount, setOverdueCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
        .then((data) => setUser({ ...stored, ...data }))
        .catch(() => {
          localStorage.removeItem("lms_auth");
          setUser(null);
        });
    }
  }, []);

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
    setMode(authUser.role === "admin" ? "admin" : "user");
    setTab(authUser.role === "admin" ? "pending" : "books");
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
              <div className="notifications">
                <button className="bell" onClick={toggleNotifications}>
                  🔔 {overdueCount > 0 ? <span className="count">{overdueCount}</span> : null}
                </button>
                {showNotifications && (
                  <div className="notif-dropdown card">
                    <h4>Notifications</h4>
                    {notifications.length === 0 ? <p className="empty">No notifications</p> : (
                      <ul>
                        {notifications.map((n) => <li key={n.id}>{n.message} <small className="muted">{n.created_at}</small></li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <span>{user.role === "admin" ? "Admin" : (user.role === "staff" ? "Staff" : "User")}: {user.username}</span>
              <button onClick={() => { setDarkMode((d) => !d); }} title="Toggle dark mode">{darkMode ? '🌙' : '☀️'}</button>
              <button onClick={doLogout}>Logout</button>
            </div>
          )}
        </div>
        {user ? (
          <nav>
            {(user.role === "admin" ? ADMIN_TABS : USER_TABS).map((t) => (
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
              tab === "users" ? <UserApprovalsView />
              : tab === "borrowed" ? <BorrowedAdminView />
              : tab === "returned" ? <ReturnedAdminView />
              : <AdminRecordsView />
            ) : (
              tab === "books" ? <BooksView />
                : tab === "active" ? <RecordsView mode="active" />
                : tab === "history" ? <RecordsView mode="history" />
                : <StatusHistoryView />
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      const msg = "All fields are required";
      setError(msg);
      showToast(msg, "warning");
      return;
    }
    try {
      const res = await api.register(username.trim(), email.trim(), phone.trim(), password.trim());
      setSuccess(res.message);
      showToast("Registration successful! Wait for admin approval.", "success");
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
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="primary" onClick={submit}>Register</button>
    </div>
  );
}

function BooksView() {
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
    try {
      await api.borrow(book.id);
      setBorrowMsg(`Borrowed "${book.title}". Due in 15 days.`);
      load();
    } catch (e) {
      setBorrowMsg(e.message);
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
            <tr><th>Title</th><th>Author</th><th>Subject</th><th>Available</th><th></th></tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>{b.subject}</td>
                <td>{b.available_copies} / {b.total_copies}</td>
                <td>
                  <button
                    className="primary"
                    disabled={b.available_copies <= 0}
                    onClick={() => borrow(b)}
                  >
                    Borrow
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
                <tr key={book.id}>
                  {index === 0 && (
                    <td rowSpan={group.books.length}>{group.borrower_name}</td>
                  )}
                  <td>
                    <div className="book-group-item">
                      <div>
                        <strong>{book.title}</strong> <span className="meta">({book.subject})</span>
                      </div>
                      {mode === "active" && (
                        <button
                          className="button-return"
                          onClick={() => ret(book.id)}
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{book.borrow_date}</td>
                  <td>{book.due_date}</td>
                  {mode === "history" ? (
                    <td>{book.returned_date || "-"}</td>
                  ) : (
                    index === 0 ? (
                      <td rowSpan={group.books.length}>
                        <span className={`badge ${isGroupOverdue(group) ? "overdue" : "borrowed"}`}>
                          {isGroupOverdue(group) ? "Overdue" : "Borrowed"}
                        </span>
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
                  <td>{u.created_at}</td>
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

  const load = () => {
    setMsg("");
    api.active().then(setActive).catch((e) => setMsg(e.message));
    api.history().then(setHistory).catch((e) => setMsg((p) => (p ? p + ' | ' + e.message : e.message)));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <h2>Borrow Records</h2>
      {msg && <p className="error">{msg}</p>}

      <section>
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
                  <td>{r.borrow_date}</td>
                  <td>{r.due_date}</td>
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
                  <td>{r.borrow_date}</td>
                  <td>{r.returned_date || "—"}</td>
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

function BorrowedAdminView() {
  const [active, setActive] = useState([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { api.active().then(setActive).catch((e)=>setMsg(e.message)); }, []);
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
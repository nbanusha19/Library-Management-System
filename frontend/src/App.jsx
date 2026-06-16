import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const USER_TABS = [
  { key: "books", label: "Browse Books" },
  { key: "active", label: "Currently Borrowed" },
  { key: "history", label: "Return History" },
  { key: "status", label: "Approval History" },
];
const ADMIN_TABS = [
  { key: "pending", label: "Pending Users" },
  { key: "records", label: "Borrow Records" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("books");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");

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
      <header>
        <div className="header-top">
          <h1>📚 Library Management System</h1>
          {user && (
            <div className="user-panel">
              <span>{user.role === "admin" ? "Admin" : "User"}: {user.username}</span>
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
            tab === "pending" ? <PendingUsersView /> : <AdminRecordsView />
          ) : (
            tab === "books" ? <BooksView />
              : tab === "active" ? <RecordsView mode="active" />
              : tab === "history" ? <RecordsView mode="history" />
              : <StatusHistoryView />
          )
        ) : (
          mode === "login" ? <LoginView onLogin={handleLogin} message={message} /> : <RegisterView onRegister={handleRegisterSuccess} message={message} />
        )}
      </main>
    </>
  );
}

function LoginView({ onLogin, message }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      const res = await api.login(username.trim(), password.trim());
      const user = res.user;
      onLogin(user);
    } catch (e) {
      setError(e.message);
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

function RegisterView({ onRegister, message }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await api.register(username.trim(), email.trim(), phone.trim(), password.trim());
      setSuccess(res.message);
      onRegister(res.message);
    } catch (e) {
      setError(e.message);
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

  const isOverdue = (r) =>
    r.status === "borrowed" && new Date(r.due_date) < new Date(new Date().toDateString());

  return (
    <div className="card">
      <h2>{mode === "active" ? "Currently Borrowed" : "Return History"}</h2>
      {msg && <p className="error">{msg}</p>}
      {records.length === 0 ? (
        <p className="empty">No records.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Book</th><th>Subject</th><th>Borrower</th>
              <th>Borrowed</th><th>Due</th>
              {mode === "history" ? <th>Returned</th> : <th>Status</th>}
              {mode === "active" && <th></th>}
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.subject}</td>
                <td>{r.borrower_name}</td>
                <td>{r.borrow_date}</td>
                <td>{r.due_date}</td>
                {mode === "history" ? (
                  <td><span className="badge returned">{r.returned_date}</span></td>
                ) : (
                  <td>
                    <span className={`badge ${isOverdue(r) ? "overdue" : "borrowed"}`}>
                      {isOverdue(r) ? "Overdue" : "Borrowed"}
                    </span>
                  </td>
                )}
                {mode === "active" && (
                  <td><button className="primary" onClick={() => ret(r.id)}>Return</button></td>
                )}
              </tr>
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

function PendingUsersView() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const load = () => api.pendingUsers().then(setUsers).catch((e) => setMessage(e.message));
  useEffect(load, []);

  const updateUser = async (userId, action) => {
    try {
      await api.reviewUser(userId, action);
      setMessage(`User ${action}d successfully.`);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="card">
      <h2>Pending Users</h2>
      {message && <p className="notice">{message}</p>}
      {users.length === 0 ? (
        <p className="empty">No pending registrations.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Username</th><th>Email</th><th>Phone</th><th>Requested</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.created_at}</td>
                <td>
                  <button className="primary" onClick={() => updateUser(u.id, "approve")}>Approve</button>
                  <button className="danger" onClick={() => updateUser(u.id, "reject")}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminRecordsView() {
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.history().then(setRecords).catch((e) => setMsg(e.message));
  }, []);

  return (
    <div className="card">
      <h2>Borrow Records</h2>
      {msg && <p className="error">{msg}</p>}
      {records.length === 0 ? (
        <p className="empty">No borrow history.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Book</th><th>User</th><th>Borrowed</th><th>Returned</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
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
    </div>
  );
}

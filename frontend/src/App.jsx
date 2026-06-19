import { useEffect, useState } from "react";
import { api } from "./api";
import { useToast, ToastContainer } from "./Toast";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BooksPage from "./pages/BooksPage";
import UsersPage from "./pages/UsersPage";
import OverduePage from "./pages/OverduePage";
import BorrowedPage from "./pages/BorrowedPage";
import RequestsPage from "./pages/RequestsPage";
import { LoginPage, RegisterPage } from "./pages/AuthPage";

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
  { key: "overdue", label: "Overdue" },
  { key: "returned", label: "Returned Books" },
];

const STAFF_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "books", label: "Books" },
  { key: "requests", label: "Requests" },
  { key: "borrowed", label: "Borrowed Books" },
  { key: "overdue", label: "Overdue" },
  { key: "returned", label: "Returned Books" },
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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("lms_theme") === "dark");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("lms_auth") || "null");
    if (stored && stored.id && stored.role) {
      api.me()
        .then((data) => {
          const merged = { ...stored, ...data };
          setUser(merged);
          setMode(merged.role);
          setTab(merged.role === "admin" || merged.role === "staff" ? "dashboard" : "books");
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

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      api.notifications().then(setNotifications).catch(() => {});
    }
  };

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
    setMode(authUser.role);
    setTab(authUser.role === "admin" || authUser.role === "staff" ? "dashboard" : "books");
    setMessage("");
    if (authUser.role === "admin" || authUser.role === "staff") {
      api.overdueCount().then((d) => setOverdueCount(d.count)).catch(() => {});
    }
  };

  const handleRegisterSuccess = (msg) => {
    setMode("login");
    setMessage(msg);
  };

  const renderPage = () => {
    if (!user) {
      return mode === "login" ? (
        <LoginPage onLogin={handleLogin} message={message} showToast={showToast} />
      ) : (
        <RegisterPage onRegister={handleRegisterSuccess} message={message} showToast={showToast} />
      );
    }

    if (user.role === "admin") {
      return (
        <>
          {tab === "dashboard" && <AdminDashboardPage />}
          {tab === "books" && <BooksPage canBorrow={false} />}
          {tab === "users" && <UsersPage showToast={showToast} />}
          {tab === "borrowed" && <BorrowedPage mode="active" />}
          {tab === "overdue" && <OverduePage />}
          {tab === "returned" && <BorrowedPage mode="history" />}
        </>
      );
    }

    if (user.role === "staff") {
      return (
        <>
          {tab === "dashboard" && <AdminDashboardPage />}
          {tab === "books" && <BooksPage canBorrow={false} />}
          {tab === "requests" && <RequestsPage showToast={showToast} />}
          {tab === "borrowed" && <BorrowedPage mode="active" />}
          {tab === "overdue" && <OverduePage />}
          {tab === "returned" && <BorrowedPage mode="history" />}
        </>
      );
    }

    return (
      <>
        {tab === "books" && <BooksPage />}
        {tab === "active" && <BorrowedPage mode="active" />}
        {tab === "history" && <BorrowedPage mode="history" />}
      </>
    );
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <header>
        <div className="header-top">
          <div>
            <h1>📚 Library Management System</h1>
          </div>

          {user ? (
            <div className="user-panel">
              <div className="user-avatar">
                {user.profile_photo ? <img src={user.profile_photo} alt={user.username} /> : <span>👤</span>}
              </div>
              <div className="user-info">
                <strong>{user.username}</strong>
                <small>{user.email}</small>
              </div>
              <div className="notifications">
                <button className="bell" onClick={toggleNotifications}>
                  🔔
                  {(user.role === "admin" || user.role === "staff")
                    ? overdueCount > 0 && <span className="count">{overdueCount}</span>
                    : notifications.length > 0 && <span className="count">{notifications.length}</span>}
                </button>
                {showNotifications && (
                  <div className="notif-dropdown card">
                    <h4>Notifications</h4>
                    {notifications.length === 0 ? (
                      <p className="empty">No notifications</p>
                    ) : (
                      <ul>
                        {notifications.map((n) => (
                          <li key={n.id}>{n.message || "No message"} <small>{n.updated_at}</small></li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setDarkMode((d) => !d)}>{darkMode ? "🌙" : "☀️"}</button>
              <button className="danger" onClick={doLogout}>Logout</button>
            </div>
          ) : null}
        </div>

        <nav>
          {user ? (
            (user.role === "admin" ? ADMIN_TABS : user.role === "staff" ? STAFF_TABS : USER_TABS).map((item) => (
              <button
                key={item.key}
                className={tab === item.key ? "active" : ""}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))
          ) : (
            <>
              <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
              <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
            </>
          )}
        </nav>
      </header>

      <main className="main-content">
        {renderPage()}
      </main>
    </>
  );
}

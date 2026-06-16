const API = "http://localhost:5000/api";

function authHeaders() {
  const auth = JSON.parse(localStorage.getItem("lms_auth") || "null");
  const headers = { "Content-Type": "application/json" };
  if (auth && auth.role && auth.id) {
    headers["X-Auth-Role"] = auth.role;
    headers["X-Auth-User-Id"] = auth.id;
  }
  return headers;
}

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { ...authHeaders(), ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (username, password) => req("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username, email, phone, password) => req("/auth/register", { method: "POST", body: JSON.stringify({ username, email, phone, password }) }),
  me: () => req("/auth/me"),
  subjects: () => req("/subjects"),
  books: (subject) => req(subject ? `/books?subject=${encodeURIComponent(subject)}` : "/books"),
  borrow: (book_id) => req("/borrow", { method: "POST", body: JSON.stringify({ book_id }) }),
  returnBook: (id) => req(`/return/${id}`, { method: "POST" }),
  active: () => req("/records/active"),
  history: () => req("/records/history"),
  pendingUsers: () => req("/users/pending"),
  reviewUser: (user_id, action, comment) => req(`/users/${user_id}/review`, { method: "POST", body: JSON.stringify({ action, comment }) }),
  myStatusHistory: () => req("/users/me/status-history"),
};

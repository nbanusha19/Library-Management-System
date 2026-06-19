const API = (import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : "http://localhost:5000") + "/api";

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
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { ...authHeaders(), ...(opts.headers || {}) },
      ...opts,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    // Network or CORS error
    throw new Error(e.message || "Network error: failed to fetch");
  }
}

export const api = {
  login: (username, password) => req("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username, email, phone, password, permanent_address, temporary_address, photoFile = null) => {
    // If a photo file is provided, use FormData; otherwise use JSON
    if (photoFile) {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("permanent_address", permanent_address);
      formData.append("temporary_address", temporary_address);
      formData.append("profile_photo", photoFile);
      
      return fetch(`${API}/auth/register`, {
        method: "POST",
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      }).catch((e) => {
        throw new Error(e.message || "Network error: failed to fetch");
      });
    } else {
      return req("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, phone, password, permanent_address, temporary_address }),
      });
    }
  },
  updateProfile: (formData) => {
    return fetch(`${API}/users/me/profile`, {
      method: "POST",
      headers: {
        "X-Auth-Role": JSON.parse(localStorage.getItem("lms_auth") || "null")?.role || "",
        "X-Auth-User-Id": JSON.parse(localStorage.getItem("lms_auth") || "null")?.id || "",
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    });
  },
  me: () => req("/auth/me"),
  createBook: (title, author, subject, total_copies) => req("/books", { method: "POST", body: JSON.stringify({ title, author, subject, total_copies }) }),
  deleteBook: (id) => req(`/books/${id}`, { method: "DELETE" }),
  adminDashboard: () => req("/admin/dashboard"),
  debug: () => req("/auth/debug"),
  subjects: () => req("/subjects"),
  books: (subject) => req(subject ? `/books?subject=${encodeURIComponent(subject)}` : "/books"),
  borrow: (book_id) => req("/borrow", { method: "POST", body: JSON.stringify({ book_id }) }),
  returnBook: (id) => req(`/return/${id}`, { method: "POST" }),
  active: () => req("/records/active"),
  history: () => req("/records/history"),
  overdue: () => req("/records/overdue"),
  pendingUsers: () => req("/users/pending"),
  reviewUser: (user_id, action, comment) => req(`/users/${user_id}/review`, { method: "POST", body: JSON.stringify({ action, comment }) }),
  users: ({ status, role, q, page, page_size, sort_by, sort_dir } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (role) params.set("role", role);
    if (q) params.set("q", q);
    if (page) params.set("page", page);
    if (page_size) params.set("page_size", page_size);
    if (sort_by) params.set("sort_by", sort_by);
    if (sort_dir) params.set("sort_dir", sort_dir);
    const query = params.toString();
    return req(`/users${query ? `?${query}` : ""}`);
  },
  myStatusHistory: () => req("/users/me/status-history"),
  notifications: () => req("/notifications"),
  overdueCount: () => req("/notifications/overdue-count"),
  requests: () => req("/records/requests"),
  approveRequest: (record_id) => req(`/records/${record_id}/approve`, { method: "POST" }),
  rejectRequest: (record_id) => req(`/records/${record_id}/reject`, { method: "POST" }),
};

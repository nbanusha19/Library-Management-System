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
    console.log(`[API] ${opts.method || "GET"} ${API}${path}`, { body: opts.body ? "..." : "none" });
    
    const res = await fetch(`${API}${path}`, {
      headers: { ...authHeaders(), ...(opts.headers || {}) },
      ...opts,
    });
    
    if (!res.ok) {
      let err = {};
      try {
        err = await res.json();
      } catch {
        err = { error: `HTTP ${res.status}` };
      }
      const errorMsg = err.error || err.message || `Request failed with status ${res.status}`;
      console.error(`[API Error] ${res.status}:`, errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = await res.json();
    console.log(`[API Success] ${opts.method || "GET"} ${path}`, data);
    return data;
  } catch (e) {
    // Network or CORS error
    const errorMsg = e.message || "Network error: Unable to reach the server. Check your connection and ensure the backend is running on http://localhost:5000";
    console.error(`[API Failed]`, e);
    throw new Error(errorMsg);
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
      
      console.log(`[API] POST ${API}/auth/register (with photo)`);
      return fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "X-Auth-Role": JSON.parse(localStorage.getItem("lms_auth") || "null")?.role || "",
          "X-Auth-User-Id": JSON.parse(localStorage.getItem("lms_auth") || "null")?.id || "",
        },
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          let err = {};
          try {
            err = await res.json();
          } catch {
            err = { error: `HTTP ${res.status}` };
          }
          const errorMsg = err.error || err.message || `Registration failed with status ${res.status}`;
          console.error(`[API Error] ${res.status}:`, errorMsg);
          throw new Error(errorMsg);
        }
        const data = await res.json();
        console.log(`[API Success] POST /auth/register`, data);
        return data;
      }).catch((e) => {
        const errorMsg = e.message || "Network error: Unable to reach the server";
        console.error(`[API Failed] Register:`, e);
        throw new Error(errorMsg);
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
  updateBook: (id, title, author, subject, available_copies, total_copies) => req(`/books/${id}`, { method: "PUT", body: JSON.stringify({ title, author, subject, available_copies, total_copies }) }),
  updateBookCopies: (id, added_copies) => req(`/books/${id}/copies`, { method: "PATCH", body: JSON.stringify({ added_copies }) }),
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
  markNotificationRead: (notificationId) => req(`/notifications/${notificationId}/read`, { method: "POST" }),
  markAllNotificationsRead: () => req("/notifications/mark-all-read", { method: "POST" }),
  requests: () => req("/records/requests"),
  approveRequest: (record_id) => req(`/records/${record_id}/approve`, { method: "POST" }),
  rejectRequest: (record_id) => req(`/records/${record_id}/reject`, { method: "POST" }),
  getProfile: () => req("/profile"),
};

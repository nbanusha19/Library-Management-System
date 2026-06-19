import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { formatDateShort } from "../utils/date";
import { useAuth } from "../hooks/useAuth";

export default function BooksPage({ canBorrow = true }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [books, setBooks] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", author: "", subject: "", total_copies: 1 });
  const [submitting, setSubmitting] = useState(false);

  const loadBooks = () => {
    setLoading(true);
    setMessage("");
    api.books(subject)
      .then((data) => setBooks(data))
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.subjects().then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    loadBooks();
  }, [subject]);

  const borrowBook = async (book) => {
    setMessage("");
    try {
      await api.borrow(book.id);
      setMessage(`Request sent for "${book.title}".`);
      loadBooks();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      if (!formData.title || !formData.author || !formData.subject) {
        setMessage("Title, author, and subject are required.");
        setSubmitting(false);
        return;
      }
      await api.createBook(formData.title, formData.author, formData.subject, parseInt(formData.total_copies) || 1);
      setMessage("Book added successfully.");
      setFormData({ title: "", author: "", subject: "", total_copies: 1 });
      setShowAddForm(false);
      loadBooks();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setMessage("");
    try {
      await api.deleteBook(bookId);
      setMessage("Book deleted successfully.");
      loadBooks();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="page-card">
      <PageHeader
        title="Books"
        subtitle="Browse available books and manage your library."
      />

      <div className="books-toolbar">
        <div className="books-filter">Filter by subject:</div>
        <div className="subjects">
          <button className={!subject ? "active" : ""} onClick={() => setSubject("")}>All</button>
          {subjects.map((s) => (
            <button key={s} className={subject === s ? "active" : ""} onClick={() => setSubject(s)}>
              {s}
            </button>
          ))}
        </div>
        {user?.role === "admin" && (
          <button className="primary" onClick={() => setShowAddForm(true)} style={{ marginLeft: "auto" }}>
            ➕ Add Book
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Book</h3>
            <form onSubmit={handleAddBook}>
              <div>
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Book title"
                  required
                />
              </div>
              <div>
                <label>Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                  required
                />
              </div>
              <div>
                <label>Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Total Copies</label>
                <input
                  type="number"
                  value={formData.total_copies}
                  onChange={(e) => setFormData({ ...formData, total_copies: e.target.value })}
                  min="1"
                  required
                />
              </div>
              <div style={{ display: "flex", gap: ".75rem", marginTop: "1rem" }}>
                <button type="submit" className="primary" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Book"}
                </button>
                <button type="button" className="secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && <p className="notice">{message}</p>}

      {loading ? (
        <p className="notice">Loading books...</p>
      ) : books.length === 0 ? (
        <p className="empty">No books found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Subject</th>
              <th>Available</th>
              {canBorrow && <th>Action</th>}
              {user?.role === "admin" && <th>Manage</th>}
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.subject}</td>
                <td>{book.available_copies} / {book.total_copies}</td>
                {canBorrow && (
                  <td>
                    <button
                      className="primary"
                      disabled={book.available_copies <= 0}
                      onClick={() => borrowBook(book)}
                    >
                      {book.available_copies > 0 ? 'Borrow' : 'Unavailable'}
                    </button>
                  </td>
                )}
                {user?.role === "admin" && (
                  <td>
                    <button
                      className="danger"
                      onClick={() => handleDeleteBook(book.id, book.title)}
                    >
                      Delete
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

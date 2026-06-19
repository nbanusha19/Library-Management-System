import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { formatDateShort } from "../utils/date";

function groupRecordsByBorrower(records) {
  const groups = {};
  records.forEach((record) => {
    const key = `${record.user_id}-${record.borrower_name}`;
    if (!groups[key]) {
      groups[key] = { borrower_name: record.borrower_name, books: [] };
    }
    groups[key].books.push(record);
  });
  return Object.values(groups);
}

export default function BorrowedPage({ mode }) {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loader = mode === "active" ? api.active() : api.history();
    loader
      .then(setRecords)
      .catch((e) => setMessage(e.message));
  }, [mode]);

  const ret = async (id) => {
    try {
      await api.returnBook(id);
      setMessage("Book returned successfully.");
      const res = await api.active();
      setRecords(res);
    } catch (e) {
      setMessage(e.message);
    }
  };

  const grouped = groupRecordsByBorrower(records);

  const badge = (book) => {
    if (book.status === "requested") return <span className="badge pending">Pending Approval</span>;
    if (book.status === "borrowed") return <span className="badge borrowed">Borrowed</span>;
    return <span className="badge returned">Returned</span>;
  };

  return (
    <div className="page-card">
      <PageHeader
        title={mode === "active" ? "Currently Borrowed" : "Return History"}
        subtitle={mode === "active" ? "Active loans with return controls." : "Completed borrows and history."}
      />

      {message && <p className="notice">{message}</p>}

      {grouped.length === 0 ? (
        <p className="empty">No records available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Borrower</th>
              <th>Book</th>
              <th>Borrowed</th>
              <th>Due</th>
              {mode === "history" ? <th>Returned</th> : <th>Status</th>}
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) =>
              group.books.map((book, index) => (
                <tr key={book.id}>
                  {index === 0 && <td rowSpan={group.books.length}>{group.borrower_name}</td>}
                  <td>
                    <div className="book-group-item">
                      <strong>{book.title}</strong>
                      {mode === "active" && book.status === "borrowed" && (
                        <button className="button-return" onClick={() => ret(book.id)}>Return</button>
                      )}
                    </div>
                  </td>
                  <td>{formatDateShort(book.borrow_date)}</td>
                  <td>{formatDateShort(book.due_date)}</td>
                  {mode === "history" ? <td>{formatDateShort(book.returned_date)}</td> : <td>{badge(book)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

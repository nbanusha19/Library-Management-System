# Library Management System

A full-stack library management system to borrow & return books across subjects:
**Science, Kannada, English, Mathematics, Social Studies, Sanskrit, Hindi**.

- **Frontend:** React (Vite)
- **Backend:** Python Flask + Flask-CORS + mysql-connector-python
- **Database:** MySQL

---

## 1. Database Setup

```bash
mysql -u root -p < database/schema.sql
```

This creates the `library_db` database with tables: `books`, `borrow_records`.
Sample books for each subject are seeded.

## 2. Backend Setup (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Edit DB credentials in `backend/app.py` (or set env vars `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

Make sure your local MySQL server is running and accepting connections on `127.0.0.1:3306` before starting the backend.

```bash
python app.py
```

API runs at `http://localhost:5000`.

### Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET  | `/api/books`                       | List all books (optional `?subject=Science`) |
| GET  | `/api/subjects`                    | List subjects |
| POST | `/api/borrow`                      | Borrow a book `{book_id, borrower_name}` |
| POST | `/api/return/<record_id>`          | Return a borrowed book |
| GET  | `/api/records`                     | All borrow records (active + history) |
| GET  | `/api/records/active`              | Currently borrowed |
| GET  | `/api/records/history`             | Returned history |

## 3. Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Notes
- Default loan period: **14 days** (due date auto-computed).
- The `borrow_records` table keeps **full history** — returned books are kept with `returned_date`.

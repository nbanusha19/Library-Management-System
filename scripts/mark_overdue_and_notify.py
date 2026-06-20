from datetime import date
import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
import backend.app as app

conn = app.get_conn(); cur = conn.cursor()
print('Altering borrow_records.status enum to include rejected and overdue...')
cur.execute("ALTER TABLE borrow_records MODIFY status ENUM('requested','borrowed','returned','rejected','overdue') NOT NULL DEFAULT 'borrowed'")
conn.commit()
print('Altered enum.')

# Find borrowed records past due
cur.execute("SELECT id, user_id, book_id, due_date, status FROM borrow_records WHERE status='borrowed' AND due_date < %s", (date.today(),))
rows = cur.fetchall()
print('Found', len(rows), 'past-due borrowed records')
for r in rows:
    rec_id, user_id, book_id, due_date, status = r
    # mark overdue
    cur.execute("UPDATE borrow_records SET status='overdue' WHERE id=%s", (rec_id,))
    # get book title
    cur.execute("SELECT title FROM books WHERE id=%s", (book_id,))
    title_row = cur.fetchone()
    title = title_row[0] if title_row else 'your book'
    days_late = (date.today() - due_date).days if due_date else 0
    msg = f"Overdue: Your borrow '{title}' is {days_late} day{'s' if days_late != 1 else ''} late. Please return it."
    # avoid duplicate overdue notification for same book/user
    like_pattern = '%' + title.replace("%","\\%") + '%'
    cur.execute("SELECT COUNT(*) FROM notifications WHERE user_id=%s AND message LIKE %s", (user_id, like_pattern))
    already = cur.fetchone()[0]
    if already == 0:
        cur.execute("INSERT INTO notifications (user_id, message) VALUES (%s, %s)", (user_id, msg))
        print('Inserted notification for user', user_id)
    else:
        print('Notification exists for', user_id, title)

conn.commit()
cur.close(); conn.close()
print('Done')

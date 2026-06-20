import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
import backend.app as app
from datetime import date
conn = app.get_conn(); cur = conn.cursor()
print('Altering borrow_records.status enum to include overdue...')
cur.execute("ALTER TABLE borrow_records MODIFY status ENUM('requested','borrowed','returned','overdue') NOT NULL DEFAULT 'borrowed'")
conn.commit()
print('Altered enum.')
# Now mark Anusha's specific record (find by user and book title) as overdue and insert notification
cur.execute("SELECT id, book_id, due_date, status FROM borrow_records WHERE user_id=%s AND status IN ('borrowed') ORDER BY id DESC", (9,))
rows = cur.fetchall()
print('Found borrow rows for user 9:', rows)
# Try to find Fundamentals of Physics or the one with due_date in June
rec_id = None
for r in rows:
    if r[2] and r[2] < date.today():
        rec_id = r[0]
        break
if rec_id:
    print('Marking record', rec_id, 'as overdue')
    cur.execute("UPDATE borrow_records SET status='overdue' WHERE id=%s", (rec_id,))
    cur.execute("SELECT b.title FROM books b JOIN borrow_records r ON b.id=r.book_id WHERE r.id=%s", (rec_id,))
    title = cur.fetchone()[0]
    late_days = (date.today() - r[2]).days
    msg = f"Overdue: Your borrow '{title}' is {late_days} day{'s' if late_days != 1 else ''} late. Please return it."
    cur.execute("INSERT INTO notifications (user_id, message) VALUES (%s, %s)", (9, msg))
    conn.commit()
    print('Inserted notification for user 9')
else:
    print('No past-due borrowed record found for user 9')
cur.close(); conn.close()
print('Done')

import sys
import os
from datetime import date, timedelta

# ensure project root is on sys.path so we can import backend.app
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
import backend.app as app

conn = app.get_conn()
cur = conn.cursor()

# try to find Anusha (case-insensitive)
cur.execute("SELECT id, username FROM users WHERE LOWER(username)=%s LIMIT 1", ("anusha",))
row = cur.fetchone()
if not row:
    cur.execute("SELECT id, username FROM users WHERE LOWER(username) LIKE %s LIMIT 1", ("%anusha%",))
    row = cur.fetchone()
if not row:
    print('User Anusha not found')
    cur.close(); conn.close(); sys.exit(1)
user_id = row[0]
print('Found user:', row[1], 'id=', user_id)

# find borrow record for Fundamentals of Physics for this user
cur.execute(
    "SELECT r.id, b.title, r.status, r.due_date FROM borrow_records r JOIN books b ON b.id=r.book_id WHERE r.user_id=%s AND b.title LIKE %s LIMIT 1",
    (user_id, "%Fundamentals of Physics%")
)
br = cur.fetchone()
if not br:
    print('Borrow record for Fundamentals of Physics not found for user')
    cur.close(); conn.close(); sys.exit(1)
rec_id, title, status, due_date = br
print('Found record:', rec_id, title, status, due_date)

# set due_date to 10 days ago and status to borrowed
new_due = date.today() - timedelta(days=10)
cur.execute("UPDATE borrow_records SET due_date=%s, status='borrowed' WHERE id=%s", (new_due, rec_id))
conn.commit()
print('Updated record due_date to', new_due)
cur.close(); conn.close()
print('Done')

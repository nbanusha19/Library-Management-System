import sys, os
from datetime import date
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
import backend.app as app

conn = app.get_conn(); cur = conn.cursor()

# Find another user to add overdue record
cur.execute("SELECT id, username FROM users WHERE role='user' AND id != 9 LIMIT 1")
user = cur.fetchone()
if not user:
    print("No other user found")
    cur.close(); conn.close()
    exit(1)

user_id, username = user
print(f"Adding overdue record for user: {username} (id={user_id})")

# Pick a book
cur.execute("SELECT id, title FROM books WHERE id != 1 LIMIT 1")
book = cur.fetchone()
if not book:
    print("No book found")
    cur.close(); conn.close()
    exit(1)

book_id, book_title = book
print(f"Using book: {book_title} (id={book_id})")

# Create overdue borrow record
borrow_date = date(2026, 5, 15)
due_date = date(2026, 5, 30)  # past due
cur.execute(
    "INSERT INTO borrow_records (book_id, user_id, borrower_name, borrow_date, due_date, status) VALUES (%s, %s, %s, %s, %s, %s)",
    (book_id, user_id, username, borrow_date, due_date, 'overdue')
)
conn.commit()

# Create notification
days_late = (date.today() - due_date).days
msg = f"Overdue: Your borrow '{book_title}' is {days_late} days late. Please return it."
cur.execute("INSERT INTO notifications (user_id, message) VALUES (%s, %s)", (user_id, msg))
conn.commit()

print(f"Added overdue record and notification for {username}")
cur.close(); conn.close()

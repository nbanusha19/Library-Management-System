import sys, os
from datetime import date
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
import backend.app as app

conn = app.get_conn(); cur = conn.cursor()
print('Borrow records for user 10 (Raksha):')
cur.execute("SELECT r.id, r.book_id, r.borrower_name, r.borrow_date, r.due_date, r.returned_date, r.status, b.title FROM borrow_records r LEFT JOIN books b ON r.book_id=b.id WHERE r.user_id=10 ORDER BY r.id DESC")
rows = cur.fetchall()
for r in rows:
    print(r)

print('\nNotifications for user 10:')
cur.execute("SELECT id, message, is_read, updated_at FROM notifications WHERE user_id=10")
rows = cur.fetchall()
for r in rows:
    print(r)

cur.close(); conn.close()

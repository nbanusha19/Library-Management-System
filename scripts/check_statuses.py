import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
import backend.app as app
conn = app.get_conn(); cur = conn.cursor()
cur.execute("SELECT status, COUNT(*) FROM borrow_records GROUP BY status")
rows = cur.fetchall()
print(rows)
cur.close(); conn.close()

import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
import backend.app as app
conn = app.get_conn(); cur = conn.cursor()
cur.execute("SELECT id, username, role, status FROM users WHERE username='anusha'")
rows = cur.fetchall()
print(rows)
cur.close(); conn.close()

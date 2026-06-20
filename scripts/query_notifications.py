import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
import backend.app as app
conn = app.get_conn(); cur = conn.cursor()
cur.execute("SELECT id, message, is_read, updated_at FROM notifications WHERE user_id=%s ORDER BY updated_at DESC", (9,))
for r in cur.fetchall():
    print(r)
cur.close(); conn.close()

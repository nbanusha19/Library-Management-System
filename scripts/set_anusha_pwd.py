import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
import backend.app as app
from werkzeug.security import generate_password_hash

conn = app.get_conn(); cur = conn.cursor()
hashed = generate_password_hash("anusha123")
cur.execute("UPDATE users SET password=%s WHERE username='anusha'", (hashed,))
conn.commit()
cur.close(); conn.close()
print("Anusha password set to 'anusha123'")

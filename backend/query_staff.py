import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
config = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'library_db'),
}
conn = mysql.connector.connect(**config)
cur = conn.cursor(dictionary=True)
cur.execute("SELECT id, username, email, role, status FROM users WHERE role IN ('staff','admin')")
rows = cur.fetchall()
for row in rows:
    print(row)
cur.close()
conn.close()

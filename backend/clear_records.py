import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD') or 'Anushanb@19',
    'database': os.getenv('DB_NAME', 'library_db'),
}

cn = mysql.connector.connect(**DB_CONFIG)
cur = cn.cursor()

print('Connected to DB')
for query in [
    'SELECT COUNT(*) FROM users',
    "SELECT role, COUNT(*) FROM users GROUP BY role",
    'SELECT COUNT(*) FROM borrow_records',
    'SELECT COUNT(*) FROM notifications',
]:
    cur.execute(query)
    print(query)
    for row in cur.fetchall():
        print(row)

print('\nAbout to delete all user registration and login records.\n')
# preserve staff/admin?
# Delete all non-admin/staff users and related records
cur.execute("DELETE n FROM notifications n JOIN users u ON n.user_id = u.id WHERE u.role = 'user'")
cur.execute("DELETE b FROM borrow_records b JOIN users u ON b.user_id = u.id WHERE u.role = 'user'")
cur.execute("DELETE FROM users WHERE role = 'user'")
cn.commit()
print('Deleted all user role registration/login data while preserving admin/staff accounts.')
cur.close()
cn.close()

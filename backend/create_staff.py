import os
import mysql.connector
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
config = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD') or 'Anushanb@19',
    'database': os.getenv('DB_NAME', 'library_db'),
}

username = 'staff'
email = 'staff@example.com'
password = 'staff123'
phone = '0000000000'

conn = mysql.connector.connect(**config)
cur = conn.cursor()
cur.execute('SELECT id FROM users WHERE username=%s OR email=%s', (username, email))
row = cur.fetchone()
if row:
    print(f'Staff user already exists with id {row[0]}.')
else:
    hashed = generate_password_hash(password)
    cur.execute(
        "INSERT INTO users (username, email, phone, password, role, status) VALUES (%s, %s, %s, %s, 'staff', 'approved')",
        (username, email, phone, hashed),
    )
    conn.commit()
    print(f"Staff user created: username={username}, email={email}, password={password}")
cur.close()
conn.close()

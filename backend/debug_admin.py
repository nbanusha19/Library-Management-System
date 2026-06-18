import mysql.connector
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash, check_password_hash

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD") or "Anushanb@19",
    "database": os.getenv("DB_NAME", "library_db"),
}

conn = mysql.connector.connect(**DB_CONFIG)
cur = conn.cursor()

# Check admin user
cur.execute("SELECT id, username, email, role, status, password FROM users WHERE username='admin'")
row = cur.fetchone()

if row:
    id, username, email, role, status, password_hash = row
    print(f"✓ Admin user found:")
    print(f"  ID: {id}")
    print(f"  Username: {username}")
    print(f"  Email: {email}")
    print(f"  Role: {role}")
    print(f"  Status: {status}")
    print(f"  Password Hash: {password_hash[:50]}...")
    
    # Test password hash
    test_password = "admin123"
    is_match = check_password_hash(password_hash, test_password)
    print(f"\n  Password 'admin123' matches hash: {is_match}")
else:
    print("✗ Admin user NOT found. Creating one now...")
    hashed = generate_password_hash("admin123")
    cur.execute(
        "INSERT INTO users (username, email, phone, password, role, status) VALUES (%s, %s, %s, %s, %s, %s)",
        ("admin", "admin@example.com", "", hashed, "admin", "approved"),
    )
    conn.commit()
    print(f"✓ Admin user created with hashed password:\n  {hashed[:50]}...")

cur.close()
conn.close()

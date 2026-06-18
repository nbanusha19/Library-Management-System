#!/usr/bin/env python
"""Initialize/reset the library database"""
import mysql.connector
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
import os

# Load environment variables from backend/.env when present
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD") or "Anushanb@19",  # fallback default for dev
}

# Read schema file
with open("../database/schema.sql", "r") as f:
    schema = f.read()

# Connect and execute schema
conn = mysql.connector.connect(**DB_CONFIG)
cur = conn.cursor()

# Split by semicolons and execute each statement
for statement in schema.split(";"):
    statement = statement.strip()
    if statement:
        try:
            print(f"Executing: {statement[:80]}...")
            cur.execute(statement)
        except Exception as e:
            print(f"  Error: {e}")

conn.commit()
cur.close()
conn.close()
print("Database initialized successfully!")

# Now create the default admin user
print("\nCreating default admin user...")
admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
admin_hashed = generate_password_hash(admin_password)

conn = mysql.connector.connect(**DB_CONFIG)
conn.database = os.getenv("DB_NAME", "library_db")
cur = conn.cursor()

try:
    # Check if admin already exists
    cur.execute("SELECT id FROM users WHERE username='admin'")
    if cur.fetchone():
        print("  Admin user already exists.")
    else:
        cur.execute(
            "INSERT INTO users (username, email, phone, password, role, status) VALUES (%s, %s, %s, %s, %s, %s)",
            ("admin", "admin@example.com", "", admin_hashed, "admin", "approved"),
        )
        conn.commit()
        print(f"  ✓ Admin user created: username='admin', password='{admin_password}'")
finally:
    cur.close()
    conn.close()

print("\nSetup complete! You can now login with:")
print("  Username: admin")
print(f"  Password: {admin_password}")

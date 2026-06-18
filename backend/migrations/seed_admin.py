#!/usr/bin/env python
"""Seed an initial approved admin user into the `users` table.

Usage:
  python migrations/seed_admin.py

Environment variables (optional):
  DB_HOST DB_USER DB_PASSWORD DB_NAME
  ADMIN_USERNAME ADMIN_EMAIL ADMIN_PASSWORD

If ADMIN_PASSWORD is not provided, the script will prompt for it.
"""
import os
from dotenv import load_dotenv
import getpass
import mysql.connector
from werkzeug.security import generate_password_hash

# Load environment variables from backend/.env when present
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD") or "Anushanb@19",  # fallback default for dev
    "database": os.getenv("DB_NAME", "library_db"),
}

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

if not ADMIN_PASSWORD:
    ADMIN_PASSWORD = getpass.getpass("Admin password (input hidden): ")

if not ADMIN_PASSWORD:
    print("No admin password provided; aborting.")
    raise SystemExit(1)

hashed = generate_password_hash(ADMIN_PASSWORD)

conn = mysql.connector.connect(**DB_CONFIG)
cur = conn.cursor()

try:
    # Ensure users table exists
    cur.execute("SHOW TABLES LIKE 'users'")
    if not cur.fetchone():
        print("users table not found. Run the schema initialization first.")
        raise SystemExit(1)

    # Check if username or email already exists
    cur.execute("SELECT id, username, email FROM users WHERE username=%s OR email=%s", (ADMIN_USERNAME, ADMIN_EMAIL))
    row = cur.fetchone()
    if row:
        print(f"Admin user already exists: {row}")
    else:
        cur.execute(
            "INSERT INTO users (username, email, phone, password, role, status) VALUES (%s, %s, %s, %s, 'admin', 'approved')",
            (ADMIN_USERNAME, ADMIN_EMAIL, '', hashed),
        )
        conn.commit()
        print(f"Admin user '{ADMIN_USERNAME}' created with role=admin and status=approved.")
finally:
    cur.close(); conn.close()

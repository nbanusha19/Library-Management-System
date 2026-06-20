#!/usr/bin/env python
"""
Update notifications table schema: Add DEFAULT value for title column
This allows the table to accept NULL values if title is not provided
"""

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "Anushanb@19"),
    "database": os.getenv("DB_NAME", "library_db"),
}

try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("Updating notifications table schema...")
    
    # Add DEFAULT value for title column
    alter_sql = "ALTER TABLE notifications MODIFY title VARCHAR(255) NOT NULL DEFAULT 'Notification'"
    cur.execute(alter_sql)
    conn.commit()
    
    print("✓ Successfully updated notifications table!")
    print("  - Added DEFAULT 'Notification' to title column")
    
    # Verify the schema change
    cur.execute("DESCRIBE notifications")
    columns = cur.fetchall()
    for col in columns:
        if col[0] == 'title':
            print(f"  - Column 'title': {col[1]} (Default: {col[5]})")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

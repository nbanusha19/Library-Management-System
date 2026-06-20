#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error

try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="Anushanb@19",
        database="library_db"
    )
    cursor = conn.cursor()
    
    # Alter the status column to add 'rejected' and 'overdue' to the ENUM
    alter_sql = """
    ALTER TABLE borrow_records 
    MODIFY status ENUM('requested','borrowed','returned','overdue','rejected') 
    NOT NULL DEFAULT 'borrowed'
    """
    
    cursor.execute(alter_sql)
    conn.commit()
    print("✓ Status ENUM updated successfully")
    
    cursor.close()
    conn.close()
except Error as e:
    print(f"✗ Error: {e}")

#!/usr/bin/env python
"""
Restore test data: Add borrow records, returned records, and overdue records to the database
This populates the dashboard with real data
"""

import mysql.connector
from datetime import date, timedelta

conn = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='Anushanb@19',
    database='library_db'
)
cur = conn.cursor()

try:
    # Get sample users (should have at least admin, staff, and some test users)
    cur.execute("SELECT id, username FROM users WHERE role='user' LIMIT 5")
    users = cur.fetchall()
    
    if len(users) < 5:
        print(f"Found only {len(users)} user(s). Creating more test users...")
        # Create test users - use simple hashed password (bcrypt format)
        test_users = [
            ('Anusha', 'anusha@example.com', '9876543210'),
            ('Raksha', 'raksha@example.com', '9876543211'),
            ('Sonu', 'sonu@example.com', '9876543212'),
            ('Chandu', 'chandu@example.com', '9876543213'),
            ('Sandeep', 'sandeep@example.com', '9876543214'),
        ]
        
        for username, email, phone in test_users:
            # Use a pre-hashed password (same as in seed_admin.py)
            hashed = '$2b$12$dNH7WnUvvJ9vJ9vJ9vJ9vJ9vJ9vJ9vJ9vJ9vJ9vJ9vJ9vJ9vJ9vJ9v'
            try:
                cur.execute(
                    "INSERT INTO users (username, email, phone, password, role, status) VALUES (%s, %s, %s, %s, %s, 'approved')",
                    (username, email, phone, hashed, 'user')
                )
            except:
                pass  # User might already exist
        conn.commit()
        
        cur.execute("SELECT id, username FROM users WHERE role='user' LIMIT 5")
        users = cur.fetchall()
    
    # Get sample books
    cur.execute("SELECT id, title FROM books LIMIT 10")
    books = cur.fetchall()
    
    if not books:
        print("No books found in database")
        cur.close()
        conn.close()
        exit(1)
    
    print(f"Found {len(users)} users and {len(books)} books")
    
    # Clear existing borrow_records (only for fresh start)
    cur.execute("DELETE FROM borrow_records")
    conn.commit()
    print("Cleared existing borrow records")
    
    # Add active borrowed records (not yet returned)
    today = date.today()
    borrow_id = 1
    
    # Borrowed - 5 days ago, due in 10 days (future due date)
    for i, (user_id, username) in enumerate(users[:3]):
        book_id = books[i % len(books)][0]
        book_title = books[i % len(books)][1]
        borrow_date = today - timedelta(days=5)
        due_date = today + timedelta(days=10)
        
        cur.execute(
            "INSERT INTO borrow_records (book_id, user_id, borrower_name, borrow_date, due_date, status) "
            "VALUES (%s, %s, %s, %s, %s, 'borrowed')",
            (book_id, user_id, username, borrow_date, due_date)
        )
        print(f"  Added: {username} borrowed {book_title} (due {due_date})")
    
    # Overdue - 15 days ago, due 5 days ago (overdue by 5 days)
    for i, (user_id, username) in enumerate(users[2:4]):
        book_id = books[(i+3) % len(books)][0]
        book_title = books[(i+3) % len(books)][1]
        borrow_date = today - timedelta(days=15)
        due_date = today - timedelta(days=5)
        
        cur.execute(
            "INSERT INTO borrow_records (book_id, user_id, borrower_name, borrow_date, due_date, status) "
            "VALUES (%s, %s, %s, %s, %s, 'borrowed')",
            (book_id, user_id, username, borrow_date, due_date)
        )
        print(f"  Added: {username} borrowed {book_title} (OVERDUE - due {due_date})")
    
    # Returned records (returned_date is NOT NULL)
    for i, (user_id, username) in enumerate(users[3:]):
        book_id = books[(i+5) % len(books)][0]
        book_title = books[(i+5) % len(books)][1]
        borrow_date = today - timedelta(days=30)
        due_date = today - timedelta(days=15)
        returned_date = today - timedelta(days=10)
        
        cur.execute(
            "INSERT INTO borrow_records (book_id, user_id, borrower_name, borrow_date, due_date, returned_date, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, 'returned')",
            (book_id, user_id, username, borrow_date, due_date, returned_date)
        )
        print(f"  Added: {username} returned {book_title} (returned on {returned_date})")
    
    conn.commit()
    
    # Check the data we added
    cur.execute("SELECT COUNT(*) FROM borrow_records WHERE returned_date IS NULL")
    active = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM borrow_records WHERE returned_date IS NOT NULL")
    returned = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM borrow_records WHERE returned_date IS NULL AND due_date < %s", (today,))
    overdue = cur.fetchone()[0]
    
    print(f"\nData Summary:")
    print(f"  Active records (not returned): {active}")
    print(f"  Returned records: {returned}")
    print(f"  Overdue records: {overdue}")
    
    cur.close()
    conn.close()
    print("\n✓ Test data restored successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
    cur.close()
    conn.close()

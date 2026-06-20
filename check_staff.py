#!/usr/bin/env python
import mysql.connector

conn = mysql.connector.connect(host='127.0.0.1', user='root', password='Anushanb@19', database='library_db')
cur = conn.cursor()

print('=== STAFF RECORDS ===')
cur.execute('SELECT id, username, email, role, status FROM users WHERE role="staff"')
for row in cur.fetchall():
    print(f'ID:{row[0]:2} | {row[1]:20} | {row[2]:30} | {row[3]:8} | {row[4]}')

cur.close()
conn.close()

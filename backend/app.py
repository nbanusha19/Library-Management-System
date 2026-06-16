import os
from datetime import date, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "Anushanb@19",
    "database": "library_db"
}

LOAN_DAYS = 15
SUBJECTS = ["Science", "Kannada", "English", "Mathematics",
            "Social Studies", "Sanskrit", "Hindi"]

pool = pooling.MySQLConnectionPool(pool_name="lms_pool", pool_size=5, **DB_CONFIG)


def get_conn():
    return pool.get_connection()


def rows(cursor):
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, r)) for r in cursor.fetchall()]


def get_auth():
    role = (request.headers.get("X-Auth-Role") or "").lower()
    user_id = request.headers.get("X-Auth-User-Id")
    if role not in ("user", "admin") or not user_id:
        return None
    try:
        user_id = int(user_id)
    except ValueError:
        return None
    return {"role": role, "id": user_id}


def find_user_by_id(user_id):
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, username, email, phone, status FROM users WHERE id=%s", (user_id,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    return {
        "id": row[0], "username": row[1], "email": row[2],
        "phone": row[3], "status": row[4]
    }


def find_admin_by_id(admin_id):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, username, email FROM admins WHERE id=%s", (admin_id,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "email": row[2], "role": "admin"}


def get_user_by_username(username):
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, username, email, phone, password, status FROM users WHERE username=%s", (username,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    return {
        "id": row[0], "username": row[1], "email": row[2],
        "phone": row[3], "password": row[4], "status": row[5]
    }


def get_admin_by_username(username):
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, username, email, password FROM admins WHERE username=%s", (username,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "email": row[2], "password": row[3]}


@app.route("/api/subjects", methods=["GET"])
def list_subjects():
    return jsonify(SUBJECTS)


@app.route("/api/books", methods=["GET"])
def list_books():
    subject = request.args.get("subject")
    conn = get_conn(); cur = conn.cursor()
    if subject:
        cur.execute("SELECT * FROM books WHERE subject=%s ORDER BY title", (subject,))
    else:
        cur.execute("SELECT * FROM books ORDER BY subject, title")
    data = rows(cur)
    cur.close(); conn.close()
    return jsonify(data)


@app.route("/api/auth/register", methods=["POST"])
def register():
    payload = request.get_json() or {}
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip()
    phone = (payload.get("phone") or "").strip()
    password = (payload.get("password") or "").strip()

    if not username or not email or not phone or not password:
        return jsonify({"error": "username, email, phone, and password are required"}), 400

    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id FROM users WHERE username=%s OR email=%s OR phone=%s",
            (username, email, phone),
        )
        if cur.fetchone():
            return jsonify({"error": "Username, email, or phone already registered"}), 400

        cur.execute(
            "INSERT INTO users (username, email, phone, password, status) VALUES (%s, %s, %s, %s, 'pending')",
            (username, email, phone, password),
        )
        user_id = cur.lastrowid
        cur.execute(
            "INSERT INTO user_status_history (user_id, status, comment) VALUES (%s, 'pending', 'Registered and waiting for approval')",
            (user_id,),
        )
        conn.commit()
        return jsonify({"message": "Registration complete. Wait for admin approval."}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@app.route("/api/auth/login", methods=["POST"])
def login():
    payload = request.get_json() or {}
    username = (payload.get("username") or "").strip()
    password = (payload.get("password") or "").strip()
    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    admin = get_admin_by_username(username)
    if admin and admin["password"] == password:
        return jsonify({"user": {"id": admin["id"], "username": admin["username"], "email": admin["email"], "role": "admin"}})

    user = get_user_by_username(username)
    if not user or user["password"] != password:
        return jsonify({"error": "Invalid login credentials"}), 401

    if user["status"] == "pending":
        return jsonify({"error": "Account pending approval"}), 403
    if user["status"] == "rejected":
        return jsonify({"error": "Account rejected by admin"}), 403

    return jsonify({
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "phone": user["phone"],
            "status": user["status"],
            "role": "user"
        }
    })


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    auth = get_auth()
    if not auth:
        return jsonify({"error": "Unauthorized"}), 401
    if auth["role"] == "admin":
        admin = find_admin_by_id(auth["id"])
        if not admin:
            return jsonify({"error": "Unauthorized"}), 401
        return jsonify(admin)

    user = find_user_by_id(auth["id"])
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    user["role"] = "user"
    return jsonify(user)


@app.route("/api/users/pending", methods=["GET"])
def pending_users():
    auth = get_auth()
    if not auth or auth["role"] != "admin":
        return jsonify({"error": "Forbidden"}), 403

    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, username, email, phone, status, created_at FROM users WHERE status='pending' ORDER BY created_at"
    )
    data = rows(cur)
    cur.close(); conn.close()
    return jsonify(data)


@app.route("/api/users/<int:user_id>/review", methods=["POST"])
def review_user(user_id):
    auth = get_auth()
    if not auth or auth["role"] != "admin":
        return jsonify({"error": "Forbidden"}), 403

    payload = request.get_json() or {}
    action = (payload.get("action") or "").strip().lower()
    comment = (payload.get("comment") or "").strip()
    if action not in ("approve", "reject"):
        return jsonify({"error": "Action must be approve or reject"}), 400

    target_status = "approved" if action == "approve" else "rejected"
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute("SELECT status FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404

        cur.execute("UPDATE users SET status=%s WHERE id=%s", (target_status, user_id))
        cur.execute(
            "INSERT INTO user_status_history (user_id, status, comment) VALUES (%s, %s, %s)",
            (user_id, target_status, comment or f"{action.capitalize()}ed by admin"),
        )
        conn.commit()
        return jsonify({"message": f"User {target_status}."})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@app.route("/api/users/me/status-history", methods=["GET"])
def my_status_history():
    auth = get_auth()
    if not auth or auth["role"] != "user":
        return jsonify({"error": "Forbidden"}), 403

    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT status, comment, changed_at FROM user_status_history WHERE user_id=%s ORDER BY changed_at DESC",
        (auth["id"],),
    )
    data = rows(cur)
    cur.close(); conn.close()
    return jsonify(data)


def _records(auth=None, base_where="", params=()):
    where_sql = base_where
    if auth and auth["role"] == "user":
        if base_where.strip():
            where_sql = f"{base_where} AND r.user_id=%s"
        else:
            where_sql = "WHERE r.user_id=%s"
        params = (*params, auth["id"])

    conn = get_conn(); cur = conn.cursor()
    sql = f"""SELECT r.id, r.book_id, b.title, b.subject, b.author,
                     r.user_id, r.borrower_name, r.borrow_date, r.due_date,
                     r.returned_date, r.status
              FROM borrow_records r
              JOIN books b ON b.id = r.book_id
              {where_sql}
              ORDER BY r.borrow_date DESC, r.id DESC"""
    cur.execute(sql, params)
    data = rows(cur)
    cur.close(); conn.close()
    for d in data:
        for k in ("borrow_date", "due_date", "returned_date"):
            if d.get(k) is not None:
                d[k] = str(d[k])
    return data


@app.route("/api/records", methods=["GET"])
def all_records():
    auth = get_auth()
    if not auth:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(_records(auth))


@app.route("/api/records/active", methods=["GET"])
def active_records():
    auth = get_auth()
    if not auth:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(_records(auth, "WHERE r.status='borrowed'"))


@app.route("/api/records/history", methods=["GET"])
def history_records():
    auth = get_auth()
    if not auth:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(_records(auth, "WHERE r.status='returned'"))


@app.route("/api/borrow", methods=["POST"])
def borrow():
    auth = get_auth()
    if not auth or auth["role"] != "user":
        return jsonify({"error": "Only approved users can borrow books"}), 403

    user = find_user_by_id(auth["id"])
    if not user:
        return jsonify({"error": "User not found"}), 401
    if user["status"] != "approved":
        return jsonify({"error": "Account not approved"}), 403

    payload = request.get_json() or {}
    book_id = payload.get("book_id")
    if not book_id:
        return jsonify({"error": "book_id required"}), 400

    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute("SELECT available_copies FROM books WHERE id=%s FOR UPDATE", (book_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Book not found"}), 404
        if row[0] <= 0:
            return jsonify({"error": "No copies available"}), 400

        borrow_date = date.today()
        due_date = borrow_date + timedelta(days=LOAN_DAYS)
        cur.execute(
            "INSERT INTO borrow_records (book_id, user_id, borrower_name, borrow_date, due_date, status) VALUES (%s, %s, %s, %s, %s, 'borrowed')",
            (book_id, auth["id"], user["username"], borrow_date, due_date),
        )
        record_id = cur.lastrowid
        cur.execute("UPDATE books SET available_copies = available_copies - 1 WHERE id=%s", (book_id,))
        conn.commit()
        return jsonify({
            "id": record_id,
            "book_id": book_id,
            "borrower_name": user["username"],
            "borrow_date": str(borrow_date),
            "due_date": str(due_date),
            "status": "borrowed"
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@app.route("/api/return/<int:record_id>", methods=["POST"])
def return_book(record_id):
    auth = get_auth()
    if not auth or auth["role"] != "user":
        return jsonify({"error": "Only borrowers can return books"}), 403

    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute("SELECT book_id, status, user_id FROM borrow_records WHERE id=%s FOR UPDATE", (record_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Record not found"}), 404
        book_id, status, record_user_id = row
        if record_user_id != auth["id"]:
            return jsonify({"error": "You may only return your own borrowed books"}), 403
        if status == "returned":
            return jsonify({"error": "Already returned"}), 400

        cur.execute(
            "UPDATE borrow_records SET status='returned', returned_date=%s WHERE id=%s",
            (date.today(), record_id),
        )
        cur.execute("UPDATE books SET available_copies = available_copies + 1 WHERE id=%s", (book_id,))
        conn.commit()
        return jsonify({"message": "Book returned", "record_id": record_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@app.route("/", methods=["GET"])
def index():
    return jsonify({"service": "Library Management API", "status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

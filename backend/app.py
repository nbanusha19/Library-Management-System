import os
from dotenv import load_dotenv

# Load environment variables from backend/.env when present
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
from datetime import date, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
# Use a permissive CORS during development to avoid preflight issues from the frontend dev server
CORS(app, supports_credentials=True)


@app.after_request
def add_cors_headers(response):
    response.headers.setdefault("Access-Control-Allow-Origin", "*")
    response.headers.setdefault("Access-Control-Allow-Headers", "Content-Type, X-Auth-Role, X-Auth-User-Id")
    response.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    return response

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD") or "Anushanb@19",  # fallback default for dev
    "database": os.getenv("DB_NAME", "library_db"),
}

LOAN_DAYS = 15
SUBJECTS = ["Science", "Kannada", "English", "Mathematics",
            "Social Studies", "Sanskrit", "Hindi"]

pool = None


def init_db_pool():
    global pool
    if pool is None:
        pool = pooling.MySQLConnectionPool(pool_name="lms_pool", pool_size=5, **DB_CONFIG)
    return pool


def get_conn():
    return init_db_pool().get_connection()


def rows(cursor):
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, r)) for r in cursor.fetchall()]


def get_auth():
    role = (request.headers.get("X-Auth-Role") or "").lower()
    user_id = request.headers.get("X-Auth-User-Id")
    if role not in ("user", "admin", "staff") or not user_id:
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
    cur.execute("SELECT id, username, email FROM users WHERE id=%s AND role='admin'", (admin_id,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "email": row[2], "role": "admin"}


def get_user_by_username(username):
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, username, email, phone, password, status, role, profile_photo FROM users WHERE username=%s", (username,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    return {
        "id": row[0], "username": row[1], "email": row[2],
        "phone": row[3], "password": row[4], "status": row[5], "role": row[6], "profile_photo": row[7]
    }


def get_admin_by_username(username):
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, username, email, password FROM users WHERE username=%s AND role='admin'", (username,)
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
        hashed = generate_password_hash(password)
        cur.execute(
            "INSERT INTO users (username, email, phone, password, status, role) VALUES (%s, %s, %s, %s, 'pending', 'user')",
            (username, email, phone, hashed),
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
    user = get_user_by_username(username)
    if not user or not check_password_hash(user["password"], password):
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
            "role": user.get("role", "user"),
            "profile_photo": user.get("profile_photo")
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


@app.route("/api/auth/debug", methods=["GET"])
def auth_debug():
    """Debug endpoint - shows auth headers and auth object"""
    auth = get_auth()
    headers = {
        "X-Auth-Role": request.headers.get("X-Auth-Role"),
        "X-Auth-User-Id": request.headers.get("X-Auth-User-Id"),
    }
    return jsonify({
        "headers": headers,
        "auth": auth,
        "auth_computed_from_headers": get_auth() is not None
    })


@app.route("/api/admin/init-db", methods=["POST"])
def init_db():
    """Initialize/reset database schema - admin only"""
    auth = get_auth()
    if not auth or auth["role"] != "admin":
        return jsonify({"error": "Forbidden"}), 403
    
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        # Read and execute schema
        with open("../database/schema.sql", "r") as f:
            schema = f.read()
        
        # Split by semicolons and execute each statement
        for statement in schema.split(";"):
            statement = statement.strip()
            if statement:
                cur.execute(statement)
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Database initialized successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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


@app.route("/api/users", methods=["GET"])
def list_users():
    auth = get_auth()
    if not auth or auth["role"] != "admin":
        return jsonify({"error": "Forbidden"}), 403

    status = (request.args.get("status") or "").strip().lower()
    role = (request.args.get("role") or "").strip().lower()
    q = (request.args.get("q") or "").strip()
    sort_by = (request.args.get("sort_by") or "created_at").strip().lower()
    sort_dir = (request.args.get("sort_dir") or "desc").strip().lower()
    try:
        page = max(int(request.args.get("page", 1)), 1)
    except ValueError:
        page = 1
    try:
        page_size = min(max(int(request.args.get("page_size", 10)), 1), 100)
    except ValueError:
        page_size = 10

    sort_columns = {
        "name": "username",
        "date_joined": "created_at",
        "created_at": "created_at",
        "status": "status",
        "role": "role",
    }
    sort_col = sort_columns.get(sort_by, "created_at")
    sort_dir = "asc" if sort_dir == "asc" else "desc"

    filters = []
    params = []
    if status in ("pending", "approved", "rejected"):
        filters.append("status=%s")
        params.append(status)
    if role in ("admin", "staff", "user"):
        filters.append("role=%s")
        params.append(role)
    if q:
        filters.append("(username LIKE %s OR email LIKE %s OR phone LIKE %s)")
        wildcard = f"%{q}%"
        params.extend([wildcard, wildcard, wildcard])

    where_sql = ""
    if filters:
        where_sql = "WHERE " + " AND ".join(filters)

    offset = (page - 1) * page_size

    conn = get_conn(); cur = conn.cursor()
    count_sql = f"SELECT COUNT(*) FROM users {where_sql}"
    cur.execute(count_sql, tuple(params))
    total = cur.fetchone()[0]

    query = f"SELECT id, username, email, phone, role, status, created_at FROM users {where_sql} ORDER BY {sort_col} {sort_dir} LIMIT %s OFFSET %s"
    cur.execute(query, (*params, page_size, offset))
    data = rows(cur)
    cur.close(); conn.close()

    return jsonify({
        "data": data,
        "page": page,
        "page_size": page_size,
        "total": total,
    })


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
        # Create a borrow request; staff/admin will approve and convert to 'borrowed'
        cur.execute(
            "INSERT INTO borrow_records (book_id, user_id, borrower_name, borrow_date, due_date, status) VALUES (%s, %s, %s, %s, %s, 'requested')",
            (book_id, auth["id"], user["username"], None, None),
        )
        record_id = cur.lastrowid
        conn.commit()
        return jsonify({
            "id": record_id,
            "book_id": book_id,
            "borrower_name": user["username"],
            "status": "requested"
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




@app.route("/api/records/requests", methods=["GET"])
def request_records():
    auth = get_auth()
    if not auth or auth["role"] not in ("admin","staff"):
        return jsonify({"error":"Forbidden"}),403
    return jsonify(_records(auth, "WHERE r.status='requested'"))


@app.route("/api/records/<int:record_id>/approve", methods=["POST"])
def approve_request(record_id):
    auth = get_auth()
    if not auth or auth["role"] not in ("admin","staff"):
        return jsonify({"error":"Forbidden"}),403
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute("SELECT book_id, status, user_id FROM borrow_records WHERE id=%s FOR UPDATE", (record_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error":"Record not found"}),404
        book_id, status, user_id = row
        if status != "requested":
            return jsonify({"error":"Record not in requested state"}),400
        cur.execute("SELECT available_copies FROM books WHERE id=%s FOR UPDATE", (book_id,))
        br = cur.fetchone()
        if not br:
            return jsonify({"error":"Book not found"}),404
        if br[0] <= 0:
            return jsonify({"error":"No copies available"}),400
        borrow_date = date.today()
        due_date = borrow_date + timedelta(days=LOAN_DAYS)
        cur.execute("UPDATE borrow_records SET status='borrowed', borrow_date=%s, due_date=%s WHERE id=%s", (borrow_date, due_date, record_id))
        cur.execute("UPDATE books SET available_copies = available_copies - 1 WHERE id=%s", (book_id,))
        msg = f"Your borrow request for record {record_id} has been approved. Due {str(due_date)}."
        cur.execute("INSERT INTO notifications (user_id, message) VALUES (%s, %s)", (user_id, msg))
        conn.commit()
        return jsonify({"message":"Request approved", "record_id":record_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"error":str(e)}),500
    finally:
        cur.close(); conn.close()


@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    auth = get_auth()
    if not auth:
        return jsonify({"error":"Unauthorized"}),401
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, message, is_read, created_at FROM notifications WHERE user_id=%s ORDER BY created_at DESC LIMIT 50", (auth["id"],))
    data = rows(cur)
    cur.close(); conn.close()
    return jsonify(data)


@app.route("/api/notifications/overdue-count", methods=["GET"])
def overdue_count():
    auth = get_auth()
    if not auth or auth["role"] not in ("admin","staff"):
        return jsonify({"error":"Forbidden"}),403
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM borrow_records WHERE status='borrowed' AND due_date < %s", (date.today(),))
    cnt = cur.fetchone()[0]
    cur.close(); conn.close()
    return jsonify({"count": cnt})


if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5000, debug=True)

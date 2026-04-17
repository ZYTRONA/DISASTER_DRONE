"""
NDRF Ground Control Station - Backend Server
Flask + Socket.IO + MySQL (XAMPP)

Routes (no /api prefix — matches all frontends):
  POST /request              — submit relief request (no auth)
  GET  /requests             — list all requests (plain array)
  GET  /requests/search      — search/filter requests
  POST /assign/<id>          — assign drone to request
  POST /in-transit/<id>      — mark in-transit (launch drone)
  POST /deliver/<id>         — mark delivered
  POST /user-confirm/<id>    — user confirms receipt
  GET  /telemetry            — latest telemetry per drone
  GET  /drones               — list drones
  GET  /drones/<id>/telemetry — drone telemetry history
  POST /auth/login
  POST /auth/register
  POST /auth/logout
  GET  /auth/me
  GET  /health

Socket events (server → client):
  new_request      — broadcast when request submitted
  request_update   — broadcast on any status change
  status_update    — relay from any client to all others
  telemetry:update — broadcast drone telemetry

Socket events (client → server):
  drone_telemetry  — drone hardware pushes telemetry
  status_update    — client relays status change
"""

import os
import json
import logging
import sys
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path
from uuid import uuid4

import jwt
import bcrypt
import mysql.connector
from mysql.connector import errorcode, pooling
from flask import Flask, request as req, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')


class Config:
    DB_HOST     = os.getenv('DB_HOST', 'localhost')
    DB_PORT     = int(os.getenv('DB_PORT', 3306))
    DB_USER     = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME     = os.getenv('DB_NAME', 'drone')

    FLASK_PORT  = int(os.getenv('FLASK_PORT', 5000))
    DEBUG       = os.getenv('DEBUG', 'True').lower() == 'true'

    JWT_SECRET  = os.getenv('JWT_SECRET_KEY', 'ndrf_secret_change_me')
    JWT_ALG     = 'HS256'
    JWT_EXP_H   = int(os.getenv('JWT_EXPIRATION_HOURS', 24))

    CORS_ORIGINS = os.getenv(
        'CORS_ORIGIN',
        'http://localhost:5173,http://localhost:5174,http://localhost:19006'
    ).split(',')


# ── Logging ───────────────────────────────────────────────────────────────────

log_path = BASE_DIR / 'logs' / 'ndrf.log'
log_path.parent.mkdir(exist_ok=True)

logger = logging.getLogger('NDRF')
logger.setLevel(logging.INFO)
logger.propagate = False

fmt = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
fh = logging.FileHandler(log_path, encoding='utf-8')
fh.setFormatter(fmt)
ch = logging.StreamHandler(sys.stdout)
ch.setFormatter(fmt)
logger.addHandler(fh)
logger.addHandler(ch)

# ── Flask & Socket.IO ─────────────────────────────────────────────────────────

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.JWT_SECRET

CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

socketio = SocketIO(
    app,
    cors_allowed_origins=Config.CORS_ORIGINS,
    ping_timeout=60,
    ping_interval=25,
    async_mode='threading',
    logger=False,
    engineio_logger=False,
)

# ── Database ──────────────────────────────────────────────────────────────────

_pool = None


def _ensure_db():
    """Create the database if it doesn't exist yet."""
    conn = mysql.connector.connect(
        host=Config.DB_HOST, port=Config.DB_PORT,
        user=Config.DB_USER, password=Config.DB_PASSWORD,
        autocommit=True,
    )
    cur = conn.cursor()
    cur.execute(
        f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )
    cur.close()
    conn.close()


def init_pool():
    global _pool
    if _pool:
        return
    print()
    print('  ┌─────────────────────────────────────────┐')
    print('  │         NDRF Backend — MySQL Status      │')
    print('  └─────────────────────────────────────────┘')
    try:
        _pool = pooling.MySQLConnectionPool(
            pool_name='ndrf', pool_size=5,
            host=Config.DB_HOST, port=Config.DB_PORT,
            user=Config.DB_USER, password=Config.DB_PASSWORD,
            database=Config.DB_NAME, autocommit=True,
        )
        print(f'  ✅  Database connected   : {Config.DB_NAME}')
        print(f'  🌐  Host                 : {Config.DB_HOST}:{Config.DB_PORT}')
        print(f'  👤  User                 : {Config.DB_USER}')
        logger.info('MySQL pool ready — %s@%s:%s', Config.DB_NAME, Config.DB_HOST, Config.DB_PORT)
    except mysql.connector.Error as e:
        if e.errno == errorcode.ER_BAD_DB_ERROR:
            print(f'  ⚠️   Database "{Config.DB_NAME}" not found — creating it...')
            logger.warning("DB '%s' missing — creating it.", Config.DB_NAME)
            _ensure_db()
            _pool = pooling.MySQLConnectionPool(
                pool_name='ndrf', pool_size=5,
                host=Config.DB_HOST, port=Config.DB_PORT,
                user=Config.DB_USER, password=Config.DB_PASSWORD,
                database=Config.DB_NAME, autocommit=True,
            )
            print(f'  ✅  Database created & connected : {Config.DB_NAME}')
            logger.info('MySQL pool ready after DB creation.')
        else:
            print(f'  ❌  Database connection FAILED')
            print(f'  ⚠️   Error : {e}')
            print(f'  💡  Make sure XAMPP MySQL is running on {Config.DB_HOST}:{Config.DB_PORT}')
            print()
            logger.error('MySQL connection failed: %s', e)
            raise SystemExit(1) from e


def get_db():
    init_pool()
    return _pool.get_connection()


def auto_migrate():
    """Create all tables automatically if they don't exist."""
    conn = get_db()
    cur  = conn.cursor()
    try:
        cur.execute('SHOW TABLES')
        existing = {row[0].lower() for row in cur.fetchall()}

        statements = [
            ("users", '''
                CREATE TABLE IF NOT EXISTS users (
                  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
                  username      VARCHAR(50)   NOT NULL UNIQUE,
                  email         VARCHAR(120)  NOT NULL UNIQUE,
                  password_hash VARCHAR(255)  NOT NULL,
                  role          VARCHAR(32)   NOT NULL DEFAULT \'responder\',
                  name          VARCHAR(100),
                  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
                  last_login    DATETIME,
                  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_username (username),
                  KEY idx_email    (email)
                ) ENGINE=InnoDB
            '''),
            ("drones", '''
                CREATE TABLE IF NOT EXISTS drones (
                  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
                  drone_id    VARCHAR(50)   NOT NULL UNIQUE,
                  name        VARCHAR(100)  NOT NULL,
                  model       VARCHAR(100),
                  status      VARCHAR(32)   NOT NULL DEFAULT \'Idle\',
                  battery     TINYINT UNSIGNED DEFAULT 100,
                  lat         DOUBLE        DEFAULT 0,
                  lon         DOUBLE        DEFAULT 0,
                  altitude    FLOAT         DEFAULT 0,
                  speed       FLOAT         DEFAULT 0,
                  heading     FLOAT         DEFAULT 0,
                  `signal`    TINYINT UNSIGNED DEFAULT 0,
                  last_seen   DATETIME,
                  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_drone_id (drone_id),
                  KEY idx_status   (status)
                ) ENGINE=InnoDB
            '''),
            ("requests", '''
                CREATE TABLE IF NOT EXISTS requests (
                  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
                  ref_id            VARCHAR(50)   UNIQUE,
                  resource          VARCHAR(64)   NOT NULL,
                  note              TEXT,
                  lat               DOUBLE        NOT NULL,
                  lon               DOUBLE        NOT NULL,
                  urgency           VARCHAR(32)   NOT NULL DEFAULT \'Urgent\',
                  status            VARCHAR(32)   NOT NULL DEFAULT \'Pending\',
                  disaster_type     VARCHAR(128),
                  people_affected   INT UNSIGNED  DEFAULT 1,
                  state             VARCHAR(64),
                  cart              JSON,
                  assigned_drone_id INT UNSIGNED,
                  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_status   (status),
                  KEY idx_urgency  (urgency),
                  KEY idx_created  (created_at),
                  KEY idx_location (lat, lon),
                  FOREIGN KEY (assigned_drone_id) REFERENCES drones(id) ON DELETE SET NULL
                ) ENGINE=InnoDB
            '''),
            ("telemetry", '''
                CREATE TABLE IF NOT EXISTS telemetry (
                  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
                  drone_id    INT UNSIGNED  NOT NULL,
                  battery     TINYINT UNSIGNED DEFAULT 100,
                  lat         DOUBLE        DEFAULT 0,
                  lon         DOUBLE        DEFAULT 0,
                  altitude    FLOAT         DEFAULT 0,
                  speed       FLOAT         DEFAULT 0,
                  heading     FLOAT         DEFAULT 0,
                  `signal`    TINYINT UNSIGNED DEFAULT 0,
                  recorded_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_drone_time (drone_id, recorded_at),
                  FOREIGN KEY (drone_id) REFERENCES drones(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            '''),
            ("drone_commands", '''
                CREATE TABLE IF NOT EXISTS drone_commands (
                  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
                  drone_id    INT UNSIGNED  NOT NULL,
                  command     VARCHAR(100)  NOT NULL,
                  parameters  JSON,
                  status      VARCHAR(32)   NOT NULL DEFAULT \'Pending\',
                  issued_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  executed_at DATETIME,
                  PRIMARY KEY (id),
                  KEY idx_drone_status (drone_id, status),
                  FOREIGN KEY (drone_id) REFERENCES drones(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            '''),
        ]

        print()
        print('  ┌─────────────────────────────────────────┐')
        print('  │              Database Tables             │')
        print('  └─────────────────────────────────────────┘')

        for table, ddl in statements:
            if table not in existing:
                cur.execute(ddl)
                print(f'  ✅  {table}  ← created')
                logger.info("Table '%s' created.", table)
            else:
                print(f'  ✅  {table}')

        # Seed drones if empty
        cur.execute('SELECT COUNT(*) FROM drones')
        if cur.fetchone()[0] == 0:
            cur.execute('''
                INSERT INTO drones (drone_id, name, model, status, battery, lat, lon) VALUES
                (\'DRONE-001\', \'Alpha\',   \'DJI Matrice 300\', \'Idle\', 95,  28.6139, 77.2090),
                (\'DRONE-002\', \'Bravo\',   \'DJI Matrice 300\', \'Idle\', 88,  28.6140, 77.2091),
                (\'DRONE-003\', \'Charlie\', \'DJI Phantom 4\',   \'Idle\', 100, 28.6141, 77.2092)
            ''')
            print('  ✅  drones seeded (3 drones added)')

        # Seed admin user if empty
        cur.execute('SELECT COUNT(*) FROM users')
        if cur.fetchone()[0] == 0:
            pw_hash = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()
            cur.execute(
                'INSERT INTO users (username, email, password_hash, role, name) VALUES (%s,%s,%s,%s,%s)',
                ('admin', 'admin@ndrf.gov', pw_hash, 'admin', 'Admin User'),
            )
            print('  ✅  admin user seeded  (password: admin123)')

        print()
    finally:
        cur.close()
        conn.close()


# ── Auth helpers ──────────────────────────────────────────────────────────────

def make_token(user_id, username, role):
    return jwt.encode(
        {
            'user_id': user_id,
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXP_H),
        },
        Config.JWT_SECRET,
        algorithm=Config.JWT_ALG,
    )


def decode_token(token):
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALG])
    except jwt.PyJWTError:
        return None


def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = req.headers.get('Authorization', '')
        token = auth.split(' ')[1] if auth.startswith('Bearer ') else None
        if not token:
            return jsonify({'message': 'Token missing'}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({'message': 'Invalid or expired token'}), 401
        req.user = payload
        return f(*args, **kwargs)
    return wrapper


# ── Helpers ───────────────────────────────────────────────────────────────────

def row_to_dict(cursor, row):
    """Convert a DB row to a dict using cursor description."""
    return {cursor.description[i][0]: v for i, v in enumerate(row)}


def serialize(obj):
    """Make datetime / bytes JSON-safe."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, bytes):
        return obj.decode()
    return obj


def clean_row(row: dict) -> dict:
    return {k: serialize(v) for k, v in row.items()}


# ── REST: Health ──────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()}), 200


# ── REST: Auth ────────────────────────────────────────────────────────────────

@app.route('/auth/register', methods=['POST'])
def auth_register():
    data = req.get_json() or {}
    username = data.get('username') or data.get('email', '').split('@')[0]
    email    = data.get('email', '')
    password = data.get('password', '')
    name     = data.get('full_name') or data.get('name', '')

    if not email or not password:
        return jsonify({'message': 'email and password required'}), 400

    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute('SELECT id FROM users WHERE email = %s OR username = %s', (email, username))
        if cur.fetchone():
            return jsonify({'message': 'User already exists'}), 409

        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            'INSERT INTO users (username, email, password_hash, name, role) VALUES (%s,%s,%s,%s,%s)',
            (username, email, pw_hash, name, 'responder'),
        )
        uid = cur.lastrowid
        token = make_token(uid, username, 'responder')
        return jsonify({'token': token, 'user_id': uid}), 201
    except Exception as e:
        logger.error('register error: %s', e)
        return jsonify({'message': 'Registration failed'}), 500
    finally:
        cur.close(); conn.close()


@app.route('/auth/login', methods=['POST'])
def auth_login():
    data     = req.get_json() or {}
    email    = data.get('email') or data.get('username', '')
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'message': 'email and password required'}), 400

    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute('SELECT * FROM users WHERE email = %s OR username = %s', (email, email))
        user = cur.fetchone()
        if not user or not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
            return jsonify({'message': 'Invalid credentials'}), 401
        if not user.get('is_active', True):
            return jsonify({'message': 'Account inactive'}), 401

        cur.execute('UPDATE users SET last_login = NOW() WHERE id = %s', (user['id'],))
        token = make_token(user['id'], user['username'], user['role'])
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'name': user.get('name', ''),
            },
        }), 200
    except Exception as e:
        logger.error('login error: %s', e)
        return jsonify({'message': 'Login failed'}), 500
    finally:
        cur.close(); conn.close()


@app.route('/auth/logout', methods=['POST'])
def auth_logout():
    # JWT is stateless; client drops the token
    return jsonify({'message': 'Logged out'}), 200


@app.route('/auth/me', methods=['GET'])
@token_required
def auth_me():
    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute(
            'SELECT id, username, email, role, name FROM users WHERE id = %s',
            (req.user['user_id'],),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        return jsonify({'user': user}), 200
    finally:
        cur.close(); conn.close()


# ── REST: Requests ────────────────────────────────────────────────────────────

@app.route('/request', methods=['POST'])
def submit_request():
    """Mobile user submits a relief request — no auth required."""
    data = req.get_json() or {}

    resource = data.get('resource')
    lat      = data.get('lat')
    lon      = data.get('lon')

    if not resource or lat is None or lon is None:
        return jsonify({'message': 'resource, lat, lon required'}), 400

    ref_id = 'REQ-' + uuid4().hex[:8].upper()
    note   = data.get('note') or data.get('description', '')
    cart   = data.get('cart') or data.get('items', {})
    urgency = data.get('urgency', 'Urgent')
    status  = 'Pending'

    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        # Backward-compatible insert: older DBs may not include newer columns.
        cur.execute('SHOW COLUMNS FROM requests')
        request_columns = {row['Field'] for row in cur.fetchall()}

        required = {'resource', 'lat', 'lon'}
        missing_required = required - request_columns
        if missing_required:
            logger.error('requests table missing required columns: %s', sorted(missing_required))
            return jsonify({'message': 'Invalid requests table schema'}), 500

        now_utc = datetime.utcnow()
        payload_by_column = {
            'ref_id': ref_id,
            'resource': resource,
            'note': note,
            'lat': lat,
            'lon': lon,
            'urgency': urgency,
            'status': status,
            'disaster_type': data.get('disaster') or data.get('disaster_type', ''),
            'people_affected': data.get('people') or data.get('people_affected', 1),
            'state': data.get('state', ''),
            'cart': json.dumps(cart),
            'created_at': now_utc,
            'updated_at': now_utc,
        }

        # Support legacy column names when present.
        if 'disaster_type' not in request_columns and 'disaster' in request_columns:
            payload_by_column['disaster'] = payload_by_column['disaster_type']
        if 'people_affected' not in request_columns and 'people' in request_columns:
            payload_by_column['people'] = payload_by_column['people_affected']

        insert_payload = {
            col: val
            for col, val in payload_by_column.items()
            if col in request_columns
        }

        columns_sql = ', '.join(f'`{col}`' for col in insert_payload.keys())
        placeholders_sql = ', '.join(['%s'] * len(insert_payload))
        cur.execute(
            f'INSERT INTO requests ({columns_sql}) VALUES ({placeholders_sql})',
            tuple(insert_payload.values()),
        )
        request_id = cur.lastrowid

        new_req = {
            'id': request_id,
            'ref_id': ref_id,
            'resource': resource,
            'note': note,
            'lat': lat,
            'lon': lon,
            'urgency': urgency,
            'status': status,
            'cart': cart,
            'state': data.get('state', ''),
            'people_affected': data.get('people') or data.get('people_affected', 1),
            'disaster_type': data.get('disaster') or data.get('disaster_type', ''),
            'created_at': datetime.utcnow().isoformat(),
            'timestamp': datetime.utcnow().isoformat(),
        }

        # Broadcast to ground station
        socketio.emit('new_request', new_req)
        logger.info('New request %s (%s)', ref_id, resource)

        return jsonify({'message': 'Request submitted', 'id': request_id, 'request_id': request_id, 'ref_id': ref_id}), 201
    except Exception as e:
        logger.error('submit_request error: %s', e)
        return jsonify({'message': 'Failed to submit request'}), 500
    finally:
        cur.close(); conn.close()


@app.route('/requests', methods=['GET'])
def get_requests():
    """Return all requests as a plain array (ground station expects this)."""
    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute('SELECT * FROM requests ORDER BY created_at DESC')
        rows = cur.fetchall()
        result = []
        for r in rows:
            r = clean_row(r)
            if r.get('cart') and isinstance(r['cart'], str):
                try:
                    r['cart'] = json.loads(r['cart'])
                except Exception:
                    pass
            result.append(r)
        return jsonify(result), 200
    except Exception as e:
        logger.error('get_requests error: %s', e)
        return jsonify([]), 200
    finally:
        cur.close(); conn.close()


@app.route('/requests/search', methods=['GET'])
def search_requests():
    status   = req.args.get('status')
    resource = req.args.get('resource')
    urgency  = req.args.get('urgency')
    limit    = int(req.args.get('limit', 100))

    query  = 'SELECT * FROM requests WHERE 1=1'
    params = []
    if status:
        query += ' AND status = %s'; params.append(status)
    if resource:
        query += ' AND resource = %s'; params.append(resource)
    if urgency:
        query += ' AND urgency = %s'; params.append(urgency)
    query += ' ORDER BY created_at DESC LIMIT %s'
    params.append(limit)

    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute(query, params)
        rows = [clean_row(r) for r in cur.fetchall()]
        return jsonify(rows), 200
    except Exception as e:
        logger.error('search_requests error: %s', e)
        return jsonify([]), 200
    finally:
        cur.close(); conn.close()


def _update_request_status(request_id, new_status, drone_id=None):
    """Update status in DB and broadcast request_update socket event."""
    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute('SHOW COLUMNS FROM requests')
        request_columns = {row['Field'] for row in cur.fetchall()}

        update_clauses = ['status=%s']
        params = [new_status]

        if drone_id is not None:
            if 'assigned_drone_id' in request_columns:
                update_clauses.append('assigned_drone_id=%s')
                params.append(drone_id)
            elif 'drone_id' in request_columns:
                # Legacy schema compatibility.
                update_clauses.append('drone_id=%s')
                params.append(drone_id)

        if 'updated_at' in request_columns:
            update_clauses.append('updated_at=NOW()')

        params.append(request_id)
        cur.execute(
            f"UPDATE requests SET {', '.join(update_clauses)} WHERE id=%s",
            tuple(params),
        )

        cur.execute('SELECT * FROM requests WHERE id = %s', (request_id,))
        row = cur.fetchone()
        if not row:
            return None

        row = clean_row(row)
        if row.get('cart') and isinstance(row['cart'], str):
            try:
                row['cart'] = json.loads(row['cart'])
            except Exception:
                pass

        # Broadcast to all clients (ground station + mobile)
        socketio.emit('request_update', row)
        socketio.emit('status_update', {'id': request_id, 'status': new_status})
        logger.info('Request %s → %s', request_id, new_status)
        return row
    finally:
        cur.close(); conn.close()


@app.route('/assign/<int:request_id>', methods=['POST'])
def assign_request(request_id):
    data     = req.get_json() or {}
    drone_input = data.get('drone_id')

    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
      if drone_input is None or drone_input == '':
          # Fallback to first idle drone when explicit drone_id is not provided.
          cur.execute("SELECT id FROM drones WHERE status = 'Idle' LIMIT 1")
          drone = cur.fetchone()
          drone_id = drone['id'] if drone else 1
      elif isinstance(drone_input, str) and not drone_input.isdigit():
          # Support human-readable IDs like DRONE-001 from older clients.
          cur.execute('SELECT id FROM drones WHERE drone_id = %s LIMIT 1', (drone_input,))
          drone = cur.fetchone()
          if not drone:
              return jsonify({'message': f'Unknown drone_id: {drone_input}'}), 400
          drone_id = drone['id']
      else:
          drone_id = int(drone_input)
    finally:
      cur.close(); conn.close()

    row = _update_request_status(request_id, 'Assigned', drone_id)
    if not row:
        return jsonify({'message': 'Request not found'}), 404
    return jsonify({'message': 'Assigned', 'request': row}), 200


@app.route('/assign/<int:request_id>/auto', methods=['POST'])
def auto_assign_request(request_id):
    """Auto-assign the first idle drone."""
    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT id FROM drones WHERE status = 'Idle' LIMIT 1")
        drone = cur.fetchone()
        drone_id = drone['id'] if drone else 'DRONE-001'
    finally:
        cur.close(); conn.close()

    row = _update_request_status(request_id, 'Assigned', drone_id)
    if not row:
        return jsonify({'message': 'Request not found'}), 404
    return jsonify({'message': 'Auto-assigned', 'request': row}), 200


@app.route('/in-transit/<int:request_id>', methods=['POST'])
def set_in_transit(request_id):
    row = _update_request_status(request_id, 'In Transit')
    if not row:
        return jsonify({'message': 'Request not found'}), 404
    return jsonify({'message': 'In Transit', 'request': row}), 200


@app.route('/deliver/<int:request_id>', methods=['POST'])
def deliver_request(request_id):
    row = _update_request_status(request_id, 'Delivered')
    if not row:
        return jsonify({'message': 'Request not found'}), 404
    return jsonify({'message': 'Delivered', 'request': row}), 200


@app.route('/user-confirm/<int:request_id>', methods=['POST'])
def user_confirm(request_id):
    """Mobile user confirms they received the aid."""
    row = _update_request_status(request_id, 'UserConfirmed')
    if not row:
        return jsonify({'message': 'Request not found'}), 404
    return jsonify({'message': 'UserConfirmed', 'request': row}), 200


# ── REST: Telemetry & Drones ──────────────────────────────────────────────────

@app.route('/telemetry', methods=['GET'])
def get_telemetry():
    """Return the latest telemetry row per drone."""
    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute(
            '''SELECT t.* FROM telemetry t
               INNER JOIN (
                 SELECT drone_id, MAX(recorded_at) AS latest
                 FROM telemetry GROUP BY drone_id
               ) m ON t.drone_id = m.drone_id AND t.recorded_at = m.latest
               ORDER BY t.drone_id'''
        )
        rows = [clean_row(r) for r in cur.fetchall()]
        return jsonify(rows), 200
    except Exception as e:
        logger.error('get_telemetry error: %s', e)
        return jsonify([]), 200
    finally:
        cur.close(); conn.close()


@app.route('/drones', methods=['GET'])
def get_drones():
    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute('SELECT * FROM drones ORDER BY drone_id')
        rows = [clean_row(r) for r in cur.fetchall()]
        return jsonify(rows), 200
    except Exception as e:
        logger.error('get_drones error: %s', e)
        return jsonify([]), 200
    finally:
        cur.close(); conn.close()


@app.route('/drones/<drone_id>/telemetry', methods=['GET'])
def get_drone_telemetry(drone_id):
    limit = int(req.args.get('limit', 50))
    conn  = get_db()
    cur   = conn.cursor(dictionary=True)
    try:
        # drone_id can be the string id (e.g. "DRONE-001") or numeric FK
        cur.execute(
            '''SELECT t.* FROM telemetry t
               JOIN drones d ON t.drone_id = d.id
               WHERE d.drone_id = %s OR d.id = %s
               ORDER BY t.recorded_at DESC LIMIT %s''',
            (drone_id, drone_id, limit),
        )
        rows = [clean_row(r) for r in cur.fetchall()]
        return jsonify(rows), 200
    except Exception as e:
        logger.error('get_drone_telemetry error: %s', e)
        return jsonify([]), 200
    finally:
        cur.close(); conn.close()


# ── Socket.IO events ──────────────────────────────────────────────────────────

@socketio.on('connect')
def on_connect():
    logger.info('Client connected: %s', req.sid)
    emit('connection_response', {'status': 'connected'})


@socketio.on('disconnect')
def on_disconnect():
    logger.info('Client disconnected: %s', req.sid)


@socketio.on('drone_telemetry')
def on_drone_telemetry(data):
    """Drone hardware pushes telemetry here."""
    drone_str_id = data.get('drone_id', 'DRONE-001')
    conn = get_db()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute('SELECT id FROM drones WHERE drone_id = %s', (drone_str_id,))
        drone = cur.fetchone()
        if not drone:
            return

        drone_pk = drone['id']

        # Update live position on drones table
        cur.execute(
            '''UPDATE drones SET lat=%s, lon=%s, altitude=%s, speed=%s,
               heading=%s, battery=%s, `signal`=%s, status=%s, last_seen=NOW()
               WHERE id=%s''',
            (
                data.get('lat'), data.get('lon'), data.get('altitude', 0),
                data.get('speed', 0), data.get('heading', 0),
                data.get('battery', 0), data.get('signal', 0),
                data.get('status', 'Flying'), drone_pk,
            ),
        )

        # Insert telemetry record
        cur.execute(
            '''INSERT INTO telemetry
               (drone_id, lat, lon, altitude, speed, heading, battery, `signal`, recorded_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())''',
            (
                drone_pk, data.get('lat'), data.get('lon'),
                data.get('altitude', 0), data.get('speed', 0),
                data.get('heading', 0), data.get('battery', 0),
                data.get('signal', 0),
            ),
        )

        # Broadcast to ground station
        emit('telemetry:update', {**data, 'drone_pk': drone_pk}, broadcast=True, include_self=False)
    except Exception as e:
        logger.error('drone_telemetry socket error: %s', e)
    finally:
        cur.close(); conn.close()


@socketio.on('status_update')
def on_status_update(data):
    """
    Relay from any client (mobile user or ground station) to all others.
    Also persists the status change to DB.
    """
    request_id = data.get('id')
    new_status  = data.get('status')
    if request_id and new_status:
        _update_request_status(request_id, new_status)
    else:
        # Just relay without DB write
        emit('status_update', data, broadcast=True, include_self=False)


# ── Error handlers ────────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(_):
    return jsonify({'message': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(e):
    logger.error('500: %s', e)
    return jsonify({'message': 'Internal server error'}), 500


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_pool()
    auto_migrate()
    print('  ┌─────────────────────────────────────────┐')
    print('  │            Server Starting               │')
    print('  └─────────────────────────────────────────┘')
    print(f'  🚀  Backend  : http://localhost:{Config.FLASK_PORT}')
    print(f'  🖥️   Ground   : http://localhost:5174')
    print(f'  📱  User App : http://localhost:5173')
    print(f'  🗄️   phpMyAdmin: http://localhost/phpmyadmin')
    print()
    logger.info('Starting NDRF backend on port %s', Config.FLASK_PORT)
    socketio.run(app, host='0.0.0.0', port=Config.FLASK_PORT, debug=Config.DEBUG)

"""
NDRF Ground Control Station - Backend Server (MongoDB Atlas Edition)
Flask + Socket.IO + MongoDB Atlas

Migrated from MySQL to MongoDB Atlas with:
  - MongoDB connection pooling
  - Collections instead of tables
  - Pymongo for database operations
  - Full compatibility with frontend API
"""

import os
import json
import logging
import sys
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
from typing import Optional, Any
from uuid import uuid4

import jwt
import bcrypt
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import PyMongoError, DuplicateKeyError
from pymongo.database import Database
from flask import Flask, request as req, jsonify
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

URGENCY_ORDER = {'Critical': 0, 'High': 1, 'Urgent': 2, 'Normal': 3}
URGENCY_ALIASES = {
    'critical': 'Critical',
    'high': 'High',
    'urgent': 'Urgent',
    'normal': 'Normal',
}


class Config:
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/drone')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'drone')

    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

    JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'ndrf_secret_change_me')
    JWT_ALG = 'HS256'
    JWT_EXP_H = int(os.getenv('JWT_EXPIRATION_HOURS', 24))

    # Support comma-separated origins in .env
    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv(
            'CORS_ORIGIN',
            'http://localhost:5173,http://localhost:5174,http://localhost:19006'
        ).split(',')
        if o.strip()
    ]


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

# ── MongoDB Client ────────────────────────────────────────────────────────────

_client: Optional[MongoClient] = None
_db: Optional[Database[Any]] = None


def get_db() -> Database[Any]:
    """Get MongoDB database connection."""
    global _client, _db
    if _client is None:
        try:
            _client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
            # Test connection
            _client.admin.command('ping')
            _db = _client[Config.MONGODB_DB_NAME]
            logger.info('MongoDB connected successfully')
        except PyMongoError as e:
            logger.error('MongoDB connection failed: %s', e)
            raise SystemExit(1) from e
    return _db  # type: ignore[return-value]


def init_indexes():
    """Create indexes for MongoDB collections."""
    db = get_db()

    # Users indexes
    db.users.create_index([('email', ASCENDING)], unique=True)
    db.users.create_index([('username', ASCENDING)], unique=True)

    # Drones indexes
    db.drones.create_index([('drone_id', ASCENDING)], unique=True)
    db.drones.create_index([('status', ASCENDING)])

    # Requests indexes
    db.requests.create_index([('ref_id', ASCENDING)], unique=True)
    db.requests.create_index([('status', ASCENDING)])
    db.requests.create_index([('urgency', ASCENDING)])
    db.requests.create_index([('created_at', DESCENDING)])

    # Telemetry indexes
    db.telemetry.create_index([('drone_id', ASCENDING), ('recorded_at', DESCENDING)])

    # Drone commands indexes
    db.drone_commands.create_index([('drone_id', ASCENDING), ('status', ASCENDING)])

    logger.info('MongoDB indexes created')


def seed_data():
    """Seed initial data if collections are empty."""
    db = get_db()

    # Seed drones
    if db.drones.count_documents({}) == 0:
        drones = [
            {
                'drone_id': 'DRONE-001',
                'name': 'Alpha',
                'model': 'DJI Matrice 300',
                'status': 'Idle',
                'battery': 95,
                'lat': 28.6139,
                'lon': 77.2090,
                'altitude': 0,
                'speed': 0,
                'heading': 0,
                'signal': 0,
                'last_seen': datetime.now(timezone.utc),
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
            },
            {
                'drone_id': 'DRONE-002',
                'name': 'Bravo',
                'model': 'DJI Matrice 300',
                'status': 'Idle',
                'battery': 88,
                'lat': 28.6140,
                'lon': 77.2091,
                'altitude': 0,
                'speed': 0,
                'heading': 0,
                'signal': 0,
                'last_seen': datetime.now(timezone.utc),
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
            },
            {
                'drone_id': 'DRONE-003',
                'name': 'Charlie',
                'model': 'DJI Phantom 4',
                'status': 'Idle',
                'battery': 100,
                'lat': 28.6141,
                'lon': 77.2092,
                'altitude': 0,
                'speed': 0,
                'heading': 0,
                'signal': 0,
                'last_seen': datetime.now(timezone.utc),
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
            },
        ]
        db.drones.insert_many(drones)
        logger.info('Drones seeded (3 drones added)')

    # Seed admin user
    if db.users.count_documents({}) == 0:
        pw_hash = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()
        admin_user = {
            'username': 'admin',
            'email': 'admin@ndrf.gov',
            'password_hash': pw_hash,
            'role': 'admin',
            'name': 'Admin User',
            'is_active': True,
            'last_login': None,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        }
        db.users.insert_one(admin_user)
        logger.info('Admin user seeded (password: admin123)')


def init_mongodb():
    """Initialize MongoDB connection and create indexes."""
    get_db()

    print()
    print('  ┌─────────────────────────────────────────┐')
    print('  │      NDRF Backend — MongoDB Status       │')
    print('  └─────────────────────────────────────────┘')

    db = get_db()
    print(f'  ✅  Database          : {Config.MONGODB_DB_NAME}')
    print(f'  🌐  Connection        : MongoDB Atlas')

    # Create indexes
    init_indexes()
    print(f'  ✅  Indexes created')

    # Seed data
    seed_data()


# ── Auth helpers ──────────────────────────────────────────────────────────────

def make_token(user_id, username, role):
    return jwt.encode(
        {
            'user_id': str(user_id),
            'username': username,
            'role': role,
            'exp': datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXP_H),
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
        req.user = payload  # type: ignore[attr-defined]
        return f(*args, **kwargs)
    return wrapper


# ── Helpers ───────────────────────────────────────────────────────────────────

def serialize_doc(doc) -> dict:
    """Convert a single MongoDB document to a JSON-serializable dict."""
    if doc is None:
        return {}
    if isinstance(doc, list):
        return {}  # use serialize_docs for lists

    doc_copy = dict(doc)
    if '_id' in doc_copy:
        doc_copy['_id'] = str(doc_copy['_id'])

    for key, value in doc_copy.items():
        if isinstance(value, datetime):
            doc_copy[key] = value.isoformat()
        elif isinstance(value, bytes):
            doc_copy[key] = value.decode()

    return doc_copy


def serialize_docs(docs) -> list:
    """Convert a list of MongoDB documents to JSON-serializable dicts."""
    return [serialize_doc(d) for d in docs]


def triage_sort_key(r):
    """Sort by urgency priority first, then by age (oldest first = highest priority)."""
    urgency_rank = URGENCY_ORDER.get(r.get('urgency') or r.get('priority') or 'Urgent', 99)
    created = r.get('created_at') or ''
    return (urgency_rank, created)


def normalize_urgency(value):
    urgency = str(value or '').strip()
    return URGENCY_ALIASES.get(urgency.lower(), 'Urgent')


# ── REST: Health ──────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now(timezone.utc).isoformat()}), 200


# ── REST: Stats ────────────────────────────────────────────────────────────────

@app.route('/stats', methods=['GET'])
def get_stats():
    """Return request counts by status for the dashboard."""
    try:
        db = get_db()
        requests_col = db.requests

        total = requests_col.count_documents({})
        pending = requests_col.count_documents({'status': 'Pending'})
        assigned = requests_col.count_documents({'status': 'Assigned'})
        in_transit = requests_col.count_documents({'status': 'In Transit'})
        delivered = requests_col.count_documents({'status': 'Delivered'})
        confirmed = requests_col.count_documents({'status': 'UserConfirmed'})
        critical = requests_col.count_documents({'urgency': 'Critical'})
        high = requests_col.count_documents({'urgency': 'High'})

        return jsonify({
            'total': total,
            'pending': pending,
            'assigned': assigned,
            'in_transit': in_transit,
            'delivered': delivered,
            'confirmed': confirmed,
            'critical': critical,
            'high': high,
        }), 200
    except Exception as e:
        logger.error('get_stats error: %s', e)
        return jsonify({}), 200


# ── REST: Auth ────────────────────────────────────────────────────────────────

@app.route('/auth/register', methods=['POST'])
def auth_register():
    data = req.get_json() or {}
    username = data.get('username') or data.get('email', '').split('@')[0]
    email = data.get('email', '').strip()
    password = data.get('password', '')
    name = data.get('full_name') or data.get('name', '')

    if not email or not password:
        return jsonify({'message': 'email and password required'}), 400

    try:
        db = get_db()
        users_col = db.users

        if users_col.find_one({'$or': [{'email': email}, {'username': username}]}):
            return jsonify({'message': 'User already exists'}), 409

        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        now_utc = datetime.now(timezone.utc)

        user_doc = {
            'username': username,
            'email': email,
            'password_hash': pw_hash,
            'name': name,
            'role': 'responder',
            'is_active': True,
            'last_login': None,
            'created_at': now_utc,
            'updated_at': now_utc,
        }

        result = users_col.insert_one(user_doc)
        uid = str(result.inserted_id)
        token = make_token(uid, username, 'responder')

        return jsonify({'token': token, 'user_id': uid}), 201
    except Exception as e:
        logger.error('register error: %s', e)
        return jsonify({'message': 'Registration failed'}), 500


@app.route('/auth/login', methods=['POST'])
def auth_login():
    data = req.get_json() or {}
    email = data.get('email') or data.get('username', '')
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'message': 'email and password required'}), 400

    try:
        db = get_db()
        users_col = db.users

        user = users_col.find_one({'$or': [{'email': email}, {'username': email}]})

        if not user or not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
            return jsonify({'message': 'Invalid credentials'}), 401

        if not user.get('is_active', True):
            return jsonify({'message': 'Account inactive'}), 401

        uid = str(user['_id'])
        users_col.update_one({'_id': user['_id']}, {'$set': {'last_login': datetime.now(timezone.utc)}})

        token = make_token(uid, user['username'], user['role'])

        return jsonify({
            'token': token,
            'user': {
                'id': uid,
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'name': user.get('name', ''),
            },
        }), 200
    except Exception as e:
        logger.error('login error: %s', e)
        return jsonify({'message': 'Login failed'}), 500


@app.route('/auth/logout', methods=['POST'])
def auth_logout():
    return jsonify({'message': 'Logged out'}), 200


@app.route('/auth/me', methods=['GET'])
@token_required
def auth_me():
    try:
        db = get_db()
        users_col = db.users
        from bson import ObjectId

        user_id = req.user['user_id']  # type: ignore[index]
        user = users_col.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({'user': serialize_doc(user)}), 200
    except Exception as e:
        logger.error('auth_me error: %s', e)
        return jsonify({'message': 'Error'}), 500


# ── REST: Requests ────────────────────────────────────────────────────────────

@app.route('/request', methods=['POST'])
def submit_request():
    """Mobile user submits a relief request — no auth required."""
    data = req.get_json() or {}

    resource = str(data.get('resource') or '').strip()
    lat = data.get('lat')
    lon = data.get('lon')

    if not resource or lat is None or lon is None:
        return jsonify({'message': 'resource, lat, lon required'}), 400

    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return jsonify({'message': 'lat and lon must be numbers'}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return jsonify({'message': 'Invalid coordinates'}), 400

    urgency = normalize_urgency(data.get('urgency') or data.get('priority') or 'Urgent')
    status = 'Pending'

    ref_id = 'REQ-' + uuid4().hex[:8].upper()
    note = str(data.get('note') or data.get('description') or '').strip()[:1000]
    cart = data.get('cart') or data.get('items') or {}

    try:
        db = get_db()
        requests_col = db.requests
        now_utc = datetime.now(timezone.utc)

        request_doc = {
            'ref_id': ref_id,
            'resource': resource,
            'note': note,
            'lat': lat,
            'lon': lon,
            'urgency': urgency,
            'priority': urgency,
            'status': status,
            'disaster_type': str(data.get('disaster') or data.get('disaster_type') or '').strip(),
            'people_affected': int(data.get('people') or data.get('people_affected') or 1),
            'state': str(data.get('state') or '').strip(),
            'cart': cart,
            'assigned_drone_id': None,
            'created_at': now_utc,
            'updated_at': now_utc,
        }

        result = requests_col.insert_one(request_doc)
        request_id = str(result.inserted_id)

        new_req = {
            'id': request_id,
            'ref_id': ref_id,
            'resource': resource,
            'note': note,
            'lat': lat,
            'lon': lon,
            'urgency': urgency,
            'priority': urgency,
            'status': status,
            'cart': cart,
            'state': str(data.get('state') or ''),
            'people_affected': int(data.get('people') or data.get('people_affected') or 1),
            'disaster_type': str(data.get('disaster') or data.get('disaster_type') or ''),
            'created_at': now_utc.isoformat(),
            'timestamp': now_utc.isoformat(),
        }

        socketio.emit('new_request', new_req, to='gcs')  # type: ignore[call-arg]
        logger.info('New request %s (%s) urgency=%s', ref_id, resource, urgency)

        return jsonify({'message': 'Request submitted', 'id': request_id, 'request_id': request_id, 'ref_id': ref_id}), 201
    except Exception as e:
        logger.error('submit_request error: %s', e)
        return jsonify({'message': 'Failed to submit request'}), 500


@app.route('/requests', methods=['GET'])
def get_requests():
    """Return all requests sorted by triage priority."""
    try:
        db = get_db()
        requests_col = db.requests

        requests = list(requests_col.find().sort('created_at', DESCENDING))
        result = serialize_docs(requests)

        active = [r for r in result if r.get('status') not in ('Delivered', 'UserConfirmed')]
        inactive = [r for r in result if r.get('status') in ('Delivered', 'UserConfirmed')]
        active.sort(key=triage_sort_key)

        return jsonify(active + inactive), 200
    except Exception as e:
        logger.error('get_requests error: %s', e)
        return jsonify([]), 200


@app.route('/requests/<request_id>', methods=['GET'])
def get_request(request_id):
    """Get a single request by ID."""
    try:
        from bson import ObjectId
        db = get_db()
        requests_col = db.requests

        request_doc = requests_col.find_one({'_id': ObjectId(request_id)})

        if not request_doc:
            return jsonify({'message': 'Not found'}), 404

        return jsonify(serialize_doc(request_doc)), 200
    except Exception as e:
        logger.error('get_request error: %s', e)
        return jsonify({'message': 'Error'}), 500


@app.route('/requests/search', methods=['GET'])
def search_requests():
    status = req.args.get('status')
    resource = req.args.get('resource')
    urgency = req.args.get('urgency') or req.args.get('priority')
    limit = min(int(req.args.get('limit', 100)), 500)

    try:
        db = get_db()
        requests_col = db.requests

        query = {}
        if status:
            query['status'] = status
        if resource:
            query['resource'] = resource
        if urgency:
            query['urgency'] = normalize_urgency(urgency)

        requests = list(requests_col.find(query).sort('created_at', DESCENDING).limit(limit))
        result = serialize_docs(requests)

        return jsonify(result), 200
    except Exception as e:
        logger.error('search_requests error: %s', e)
        return jsonify([]), 200


def _update_request_status(request_id, new_status, drone_id=None):
    """Update status in DB and broadcast request_update socket event."""
    try:
        from bson import ObjectId
        db = get_db()
        requests_col = db.requests

        update_data = {
            'status': new_status,
            'updated_at': datetime.now(timezone.utc),
        }

        if drone_id is not None:
            update_data['assigned_drone_id'] = drone_id

        requests_col.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': update_data}
        )

        request_doc = requests_col.find_one({'_id': ObjectId(request_id)})
        if not request_doc:
            return None

        row = serialize_doc(request_doc)

        socketio.emit('request_update', row)
        socketio.emit('status_update', {'id': request_id, 'status': new_status})
        logger.info('Request %s → %s', request_id, new_status)

        return row
    except Exception as e:
        logger.error('_update_request_status error: %s', e)
        return None


@app.route('/assign/<request_id>', methods=['POST'])
def assign_request(request_id):
    data = req.get_json() or {}
    drone_input = data.get('drone_id')

    try:
        from bson import ObjectId
        db = get_db()
        drones_col = db.drones

        if drone_input is None or drone_input == '':
            drone = drones_col.find_one({'status': 'Idle'}, sort=[('battery', DESCENDING)])
            drone_id = str(drone['_id']) if drone else None
        elif isinstance(drone_input, str) and not drone_input.isdigit():
            drone = drones_col.find_one({'drone_id': drone_input})
            if not drone:
                return jsonify({'message': f'Unknown drone_id: {drone_input}'}), 400
            drone_id = str(drone['_id'])
        else:
            drone_id = drone_input

        drones_col.update_one(
            {'_id': ObjectId(drone_id)},
            {'$set': {'status': 'Flying', 'updated_at': datetime.now(timezone.utc)}}
        )
    except Exception as e:
        logger.error('assign_request error: %s', e)
        return jsonify({'message': 'Failed to assign drone'}), 500

    row = _update_request_status(request_id, 'Assigned', drone_id)
    if not row:
        return jsonify({'message': 'Request not found'}), 404

    return jsonify({'message': 'Assigned', 'request': row}), 200


@app.route('/assign/<request_id>/auto', methods=['POST'])
def auto_assign_request(request_id):
    try:
        from bson import ObjectId
        db = get_db()
        drones_col = db.drones

        drone = drones_col.find_one({'status': 'Idle'}, sort=[('battery', DESCENDING)])
        drone_id = str(drone['_id']) if drone else None

        if not drone_id:
            return jsonify({'message': 'No available drones'}), 400
    except Exception as e:
        logger.error('auto_assign_request error: %s', e)
        return jsonify({'message': 'Failed to auto-assign'}), 500

    row = _update_request_status(request_id, 'Assigned', drone_id)
    if not row:
        return jsonify({'message': 'Request not found'}), 404

    return jsonify({'message': 'Auto-assigned', 'request': row}), 200


@app.route('/in-transit/<request_id>', methods=['POST'])
def set_in_transit(request_id):
    row = _update_request_status(request_id, 'In Transit')
    if not row:
        return jsonify({'message': 'Request not found'}), 404
    return jsonify({'message': 'In Transit', 'request': row}), 200


@app.route('/deliver/<request_id>', methods=['POST'])
def deliver_request(request_id):
    row = _update_request_status(request_id, 'Delivered')
    if not row:
        return jsonify({'message': 'Request not found'}), 404

    if row.get('assigned_drone_id'):
        try:
            from bson import ObjectId
            db = get_db()
            drones_col = db.drones

            drones_col.update_one(
                {'_id': ObjectId(row['assigned_drone_id'])},
                {'$set': {'status': 'Idle', 'updated_at': datetime.now(timezone.utc)}}
            )
        except Exception as e:
            logger.error('deliver_request error: %s', e)

    return jsonify({'message': 'Delivered', 'request': row}), 200


@app.route('/user-confirm/<request_id>', methods=['POST'])
def user_confirm(request_id):
    row = _update_request_status(request_id, 'UserConfirmed')
    if not row:
        return jsonify({'message': 'Request not found'}), 404
    return jsonify({'message': 'UserConfirmed', 'request': row}), 200


# ── REST: Drone Commands ──────────────────────────────────────────────────────

@app.route('/drones/<drone_pk>/command', methods=['POST'])
def send_drone_command(drone_pk):
    """Ground station sends a command to a specific drone."""
    data = req.get_json() or {}
    command = str(data.get('command') or '').strip().upper()
    if not command:
        return jsonify({'message': 'command required'}), 400

    params = data.get('parameters') or {}

    try:
        from bson import ObjectId
        db = get_db()
        drones_col = db.drones
        commands_col = db.drone_commands

        drone = drones_col.find_one({'_id': ObjectId(drone_pk)})
        if not drone:
            return jsonify({'message': 'Drone not found'}), 404

        command_doc = {
            'drone_id': ObjectId(drone_pk),
            'command': command,
            'parameters': params,
            'status': 'Pending',
            'issued_at': datetime.now(timezone.utc),
            'executed_at': None,
        }

        result = commands_col.insert_one(command_doc)
        cmd_id = str(result.inserted_id)

        socketio.emit('drone_command', {
            'cmd_id': cmd_id,
            'drone_id': drone['drone_id'],
            'command': command,
            'parameters': params,
        })

        logger.info('Command %s → drone %s', command, drone['drone_id'])
        return jsonify({'message': 'Command sent', 'cmd_id': cmd_id}), 200
    except Exception as e:
        logger.error('send_drone_command error: %s', e)
        return jsonify({'message': 'Failed to send command'}), 500


# ── REST: Telemetry & Drones ──────────────────────────────────────────────────

@app.route('/telemetry', methods=['GET'])
def get_telemetry():
    try:
        db = get_db()
        telemetry_col = db.telemetry

        telemetry = list(telemetry_col.find().sort('recorded_at', DESCENDING).limit(100))
        result = serialize_docs(telemetry)

        return jsonify(result), 200
    except Exception as e:
        logger.error('get_telemetry error: %s', e)
        return jsonify([]), 200


@app.route('/drones', methods=['GET'])
def get_drones():
    try:
        db = get_db()
        drones_col = db.drones

        drones = list(drones_col.find().sort('drone_id', ASCENDING))
        result = serialize_docs(drones)

        return jsonify(result), 200
    except Exception as e:
        logger.error('get_drones error: %s', e)
        return jsonify([]), 200


@app.route('/drones/<drone_id>/telemetry', methods=['GET'])
def get_drone_telemetry(drone_id):
    limit = min(int(req.args.get('limit', 50)), 200)

    try:
        from bson import ObjectId
        db = get_db()
        drones_col = db.drones
        telemetry_col = db.telemetry

        drone = drones_col.find_one({'$or': [{'drone_id': drone_id}, {'_id': ObjectId(drone_id) if ObjectId.is_valid(drone_id) else None}]})

        if not drone:
            return jsonify([]), 404

        telemetry = list(telemetry_col.find({'drone_id': drone['_id']}).sort('recorded_at', DESCENDING).limit(limit))
        result = serialize_docs(telemetry)

        return jsonify(result), 200
    except Exception as e:
        logger.error('get_drone_telemetry error: %s', e)
        return jsonify([]), 200


# ── Socket.IO events ──────────────────────────────────────────────────────────

@socketio.on('connect')
def on_connect():
    logger.info('Client connected: %s', req.sid)  # type: ignore[attr-defined]
    emit('connection_response', {'status': 'connected'})


@socketio.on('disconnect')
def on_disconnect():
    logger.info('Client disconnected: %s', req.sid)  # type: ignore[attr-defined]


@socketio.on('join')
def on_join(data):
    """Clients declare their role: 'gcs' or 'mobile'."""
    room = data.get('room', 'gcs')
    if room in ('gcs', 'mobile'):
        join_room(room)
        logger.info('Client %s joined room: %s', req.sid, room)  # type: ignore[attr-defined]
        emit('joined', {'room': room})


@socketio.on('drone_telemetry')
def on_drone_telemetry(data):
    """Drone hardware pushes telemetry here."""
    drone_str_id = data.get('drone_id', 'DRONE-001')

    try:
        db = get_db()
        drones_col = db.drones
        telemetry_col = db.telemetry

        drone = drones_col.find_one({'drone_id': drone_str_id})
        if not drone:
            return

        drone_pk = drone['_id']
        now_utc = datetime.now(timezone.utc)

        drones_col.update_one(
            {'_id': drone_pk},
            {'$set': {
                'lat': data.get('lat'),
                'lon': data.get('lon'),
                'altitude': data.get('altitude', 0),
                'speed': data.get('speed', 0),
                'heading': data.get('heading', 0),
                'battery': data.get('battery', 0),
                'signal': data.get('signal', 0),
                'status': data.get('status', 'Flying'),
                'last_seen': now_utc,
                'updated_at': now_utc,
            }}
        )

        telemetry_doc = {
            'drone_id': drone_pk,
            'lat': data.get('lat'),
            'lon': data.get('lon'),
            'altitude': data.get('altitude', 0),
            'speed': data.get('speed', 0),
            'heading': data.get('heading', 0),
            'battery': data.get('battery', 0),
            'signal': data.get('signal', 0),
            'recorded_at': now_utc,
        }

        telemetry_col.insert_one(telemetry_doc)

        emit('telemetry:update', {**data, 'drone_pk': str(drone_pk)}, broadcast=True, include_self=False)
    except Exception as e:
        logger.error('drone_telemetry socket error: %s', e)


@socketio.on('status_update')
def on_status_update(data):
    """Relay status changes from mobile to GCS and persist to DB."""
    request_id = data.get('id')
    new_status = data.get('status')
    if request_id and new_status:
        _update_request_status(request_id, new_status)
    else:
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
    init_mongodb()

    print('  ┌─────────────────────────────────────────┐')
    print('  │            Server Starting               │')
    print('  └─────────────────────────────────────────┘')
    print(f'  🚀  Backend  : http://localhost:{Config.FLASK_PORT}')
    print(f'  🖥️   Ground   : http://localhost:5174')
    print(f'  📱  User App : http://localhost:5173')
    print(f'  🗄️   MongoDB  : Atlas')
    print()

    logger.info('Starting NDRF backend on port %s', Config.FLASK_PORT)
    # Werkzeug's reloader can close sockets during reload on Windows, causing WinError 10038.
    use_reloader = Config.DEBUG and os.name != 'nt'
    if Config.DEBUG and not use_reloader:
        logger.info('Debug reloader disabled on Windows to avoid socket WinError 10038')

    socketio.run(
        app,
        host='0.0.0.0',
        port=Config.FLASK_PORT,
        debug=Config.DEBUG,
        use_reloader=use_reloader,
    )

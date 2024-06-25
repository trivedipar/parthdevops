from flask import Flask, request, jsonify, g, session
from flask_cors import CORS
from rejson import Client, Path
from datetime import datetime, timedelta
import pytz
import os
import random
import http
import hashlib
import jwt
from flask_socketio import SocketIO, emit
from flask_bcrypt import Bcrypt
from flask_api import status

# Redis connection using rejson Client

usr=""
try:
    rj = Client(
        host='redis-19369.c11.us-east-1-3.ec2.redns.redis-cloud.com',
        port=19369,
        password='iwIGMW4rywGlc4sNNA95UQcUBuC6auwW',
        decode_responses=True
    )
except Exception as e:
    print(f"Error connecting to Redis: {e}")
    rj = None

push_to_redis = True
rj_host = 'localhost'


# Hard-coded time zone. Required for correct ObjectId comparisons!
local_zone = pytz.timezone('US/Eastern')

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'my_precious_1869')
CORS(app)
bcrypt = Bcrypt(app)

def tryexcept(requesto, key, default):
    """Helper function to handle missing keys in request JSON."""
    try:
        return requesto.json[key]
    except KeyError:
        return default

@app.route('/health', methods=['GET'])
def health_check():
    return "Hello from backend", 200

@app.before_request
def set_env_var():
    if 'secret_key' not in g:
        g.secret_key = os.environ.get("SECRET_KEY", "my_precious_1869")
    if 'bcrypt_log_rounds' not in g:
        g.bcrypt_log_rounds = int(os.environ.get("BCRYPT_LOG_ROUNDS", 13))
    if 'access_token_expiration' not in g:
        g.access_token_expiration = int(os.environ.get("ACCESS_TOKEN_EXPIRATION", 900))
    if 'refresh_token_expiration' not in g:
        g.refresh_token_expiration = int(os.environ.get("REFRESH_TOKEN_EXPIRATION", 2592000))
    if 'users' not in g:
        users = os.environ.get("USERS", 'user1,user2,user3')
        g.users = users.split(',')
    if 'passwords' not in g:
        passwords = os.environ.get("PASSWORDS", 'Tesla,Clippy,Blue')
        g.passwords = passwords.split(',')
        g.password_hashes = [bcrypt.generate_password_hash(p).decode('utf-8') for p in g.passwords]
        g.userids = list(range(len(g.users)))

@app.route("/")
def home():
    """Documentation endpoint."""
    if rj_host == 'localhost':
        return """twtr backend endpoints:<br />
            <br />
            From collections:<br/>
            /enqueue-get<br />
            /collections-from-redis-cache<br />
            /purge-redis-cache<br />
            /set-location<br />
            /get-user1-data<br />
            /get-location/<user_id>"""
    else:
        return """Remote mock:<br />
            <br />
            From collections:<br/>
            /users<br />
            /collections-from-redis-cache<br />
            /purge-redis-cache<br />
            /set-location<br />
            /get-location/<user_id>"""

@app.route('/collections-from-redis-cache')
def collections_from_redis_cache():
    """Returns all items from Redis."""
    if not rj:
        return jsonify({"error": "Redis connection failed."}), http.HTTPStatus.INTERNAL_SERVER_ERROR
    
    data = dict()
    try:
        for key in rj.keys('*'):
            data[key] = rj.jsonget(key, Path.rootPath())
    except Exception as e:
        print(f"Error retrieving collections from Redis: {e}")
        return jsonify({"error": "Queue inaccessible."}), http.HTTPStatus.INTERNAL_SERVER_ERROR
    return jsonify(data)

@app.route('/purge-redis-cache')
def purge_redis_cache():
    """Purges all items from Redis."""
    if not rj:
        return jsonify({"error": "Redis connection failed."}), http.HTTPStatus.INTERNAL_SERVER_ERROR

    data = dict()
    try:
        for key in rj.keys('*'):
            data[key] = rj.jsonget(key, Path.rootPath())
            rj.delete(key)
    except Exception as e:
        print(f"Error purging Redis cache: {e}")
        return jsonify({"error": "Queue inaccessible."}), http.HTTPStatus.INTERNAL_SERVER_ERROR
    return jsonify(data)

@app.route("/enqueue", methods=["POST"])
def enqueue():
    """Enqueues data into Redis."""
    key = tryexcept(request, 'key', None)
    path = tryexcept(request, 'path', None)
    record = tryexcept(request, 'record', None)

    if push_to_redis:
        if rjjsonsetwrapper(key, path, record):
            print("Enqueued.")
            return jsonify("Enqueued."), http.HTTPStatus.OK
        else:
            print("Not enqueued!")
            return jsonify("Not enqueued!"), http.HTTPStatus.INTERNAL_SERVER_ERROR
    else:
        print("Dropped.")
        return jsonify("Dropped."), http.HTTPStatus.OK

@app.route("/enqueue-get", methods=["GET"])
def enqueue_get():
    """Enqueues a test record into Redis."""
    key = str(random.randint(1000000000, 2000000000))
    path = "."
    record = "no_mr_bond_I_want_you_to_die"

    if push_to_redis:
        rjjsonsetwrapper(key, path, record)
        print("Enqueued.")
        return jsonify("Enqueued."), http.HTTPStatus.OK
    else:
        print("Dropped.")
        return jsonify("Dropped."), http.HTTPStatus.OK

@app.route("/set-location", methods=["POST"])
def set_location():
    """Sets user location in Redis."""
    user_id = tryexcept(request, 'user_id', None)
    latitude = tryexcept(request, 'latitude', None)
    longitude = tryexcept(request, 'longitude', None)
    heading = tryexcept(request, 'heading', None)
    speed = tryexcept(request, 'speed', None)

    if user_id is None or latitude is None or longitude is None:
        return jsonify("Missing data."), http.HTTPStatus.BAD_REQUEST

    key = f"user:{user_id}:location"
    record = {
        "latitude": latitude,
        "longitude": longitude,
        "heading": heading,
        "speed": speed
    }

    if push_to_redis:
        if rjjsonsetwrapper(key, Path.rootPath(), record):
            print(f"Location for user {user_id} enqueued.")
            return jsonify(f"Location for user {user_id} enqueued."), http.HTTPStatus.OK
        else:
            print(f"Location for user {user_id} not enqueued!")
            return jsonify(f"Location for user {user_id} not enqueued."), http.HTTPStatus.INTERNAL_SERVER_ERROR
    else:
        print("Dropped.")
        return jsonify("Dropped."), http.HTTPStatus.OK

@app.route("/get-location/<user_id>", methods=["GET"])
def get_location(user_id):
    """Gets user location from Redis."""
    key = f"user:{user_id}:location"

    try:
        data = rj.jsonget(key, Path.rootPath())
        if data:
            return jsonify(data)
        else:
            return jsonify(f"No location data for user {user_id}."), http.HTTPStatus.NOT_FOUND
    except Exception as e:
        print(f"Error retrieving location data: {e}")
        return jsonify(f"Error retrieving data for user {user_id}."), http.HTTPStatus.INTERNAL_SERVER_ERROR

def rjjsonsetwrapper(key, path, record):
    """Wrapper to add data to Redis."""
    try:
        rj.jsonset(key, path, record)
        return True
    except Exception as e:
        print('rjjsonsetwrapper() error:', str(e))
        return False

################
# Security
################
def encode_token(user_id, token_type):
    if token_type == "access":
        seconds = g.access_token_expiration
    else:
        seconds = g.refresh_token_expiration

    payload = {
        "exp": datetime.utcnow() + timedelta(seconds=seconds),
        "iat": datetime.utcnow(),
        "sub": user_id,
    }
    return jwt.encode(
        payload, g.secret_key, algorithm="HS256"
    )

def decode_token(token):
    payload = jwt.decode(token, g.secret_key, algorithms=["HS256"])
    return payload["sub"]

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    hashed_password = hash_password(password)
    
    # Store username and hashed_password in Redis under a unique key
    user_data = {'username': username, 'hashed_password': hashed_password}
    key = f'user:{username}'
    
    if rjjsonsetwrapper(key, ".", user_data):
        return jsonify({'message': 'User registered successfully'}), 201
    else:
        return jsonify({'message': 'Internal server error'}), 500

def rjjsongetwrapper(key, path):
    """Wrapper to get JSON data from Redis."""
    try:
        return rj.jsonget(key, path)
    except Exception as e:
        print('rjjsongetwrapper() error:', str(e))
        return None

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    # Retrieve user data from Redis
    user_data = rjjsongetwrapper('user:' + username, Path.rootPath())
    
    if user_data:
        stored_password = user_data.get('hashed_password')
        if stored_password and hash_password(password) == stored_password:
            is_prime_user = username in ['user1', 'user2', 'user3']
            
            # Determine the behavior based on the username
            if is_prime_user:
                global usr 
                usr= username
                # Set both 'currentUser' and 'primeUser' JSON with the username
                if rjjsonsetwrapper('currentUser', Path.rootPath(), {'username': username}) and \
                   rjjsonsetwrapper('primeUser', Path.rootPath(), {'username': username}):
                    return jsonify({'userID': username, 'message': 'You are an Application user'}), 200
                else:
                    return jsonify({'message': 'Internal server error'}), 500
            else:
                # Set only 'currentUser' JSON with the username
                if rjjsonsetwrapper('currentUser', Path.rootPath(), {'username': username}):
                    return jsonify({'userID': username, 'message': 'You are a view-only user'}), 200
                else:
                    return jsonify({'message': 'Internal server error'}), 500
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    else:
        return jsonify({'message': 'User not found'}), 404

@app.route('/users', methods=['GET'])
def get_users():
    users = rj.hkeys('users')  # Get all usernames from the 'users' hash
    users_list = [user.decode('utf-8') for user in users]  # Decode usernames from bytes to strings
    return jsonify({'users': users_list}), 200

@app.route("/get-user1-data", methods=["GET"])
def get_user1_data():
    user_key = "primeUser"  # Updated to fetch user1's data
    try:
        data = rj.jsonget(user_key, Path.rootPath())
        if data:
            return jsonify(data)
        else:
            return jsonify("No data found for user1."), http.HTTPStatus.NOT_FOUND
    except Exception as e:
        print(f"Error retrieving data for user1: {e}")
        return jsonify("Error retrieving data for user1."), http.HTTPStatus.INTERNAL_SERVER_ERROR

@app.route("/fastlogin", methods=["POST"])
def fastlogin():
    try:
        access_token = request.json['access-token']
        refresh_token = request.json['refresh-token']

        if not access_token or not refresh_token:
            return jsonify(("Missing token(s)!", status.HTTP_401_UNAUTHORIZED))
        else:
            try:
                userid = decode_token(access_token)
                if userid not in g.userids:
                    raise Exception
            except Exception:
                try:
                    userid = decode_token(refresh_token)
                    if userid not in g.userids:
                        raise Exception
                except Exception:
                    return jsonify(("Invalid token(s)!", status.HTTP_401_UNAUTHORIZED))

            access_token = encode_token(userid, "access")
            refresh_token = encode_token(userid, "refresh")

            response_object = {
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
            return jsonify((response_object, status.HTTP_200_OK))
    except Exception as e:
        return jsonify(("Authentication is required and has failed!", status.HTTP_401_UNAUTHORIZED))
    
@app.route('/get_user_info')
def get_user_info():
    if  usr:
        return jsonify({
            'isLoggedIn': True,
            'username': usr,
            'prime_user': session.get('prime_user', False)
        }), 200
    else:
        return jsonify({'isLoggedIn': False}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)

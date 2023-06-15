from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import datetime
from flask_cors import CORS
#from flask_migrate import Migrate
from flask_marshmallow import Marshmallow #ModuleNotFoundError: No module named 'flask_marshmallow' = pip install flask-marshmallow https://pypi.org/project/flask-marshmallow/
### REDIS ###
from flask_redis import FlaskRedis
import uuid
import json 


app = Flask(__name__)
CORS(app)

# Redis configuration
app.config['REDIS_URL'] = 'redis://localhost:6379/0'
redis = FlaskRedis(app)

# Databse configuration                                  Username:password@hostname/databasename
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:123456@192.168.118.242/flaskreact'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db=SQLAlchemy(app)

#migrate = Migrate(app, db)

ma=Marshmallow(app)

class Users(db.Model):
    #__tablename__ = "users"
    id = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    date = db.Column(db.DateTime,default=datetime.datetime.now)
    
 
    def __init__(self,name,email):
        self.name=name
        self.email=email

class UserSchema(ma.Schema):
    class Meta:
        fields = ('id','name','email','date')

user_schema = UserSchema()
users_schema = UserSchema(many=True)

@app.route("/")
def hello_world():
    return "<p>Hello, World! debug mode</p>"


@app.route('/useradd', methods=['POST'])
def useradd():
    name = request.json['name']
    email = request.json['email']
    # Create a new User object
    user = Users(name, email)
    # Add the user to the MySQL session
    db.session.add(user)
    db.session.commit()
    # Store the user data in Redis using the user ID as the key
    user_data = {
        'name': name,
        'email': email,
        'date': datetime.datetime.now().isoformat()
    }
    redis.hmset('user:' + str(user.id), user_data)
    return user_schema.jsonify(user), 201


""" @app.route('/listusers', methods=['GET'])
def lisusers():
    all_users = Users.query.all()
    results = users_schema.dump(all_users)
    return jsonify(results) """

@app.route('/listusers', methods=['GET'])
def listusers():
    # Check if the data is already cached in Redis
    cached_data = redis.get('users')

    if cached_data:
        # Data found in cache, return the cached data
        return jsonify(cached_data.decode('utf-8'))

    # Data not found in cache, fetch data from the database
    all_users = Users.query.all()
    results = users_schema.dump(all_users)

    # Store the fetched data in Redis cache
    redis.set('users', jsonify(results))

    return jsonify(results)


@app.route('/userdetails/<id>',methods =['GET'])
def userdetails(id):
    user = Users.query.get(id)
    return user_schema.jsonify(user)

@app.route('/userupdate/<id>',methods = ['PUT'])
def userupdate(id):
    user = Users.query.get(id)
 
    name = request.json['name']
    email = request.json['email']
 
    user.name = name
    user.email = email
 
    db.session.commit()
    return user_schema.jsonify(user)

@app.route('/userdelete/<id>',methods=['DELETE'])
def userdelete(id):
    user = Users.query.get(id)
    db.session.delete(user)
    db.session.commit()
    return user_schema.jsonify(user)


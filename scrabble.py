from flask import Flask, render_template
#from mongokit import Connection, Document
import os, json

# configuration
from chars import alphabet

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017

BASE_DIR = os.path.split(os.path.abspath(__file__))[0]

app = Flask(__name__)
app.config.from_object(__name__)

app.debug = True

# connect to the database
#connection = Connection(app.config['MONGODB_HOST'], app.config['MONGODB_PORT'])
#
##model
#@connection.register
#class Game(Document):
#    __collection__ = 'games'
#    __database__ = 'scrabble'
#    structure = {
#        "players": [{
#            "name": str,
#            "words": [{
#                "word": str,
#                "points": int
#            }],
#            "total_points": int
#        }]
#    }

#controller
@app.route('/')
def index():
    return render_template("index.jinja2")

@app.route('/', methods=['POST'])
def players():
    return ''

@app.route('/chars')
def chars():
    return app.response_class(json.dumps(alphabet), mimetype='application/json')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
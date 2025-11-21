from flask import Flask
from flask_restx import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
import config
from flask_cors import CORS

bcrypt = Bcrypt()
jwt = JWTManager()
db = SQLAlchemy()


def create_app(config_class=config.DevelopmentConfig):
    app = Flask(__name__)
    
    
    app.url_map.strict_slashes = False  # Évite les redirections
    app.config.from_object(config_class)
    
    CORS(app)
    
    # Initialisation des extensions
    bcrypt.init_app(app)
    jwt.init_app(app)
    db.init_app(app)

    # Configuration de l'API
    authorizations = {
        'apikey': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': "Type in the *'Value'* input box below: **'Bearer &lt;JWT&gt;'**, where JWT is the token"
        }
    }

    api = Api(app, version='1.0', title='HBnB API',
              description='HBnB Application API', 
              authorizations=authorizations)

    from app.api.v1.protected import api as protected_ns
    from app.api.v1.auth import api as auth_ns
    from app.api.v1.reviews import api as reviews_ns
    from app.api.v1.places import api as places_ns
    from app.api.v1.amenities import api as amenities_ns
    from app.api.v1.users import api as users_ns

    api.add_namespace(users_ns, path='/api/v1/users')
    api.add_namespace(amenities_ns, path='/api/v1/amenities')
    api.add_namespace(places_ns, path='/api/v1/places')
    api.add_namespace(reviews_ns, path='/api/v1/reviews')
    api.add_namespace(auth_ns, path='/api/v1/auth')
    api.add_namespace(protected_ns, path='/api/v1/protected')

    with app.app_context():
        db.create_all()
    
    return app
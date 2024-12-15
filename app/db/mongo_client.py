import os
# from pfmongo import MongoClient

mongo_uri = os.getenv("MONGO_URI", "mongodb://admin:admin@localhost:27017")
# client = MongoClient(mongo_uri)
# db = client.get_database("$PROJECT_NAME")

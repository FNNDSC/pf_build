from fastapi import APIRouter

# from app.db.mongo_client import db

router = APIRouter()
router.tags = ["Users services"]


@router.get("/users/")
async def get_users():
    # users = db.users.find()
    users = {"name": "Some One", "email": "someone@somewhere.fun"}
    return [{"name": user["name"], "email": user["email"]} for user in users]

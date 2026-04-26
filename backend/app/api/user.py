from fastapi import APIRouter
from app.models.user import User

router = APIRouter()

@router.get("/user")
def get_user():
    return User(id="1", name="Shivam", xp=100, level=2, streak=3)
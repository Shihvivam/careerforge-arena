from pydantic import BaseModel

class User(BaseModel):
    id: str
    name: str
    xp: int = 0
    level: int = 1
    streak: int = 0
from fastapi import FastAPI
from app.api import user

app = FastAPI(title="CareerForge Arena API")

app.include_router(user.router)

@app.get("/")
def root():
    return {"message": "CareerForge Arena Backend Running 🚀"}
from fastapi import FastAPI, APIRouter, Depends
from datetime import datetime, timezone
from dotenv import load_dotenv
from app.logger import logger
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base, session_generator
from .routers import report, testing

# Load environment variables
load_dotenv()

# Dependency
# def get_db():
#     db = SessionLocal()
#     try : 
#         yield db
#     finally:
#         db.close()

# Create FastAPI application
app = FastAPI(
    title="H2Seq Demo Analytical Pipeline",
    description="Set of APIs to facilitate the functionality of the H2Seq demo analytical pipeline.",
    version="0.0.1",
)
logger.info("Starting API")


logger.info("Registering routers")
app.include_router(testing.router)
app.include_router(report.router)


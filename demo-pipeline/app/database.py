from sqlalchemy import create_engine, text
# from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from sqlalchemy import MetaData
from sqlalchemy.ext.automap import automap_base
from contextlib import contextmanager
from dotenv import load_dotenv
import os
from .logger import logger

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DB_HOST = os.getenv("DB_HOST")
# DB_PORT_INT = int(DB_PORT)

# Database connection string
DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create engine object - to manage database connections
engine = create_engine(DB_URL,echo=True)

SessionLocal = sessionmaker(autocommit=False,autoflush=False, bind=engine)

# Reflecting existing database schema
pipeline_tables = [
    'AnalysisData', 'AnalysisOutputs', 'AnalysisPathogens',
    'AnalysisRuns', 'AnalysisTemplates', 'Analysis', 'Pathogens',
    'RecordsLinked', 'MetadataLinked', 'Reports', 'Templates', 'SequenceFiles'
]

reflect_metadata = MetaData()
reflect_metadata.reflect(bind=engine, only=pipeline_tables)

class Base(DeclarativeBase):
    metadata = reflect_metadata

# Create a base class for automapping
# This will allow us to map existing tables to Python classes and manage them using SQLAlchemy ORM
Base = automap_base(Base)
Base.prepare()

# Create mapped classes for each table
# These classes will be used to interact with the database
# They will be automatically generated based on the existing tables
AnalysisData = Base.classes.AnalysisData
AnalysisOutputs = Base.classes.AnalysisOutputs
AnalysisPathogens = Base.classes.AnalysisPathogens
AnalysisRuns = Base.classes.AnalysisRuns
AnalysisTemplates = Base.classes.AnalysisTemplates
Analysis = Base.classes.Analysis
Pathogens = Base.classes.Pathogens
RecordsLinked = Base.classes.RecordsLinked
MetadataLinked = Base.classes.MetadataLinked
Reports = Base.classes.Reports
Templates = Base.classes.Templates
SequenceFiles = Base.classes.SequenceFiles

# Context manager for database session lifecycle management
@contextmanager
def session_generator():
    """Context manager to handle database sessions."""
    session = SessionLocal()
    try:
        yield session
    except Exception as e:
        logger.error(f"Database error: {e}")
        session.rollback()
        raise e
    finally:
        session.close()


# Test the database connection
# logger.info("Testing database connection...")
# with session_generator() as session:
#     try:
#         # Test the connection by executing a simple query
#         session.execute(text("SELECT 1")) 
#         logger.info("Database connection successful.")
#     except Exception as e:
#         logger.error(f"Database connection failed: {e}")
#         raise e

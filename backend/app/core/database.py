from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine with additional configurations for better performance
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Enables pessimistic disconnect handling
    pool_recycle=300,    # Recycle connections every 5 minutes
    echo=False           # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database initialization function
def create_tables():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all tables in the database."""
    Base.metadata.drop_all(bind=engine)

# Database utility functions
def init_database():
    """Initialize database with tables and any default data."""
    create_tables()
    print("Database tables created successfully!")

# Health check function
def check_database_connection():
    """Check if database connection is working."""
    try:
        db = SessionLocal()
        # Use text() to wrap raw SQL
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False
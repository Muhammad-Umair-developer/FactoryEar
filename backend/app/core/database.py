# backend/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create the SQLAlchemy engine which acts as the core interface to PostgreSQL.
# We pass the validated connection string securely loaded from our settings.
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

# Create a configured "SessionLocal" factory to spawn database transactions.
# autocommit=False ensures data is only saved when we explicitly call commit() (prevents partial saves).
# autoflush=False prevents SQLAlchemy from pushing pending changes before we are ready.
# bind=engine connects these sessions to our established PostgreSQL connection pool.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for all our database ORM models.
# Every database table we define later will inherit from this declarative base.
Base = declarative_base()

def get_db():
    """
    Dependency generator for FastAPI endpoints to securely access the database.
    Yields a database session and ensures it is safely closed after the HTTP request completes.
    """
    # Instantiate a new database session for the current request context.
    db = SessionLocal()
    try:
        # Yield the session to the FastAPI route handler for database queries.
        yield db
    finally:
        # Guarantee the connection is closed and returned to the pool, even if the route crashes.
        db.close()
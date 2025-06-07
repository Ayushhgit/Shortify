# init_db.py - Run this script to initialize your database
import sys
import os

# Add the parent directory to Python path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import init_database, check_database_connection

def main():
    print("Initializing Shortify Database...")
    
    # Check database connection first
    if not check_database_connection():
        print("❌ Database connection failed. Please check your DATABASE_URL.")
        return
    
    print("✅ Database connection successful.")
    
    # Initialize database
    try:
        init_database()
        print("✅ Database initialized successfully!")
        print("Tables created:")
        print("  - users")
        print("  - reviews")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

if __name__ == "__main__":
    main()
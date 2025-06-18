# debug_models.py - Run this to check if your models are being imported correctly
import sys
import os

# Add the project root to Python path (same as in env.py)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.core.database import Base
    print("✅ Successfully imported Base")
    
    # Check what tables Base knows about
    print(f"Tables found in Base.metadata: {list(Base.metadata.tables.keys())}")
    
    # Try to import models individually
    try:
        from app.models.user import User
        print("✅ Successfully imported User model")
    except ImportError as e:
        print(f"❌ Failed to import User model: {e}")
    
    try:
        from app.models.review import Review  # or whatever your review model is
        print("✅ Successfully imported Review model")
    except ImportError as e:
        print(f"❌ Failed to import Review model: {e}")
    
    # Try importing all models at once
    try:
        from app.models import *  # This should import all models
        print("✅ Successfully imported all models via app.models")
    except ImportError as e:
        print(f"❌ Failed to import via app.models: {e}")
    
    print(f"\nFinal tables in Base.metadata: {list(Base.metadata.tables.keys())}")
    
except ImportError as e:
    print(f"❌ Failed to import Base: {e}")
    print("Check your app/core/database.py file exists and is correct")
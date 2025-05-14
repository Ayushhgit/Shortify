import os
from app.core.celery_app import celery_app

# This ensures the celery app is imported when workers start
if __name__ == '__main__':
    celery_app.start()

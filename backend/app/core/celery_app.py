from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "shortify_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.shorts"]
)

celery_app.conf.task_routes = {
    "app.tasks.shorts.*": {"queue": "shorts"},
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
)

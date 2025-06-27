import time
import logging
import asyncio
from celery import Task
from typing import Dict, Any

from app.core.celery_app import celery_app
from app.services.shorts import ShortsService

logger = logging.getLogger(__name__)

class ShortsGeneratorTask(Task):
    _progress = {}

    def on_success(self, retval, task_id, args, kwargs):
        self._progress[task_id] = 100
        logger.info(f"Task {task_id} completed successfully.")
        return super().on_success(retval, task_id, args, kwargs)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        self._progress[task_id] = -1
        logger.error(f"Task {task_id} failed: {exc}")
        return super().on_failure(exc, task_id, args, kwargs, einfo)

    def update_progress(self, task_id: str, progress: float):
        self._progress[task_id] = progress

    def get_progress(self, task_id: str) -> float:
        return self._progress.get(task_id, 0)


@celery_app.task(bind=True, base=ShortsGeneratorTask, name="app.tasks.shorts.generate_shorts")
def generate_shorts(self, url: str, use_whisper: bool = False, use_gpt: bool = False) -> Dict[str, Any]:
    task_id = self.request.id
    logger.info(f"Started task {task_id} with URL: {url}")
    
    try:
        self.update_progress(task_id, 10)
        time.sleep(1)  # Simulate download or processing
        self.update_progress(task_id, 30)

        # Run the async ShortsService inside the event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            ShortsService.process_video(url, use_whisper, use_gpt, task_id)
        )
        loop.close()

        self.update_progress(task_id, 90)

        # ✅ Return model_dumpionary instead of Pydantic model
        if hasattr(result, "model_dump"):
            return result.model_dump()
        return result.__dict__ if hasattr(result, '__dict__') else result

    except Exception as e:
        logger.exception("Error in shorts generation task")
        return {
            "video_id": "error",
            "original_url": url,
            "clips": [],
            "status": "failed",
            "error": str(e)
        }


@celery_app.task(name="app.tasks.shorts.get_task_status")
def get_task_status(task_id: str) -> Dict[str, Any]:
    task = generate_shorts.AsyncResult(task_id)

    if task.state == 'PENDING':
        return {
            'task_id': task_id,
            'status': 'pending',
            'progress': 0
        }
    elif task.state == 'FAILURE':
        return {
            'task_id': task_id,
            'status': 'failed',
            'progress': -1,
            'error': str(task.info)
        }
    elif task.state == 'SUCCESS':
        return {
            'task_id': task_id,
            'status': 'completed',
            'progress': 100,
            'result': task.info  # This is the model_dump returned above
        }
    else:
        progress = generate_shorts.get_progress(task_id) if hasattr(generate_shorts, 'get_progress') else 0
        return {
            'task_id': task_id,
            'status': 'in_progress',
            'progress': progress
        }

import time
import logging
from celery import Task
from typing import Dict, Any, Optional

from app.core.celery_app import celery_app
from app.services.shorts import ShortsService
from app.models.schemas import VideoClipsResponse

logger = logging.getLogger(__name__)

class ShortsGeneratorTask(Task):
    """Shorts Generator Task Class with tracking capabilities"""
    _progress = {}
    
    def on_success(self, retval, task_id, args, kwargs):
        """Store result and set progress to 100%"""
        self._progress[task_id] = 100
        return super().on_success(retval, task_id, args, kwargs)
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        self._progress[task_id] = -1
        logger.error(f"Task {task_id} failed: {exc}")
        return super().on_failure(exc, task_id, args, kwargs, einfo)
    
    def update_progress(self, task_id: str, progress: float):
        """Update task progress"""
        self._progress[task_id] = progress
    
    def get_progress(self, task_id: str) -> float:
        """Get current progress for task"""
        return self._progress.get(task_id, 0)

@celery_app.task(bind=True, base=ShortsGeneratorTask, name="app.tasks.shorts.generate_shorts")
def generate_shorts(
    self,
    url: str,
    use_whisper: bool = False,
    use_gpt: bool = False
) -> Dict[str, Any]:
    """
    Celery task to generate short clips from YouTube video
    """
    task_id = self.request.id
    try:
        # Update progress as we go
        self.update_progress(task_id, 10)
        
        # Sleep to simulate download time
        time.sleep(1)
        self.update_progress(task_id, 30)
        
        # Process video asynchronously (in a synchronous context)
        import asyncio
        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(
            ShortsService.process_video(url, use_whisper, use_gpt)
        )
        loop.close()
        
        # Return result
        return result.dict()
    
    except Exception as e:
        logger.error(f"Error generating shorts: {e}")
        # Return error result
        return {
            "video_id": "error",
            "original_url": url,
            "clips": [],
            "status": "failed",
            "error": str(e)
        }

@celery_app.task(name="app.tasks.shorts.get_task_status")
def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    Get status of a task
    """
    task = generate_shorts.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {
            'task_id': task_id,
            'status': 'pending',
            'progress': 0
        }
    elif task.state == 'FAILURE':
        response = {
            'task_id': task_id,
            'status': 'failed',
            'progress': -1,
            'error': str(task.info)
        }
    else:
        # Progress tracking
        progress = generate_shorts.get_progress(task_id) if hasattr(generate_shorts, 'get_progress') else 0
        
        if task.state == 'SUCCESS':
            response = {
                'task_id': task_id,
                'status': 'completed',
                'progress': 100,
                'result': task.info
            }
        else:
            response = {
                'task_id': task_id,
                'status': 'in_progress',
                'progress': progress
            }
    
    return response

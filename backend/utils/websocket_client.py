"""
WebSocket client utility for workers to send real-time updates
"""
import json
import asyncio
import aiohttp
from typing import Dict, Any, Optional


class WebSocketNotifier:
    """Utility class to send WebSocket notifications from workers"""
    
    def __init__(self, redis_connection):
        self.redis = redis_connection
        
    def send_job_update(self, job_id: str, status: str, progress: int = 0, **kwargs):
        """
        Send job update via Redis pub/sub that will be picked up by WebSocket manager
        This allows workers (which don't have direct access to WebSocket manager) 
        to trigger WebSocket messages
        """
        message = {
            "job_id": job_id,
            "status": status,
            "progress": progress,
            **kwargs
        }
        
        # Publish to Redis channel that WebSocket manager listens to
        self.redis.publish(f"job_updates:{job_id}", json.dumps(message))
        
    def send_job_complete(self, job_id: str, result: Dict[str, Any]):
        """Send job completion notification"""
        message = {
            "job_id": job_id,
            "status": "done",
            "progress": 100,
            **result
        }
        self.redis.publish(f"job_updates:{job_id}", json.dumps(message))
        
    def send_job_error(self, job_id: str, error_message: str):
        """Send job error notification"""
        message = {
            "job_id": job_id,
            "status": "error", 
            "message": error_message
        }
        self.redis.publish(f"job_updates:{job_id}", json.dumps(message))
"""
WebSocket client utility for workers to send real-time updates
"""
import json
import asyncio
import traceback
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
        try:
            message = {
                "job_id": job_id,
                "status": status,
                "progress": progress,
                **kwargs
            }
            
            # Publish to Redis channel that WebSocket manager listens to
            result = self.redis.publish(f"job_updates:{job_id}", json.dumps(message))
            
            if result == 0:
                print(f"Warning: No WebSocket clients listening for job {job_id}")
            else:
                print(f"WebSocket update sent for job {job_id}: {status} ({progress}%)")
                
        except Exception as e:
            print(f"Error sending WebSocket update: {e}")
            # Don't fail the job if WebSocket notification fails
            traceback.print_exc()
        
    def send_job_complete(self, job_id: str, result: Dict[str, Any]):
        """Send job completion notification"""
        try:
            message = {
                "job_id": job_id,
                "status": "done",
                "progress": 100,
                **result
            }
            self.redis.publish(f"job_updates:{job_id}", json.dumps(message))
            print(f"WebSocket completion notification sent for job {job_id}")
        except Exception as e:
            print(f"Error sending WebSocket completion: {e}")
            
    def send_job_error(self, job_id: str, error_message: str):
        """Send job error notification"""
        try:
            message = {
                "job_id": job_id,
                "status": "error", 
                "message": error_message
            }
            self.redis.publish(f"job_updates:{job_id}", json.dumps(message))
            print(f"WebSocket error notification sent for job {job_id}")
        except Exception as e:
            print(f"Error sending WebSocket error notification: {e}")
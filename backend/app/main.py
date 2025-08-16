from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, Form, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from redis import Redis
from rq import Queue
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
import json
import asyncio
from typing import Dict, Set, Optional, Union
import os
import sys
sys.path.append("/app")
from worker import run_job
from video_worker import run_video_job

app = FastAPI(title="Meme AI API")

# CORS (ajusta origins en producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

redis = Redis(host="redis", port=6379)
q = Queue("meme", connection=redis, default_timeout=1000)
video_q = Queue("video", connection=redis, default_timeout=3000)  # Longer timeout for video processing


class WebSocketManager:
    """Manages WebSocket connections for real-time job updates"""
    
    def __init__(self):
        # Store connections by job_id -> set of websockets
        self.job_connections: Dict[str, Set[WebSocket]] = {}
        # Store all active connections for broadcasting
        self.active_connections: Set[WebSocket] = set()
        # Start Redis listener task
        self._redis_task = None
    
    async def start_redis_listener(self):
        """Start Redis pub/sub listener task"""
        if self._redis_task is None:
            self._redis_task = asyncio.create_task(self._redis_listener())
    
    async def _redis_listener(self):
        """Listen for Redis pub/sub messages in async loop"""
        try:
            # Enable Redis pub/sub for real-time WebSocket updates
            import aioredis
            redis_client = aioredis.from_url("redis://redis:6379")
            pubsub = redis_client.pubsub()
            await pubsub.psubscribe("job_updates:*")
            
            print("Redis pub/sub listener: Connected and listening for job updates")
            
            async for message in pubsub.listen():
                if message['type'] == 'pmessage':
                    job_id = message['channel'].decode().split(':', 1)[1]
                    data = json.loads(message['data'])
                    await self.send_job_update(job_id, data)
            
        except Exception as e:
            print(f"Redis listener error: {e}")
            print("WebSocket connections will still work for direct updates")
    
    async def connect(self, websocket: WebSocket, job_id: str = None):
        """Accept WebSocket connection and optionally subscribe to job updates"""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        # Ensure Redis listener is started
        await self.start_redis_listener()
        
        if job_id:
            if job_id not in self.job_connections:
                self.job_connections[job_id] = set()
            self.job_connections[job_id].add(websocket)
            
            # Send initial job status when connecting
            try:
                from rq.job import Job
                job = Job.fetch(job_id, connection=redis)
                if job:
                    if job.is_finished:
                        await websocket.send_text(json.dumps(job.result))
                    elif job.is_failed:
                        await websocket.send_text(json.dumps({
                            "status": "error", 
                            "message": str(job.exc_info)
                        }))
                    else:
                        meta = job.meta or {}
                        await websocket.send_text(json.dumps({
                            "status": meta.get("status", "queued"),
                            "progress": meta.get("progress", 0)
                        }))
            except Exception as e:
                print(f"Error sending initial job status: {e}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection from all subscriptions"""
        self.active_connections.discard(websocket)
        
        # Remove from job-specific connections
        for job_id in list(self.job_connections.keys()):
            self.job_connections[job_id].discard(websocket)
            if not self.job_connections[job_id]:  # Remove empty sets
                del self.job_connections[job_id]
    
    async def send_job_update(self, job_id: str, message: dict):
        """Send update to all connections subscribed to a specific job"""
        if job_id in self.job_connections:
            disconnected = set()
            for websocket in self.job_connections[job_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    disconnected.add(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected:
                self.disconnect(ws)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all active connections"""
        disconnected = set()
        for websocket in self.active_connections:
            try:
                await websocket.send_text(json.dumps(message))
            except:
                disconnected.add(websocket)
        
        # Clean up disconnected websockets
        for ws in disconnected:
            self.disconnect(ws)


# Global WebSocket manager instance
websocket_manager = WebSocketManager()

# Archivos estáticos de salida
app.mount("/outputs", StaticFiles(directory="/outputs"), name="outputs")

class CreateJob(BaseModel):
    prompt: str
    seed: int | None = None
    negative: str | None = None
    steps: int | None = 30
    guidance: float | None = 5.0
    model: str | None = "SSD-1B"
    aspect: str | None = "1:1"
    top_text: str | None = None
    bottom_text: str | None = None

class CreateVideoJob(BaseModel):
    imageUrl: str
    numFrames: int | None = 25

@app.post("/api/jobs")
async def create_job(request: Request):
    """
    Create a new image generation job.
    Supports both multipart/form-data (with image upload) and JSON payloads.
    """
    job_id = str(uuid4())
    
    # Check content type to determine how to parse the request
    content_type = request.headers.get("content-type", "")
    
    if content_type.startswith("multipart/form-data"):
        # Handle multipart form data
        form = await request.form()
        payload_dict = {
            "prompt": form.get("prompt"),
            "seed": int(form.get("seed")) if form.get("seed") else None,
            "negative": form.get("negative_prompt") or form.get("negative"),  # Support both field names
            "steps": int(form.get("steps")) if form.get("steps") else 30,
            "guidance": float(form.get("guidance")) if form.get("guidance") else 5.0,
            "model": form.get("model", "SSD-1B"),
            "aspect": form.get("aspect", "1:1"),
            "top_text": form.get("top_text"),
            "bottom_text": form.get("bottom_text"),
            "has_image_upload": False,
        }
        
        # Handle uploaded image
        if "image" in form:
            image_file = form["image"]
            if hasattr(image_file, 'size') and image_file.size > 0:
                # Save uploaded image temporarily
                upload_dir = "/tmp/uploads"
                os.makedirs(upload_dir, exist_ok=True)
                image_path = os.path.join(upload_dir, f"{job_id}_input.png")
                
                content = await image_file.read()
                with open(image_path, "wb") as f:
                    f.write(content)
                
                payload_dict["image_path"] = image_path
                payload_dict["has_image_upload"] = True
                
    elif content_type.startswith("application/json"):
        # Handle JSON payload (backward compatibility)
        try:
            body = await request.body()
            json_data = json.loads(body)
            payload_dict = {
                "prompt": json_data.get("prompt"),
                "seed": json_data.get("seed"),
                "negative": json_data.get("negative"),
                "steps": json_data.get("steps", 30),
                "guidance": json_data.get("guidance", 5.0),
                "model": json_data.get("model", "SSD-1B"),
                "aspect": json_data.get("aspect", "1:1"),
                "top_text": json_data.get("top_text"),
                "bottom_text": json_data.get("bottom_text"),
                "has_image_upload": False,
            }

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
    else:
        raise HTTPException(status_code=400, detail="Unsupported content type")
    
    print("payload_dict")
    print(payload_dict)
    
    # Validate required fields
    if not payload_dict.get("prompt"):
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    # Queue the job using direct function reference
    q.enqueue(run_job, job_id, payload_dict, job_id=job_id)
    return {"jobId": job_id}


# Keep old Pydantic endpoint for backward compatibility with existing clients
@app.post("/api/jobs/json")
def create_job_json(payload: CreateJob):
    """Legacy JSON-only endpoint for backward compatibility"""
    job_id = str(uuid4())
    payload_dict = payload.model_dump()
    payload_dict["has_image_upload"] = False
    q.enqueue(run_job, job_id, payload_dict, job_id=job_id)
    return {"jobId": job_id}

@app.post("/api/video-jobs")
def create_video_job(payload: CreateVideoJob):
    job_id = str(uuid4())
    video_q.enqueue(run_video_job, job_id, payload.model_dump(), job_id=job_id)
    return {"jobId": job_id}

@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    from rq.job import Job
    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        return {"status":"error","message":"not found"}
    if job.is_finished:
        return job.result
    if job.is_failed:
        return {"status":"error","message":str(job.exc_info)}
    meta = job.meta or {}
    return {"status": meta.get("status","queued"), "progress": meta.get("progress",0)}

@app.get("/api/video-jobs/{job_id}")
def get_video_job(job_id: str):
    from rq.job import Job
    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        return {"status":"error","message":"not found"}
    if job.is_finished:
        return job.result
    if job.is_failed:
        return {"status":"error","message":str(job.exc_info)}
    meta = job.meta or {}
    return {"status": meta.get("status","queued"), "progress": meta.get("progress",0)}

@app.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time job updates"""
    await websocket_manager.connect(websocket, job_id)
    
    try:
        # Keep connection alive and handle incoming messages
        while True:
            # We mainly use this for receiving job status updates
            # but we can also handle ping/pong for keepalive
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket)


@app.get("/api/health")
def health():
    return {"ok": True}

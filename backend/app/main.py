from fastapi import FastAPI
from pydantic import BaseModel
from redis import Redis
from rq import Queue
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

app = FastAPI(title="Meme AI API")

# CORS (ajusta origins en producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

redis = Redis(host="redis", port=6379)
q = Queue("meme", connection=redis, default_timeout=600)

# Archivos estáticos de salida
app.mount("/outputs", StaticFiles(directory="/outputs"), name="outputs")

class CreateJob(BaseModel):
    prompt: str
    seed: int | None = None
    negative: str | None = None
    steps: int | None = 30
    guidance: float | None = 5.0

@app.post("/api/jobs")
def create_job(payload: CreateJob):
    job_id = str(uuid4())
    q.enqueue("worker.run_job", job_id, payload.model_dump(), job_id=job_id)
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

@app.get("/api/health")
def health():
    return {"ok": True}

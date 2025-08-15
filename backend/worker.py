import os
import random
from rq import get_current_job

# Import from our new modules
from config.settings import OUT_DIR
from services.ollama_service import call_ollama
from services.image_service import generate_image
from utils.text_overlay import overlay_caption

# Set up WebSocket notifier (with error handling)
try:
    from utils.websocket_client import WebSocketNotifier
    from redis import Redis
    redis_client = Redis(host="redis", port=6379)
    websocket_notifier = WebSocketNotifier(redis_client)
    WEBSOCKET_ENABLED = True
except Exception as e:
    print(f"WebSocket notifications disabled: {e}")
    WEBSOCKET_ENABLED = False
    websocket_notifier = None

def run_job(job_id: str, payload: dict):
    job = get_current_job()
    job.meta.update({"status":"running","progress":5}); job.save_meta()
    
    # Send WebSocket update
    if WEBSOCKET_ENABLED and websocket_notifier:
        websocket_notifier.send_job_update(job_id, "running", 5)

    user_prompt = payload.get("prompt","")
    seed = int(payload.get("seed") or random.randint(1, 2**31-1))

    # 1) Ollama → prompt visual + captions
    try:
        image_prompt, top, bottom = call_ollama(user_prompt)
        print(f"Image prompt: {image_prompt}")
        print(f"Top: {top}")
        print(f"Bottom: {bottom}")
    except Exception:
        image_prompt, top, bottom = user_prompt, "", ""
    
    job.meta.update({"progress":20}); job.save_meta()
    if WEBSOCKET_ENABLED and websocket_notifier:
        websocket_notifier.send_job_update(job_id, "running", 20)
    
    neg_prompt = "ugly, blurry, poor quality" 

    # 2) Image generation
    image = generate_image(image_prompt, neg_prompt)
    
    image.save("/outputs/{}_source.png".format(job_id))
    job.meta.update({"progress":85}); job.save_meta()
    if WEBSOCKET_ENABLED and websocket_notifier:
        websocket_notifier.send_job_update(job_id, "running", 85)

    # 3) Caption estilo meme
    final_img = overlay_caption(image, top, bottom)

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, f"{job_id}.png")
    final_img.save(out_path, "PNG")

    result = {
        "status": "done",
        "imageUrl": f"/outputs/{job_id}.png",
        "meta": {
            "seed": seed,
            "steps": 1,
            "model": "SSD-1B",
            "prompt": image_prompt,
            "top": top, "bottom": bottom
        }
    }
    
    # Send WebSocket completion update
    if WEBSOCKET_ENABLED and websocket_notifier:
        websocket_notifier.send_job_complete(job_id, result)
    
    return result

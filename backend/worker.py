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
    steps = payload.get("steps", 30)  
    guidance = payload.get("guidance", 5.0)
    model = payload.get("model", "SSD-1B")
    aspect = payload.get("aspect", "1:1")
    has_image_upload = payload.get("has_image_upload", False)
    image_path = payload.get("image_path")
    
    # Get meme text - use provided text or generate via Ollama
    user_top_text = payload.get("top_text", "")
    user_bottom_text = payload.get("bottom_text", "")

    # Initialize variables
    image = None
    top = ""
    bottom = ""
    image_prompt = user_prompt

    # Try to load uploaded image first
    if has_image_upload and image_path and os.path.exists(image_path):
        print(f"Processing uploaded image: {image_path}")
        
        from PIL import Image
        try:
            image = Image.open(image_path)
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            job.meta.update({"progress":30}); job.save_meta()
            if WEBSOCKET_ENABLED and websocket_notifier:
                websocket_notifier.send_job_update(job_id, "running", 30)
            
            # Use provided meme text or generate via Ollama
            if user_top_text or user_bottom_text:
                top, bottom = user_top_text, user_bottom_text
                image_prompt = f"User uploaded image with custom meme text"
            else:
                # Generate meme text via Ollama for uploaded image
                try:
                    _, top, bottom = call_ollama(f"Create meme text for: {user_prompt}")
                    print(f"Generated meme text - Top: {top}, Bottom: {bottom}")
                except Exception as e:
                    print(f"Ollama error: {e}")
                    top, bottom = "", ""
            
            print(f"Using uploaded image with text - Top: '{top}', Bottom: '{bottom}'")
            
        except Exception as e:
            print(f"Error loading uploaded image: {e}")
            image = None  # Will trigger generation fallback

    # If no valid image from upload, generate one
    if image is None:
        print("Generating new image...")
        
        # Determine meme text strategy
        if user_top_text or user_bottom_text:
            # User provided meme text, use prompt for image generation
            top, bottom = user_top_text, user_bottom_text
            image_prompt = user_prompt
        else:
            # Generate both image prompt and meme text via Ollama
            try:
                image_prompt, top, bottom = call_ollama(user_prompt)
                print(f"Generated - Image prompt: {image_prompt}, Top: {top}, Bottom: {bottom}")
            except Exception as e:
                print(f"Ollama error: {e}")
                image_prompt, top, bottom = user_prompt, "", ""
        
        job.meta.update({"progress":25}); job.save_meta()
        if WEBSOCKET_ENABLED and websocket_notifier:
            websocket_notifier.send_job_update(job_id, "running", 25)
        
        # Prepare negative prompt
        neg_prompt = payload.get("negative", "ugly, blurry, poor quality")
        if not neg_prompt:
            neg_prompt = "ugly, blurry, poor quality"

        # Generate image with new parameters
        image = generate_image(image_prompt, neg_prompt, steps, guidance, model, aspect)
        
        job.meta.update({"progress":70}); job.save_meta()
        if WEBSOCKET_ENABLED and websocket_notifier:
            websocket_notifier.send_job_update(job_id, "running", 70)
    
    # Save source image for reference
    image.save(f"/outputs/{job_id}_source.png")
    
    job.meta.update({"progress":85}); job.save_meta()
    if WEBSOCKET_ENABLED and websocket_notifier:
        websocket_notifier.send_job_update(job_id, "running", 85)

    # Apply meme text overlay
    final_img = overlay_caption(image, top, bottom)

    # Save final result
    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, f"{job_id}.png")
    final_img.save(out_path, "PNG")

    # Clean up uploaded image if exists
    if has_image_upload and image_path and os.path.exists(image_path):
        try:
            os.remove(image_path)
        except:
            pass  # Ignore cleanup errors

    result = {
        "status": "done",
        "imageUrl": f"/outputs/{job_id}.png",
        "meta": {
            "seed": seed,
            "steps": steps,
            "guidance": guidance,
            "model": model,
            "aspect": aspect,
            "prompt": image_prompt,
            "top": top, 
            "bottom": bottom
        }
    }
    
    # Send WebSocket completion update
    if WEBSOCKET_ENABLED and websocket_notifier:
        websocket_notifier.send_job_complete(job_id, result)
    
    return result
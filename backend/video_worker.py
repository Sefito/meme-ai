import os
from rq import get_current_job

# Import video generation service
from config.settings import OUT_DIR
from services.video_service import generate_video_from_image
from utils.websocket_client import WebSocketNotifier
from redis import Redis

# Set up WebSocket notifier
redis_client = Redis(host="redis", port=6379)
websocket_notifier = WebSocketNotifier(redis_client)


def run_video_job(job_id: str, payload: dict):
    """
    Generate a video from a provided image.
    
    Args:
        job_id: Unique identifier for the job
        payload: Job parameters containing 'imageUrl' and optional 'numFrames'
        
    Returns:
        Job result with video information
    """
    job = get_current_job()
    job.meta.update({"status": "running", "progress": 5})
    job.save_meta()
    
    # Send WebSocket update
    websocket_notifier.send_job_update(job_id, "running", 5)

    # Get parameters from payload
    image_url = payload.get("imageUrl", "")
    num_frames = payload.get("numFrames", 25)
    
    if not image_url:
        error_msg = "No image URL provided"
        websocket_notifier.send_job_error(job_id, error_msg)
        return {
            "status": "error",
            "message": error_msg
        }
    
    # Convert image URL to file path
    # Assuming image_url is like "/outputs/job_id.png"
    if image_url.startswith("/outputs/"):
        image_path = image_url  # Keep the full path since it's already absolute
    else:
        error_msg = "Invalid image URL format"
        websocket_notifier.send_job_error(job_id, error_msg)
        return {
            "status": "error", 
            "message": error_msg
        }
    
    job.meta.update({"progress": 10})
    job.save_meta()
    websocket_notifier.send_job_update(job_id, "running", 10)
    
    # Check if source image exists
    if not os.path.exists(image_path):
        error_msg = f"Source image not found: {image_path}"
        websocket_notifier.send_job_error(job_id, error_msg)
        return {
            "status": "error",
            "message": error_msg
        }
    
    job.meta.update({"progress": 20})
    job.save_meta()
    websocket_notifier.send_job_update(job_id, "running", 20)
    
    try:
        # Generate video from image
        os.makedirs(OUT_DIR, exist_ok=True)
        video_output_path = os.path.join(OUT_DIR, f"{job_id}.mp4")
        
        job.meta.update({"progress": 30})
        job.save_meta()
        websocket_notifier.send_job_update(job_id, "running", 30)
        
        # Generate the video (this will take the most time)
        generate_video_from_image(
            image_path=image_path,
            output_path=video_output_path,
            num_frames=num_frames
        )
        
        job.meta.update({"progress": 95})
        job.save_meta()
        websocket_notifier.send_job_update(job_id, "running", 95)
        
        result = {
            "status": "done",
            "videoUrl": f"/outputs/{job_id}.mp4",
            "meta": {
                "numFrames": num_frames,
                "model": "Stable Video Diffusion",
                "sourceImage": image_url
            }
        }
        
        # Send WebSocket completion update
        websocket_notifier.send_job_complete(job_id, result)
        
        return result
        
    except Exception as e:
        error_msg = f"Video generation failed: {str(e)}"
        websocket_notifier.send_job_error(job_id, error_msg)
        return {
            "status": "error",
            "message": error_msg
        }
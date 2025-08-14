import os
from rq import get_current_job

# Import video generation service
from config.settings import OUT_DIR
from services.video_service import generate_video_from_image


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

    # Get parameters from payload
    image_url = payload.get("imageUrl", "")
    num_frames = payload.get("numFrames", 25)
    
    if not image_url:
        return {
            "status": "error",
            "message": "No image URL provided"
        }
    
    # Convert image URL to file path
    # Assuming image_url is like "/outputs/job_id.png"
    if image_url.startswith("/outputs/"):
        image_path = image_url.replace("/outputs/", "/outputs/")
    else:
        return {
            "status": "error", 
            "message": "Invalid image URL format"
        }
    
    job.meta.update({"progress": 10})
    job.save_meta()
    
    # Check if source image exists
    if not os.path.exists(image_path):
        return {
            "status": "error",
            "message": f"Source image not found: {image_path}"
        }
    
    job.meta.update({"progress": 20})
    job.save_meta()
    
    try:
        # Generate video from image
        os.makedirs(OUT_DIR, exist_ok=True)
        video_output_path = os.path.join(OUT_DIR, f"{job_id}.mp4")
        
        job.meta.update({"progress": 30})
        job.save_meta()
        
        # Generate the video (this will take the most time)
        generate_video_from_image(
            image_path=image_path,
            output_path=video_output_path,
            num_frames=num_frames
        )
        
        job.meta.update({"progress": 95})
        job.save_meta()
        
        return {
            "status": "done",
            "videoUrl": f"/outputs/{job_id}.mp4",
            "meta": {
                "numFrames": num_frames,
                "model": "Stable Video Diffusion",
                "sourceImage": image_url
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Video generation failed: {str(e)}"
        }
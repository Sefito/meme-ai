import torch
import time
import platform
from diffusers import StableVideoDiffusionPipeline
from diffusers.utils import load_image, export_to_video
from diffusers.utils import logging as dlogging
from PIL import Image
from config.settings import device, dtype
dlogging.enable_progress_bar()

class DummyCtx:
    """Dummy context manager for non-CUDA environments."""
    def __enter__(self):
        return None
    
    def __exit__(self, *args):
        return False


# Global video model instance
_video_pipe = None


def svd_step_logger(p, step_index, timestep, callback_kwargs):
    lat = callback_kwargs.get("latents", None)
    if lat is not None:
        print(f"[SVD] step={step_index:03d} t={int(timestep)} "
              f"mean={float(lat.mean().cpu()):.4f} std={float(lat.std().cpu()):.4f}")
    return callback_kwargs

def load_video_model():
    """Load Stable Video Diffusion model."""
    global _video_pipe
    
    if _video_pipe is None:
        print("\n== Loading Stable Video Diffusion model ==")
        _video_pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            variant="fp16" if device == "cuda" else None,
            cache_dir="./model_cache"
        )
        _video_pipe = _video_pipe.to(device)
        print("\n== Stable Video Diffusion MODEL LOADED ==")
    
    return _video_pipe


def generate_video_from_image(image_path: str, output_path: str, num_frames: int = 16) -> str:
    """
    Generate a video from an input image using Stable Video Diffusion.
    
    Args:
        image_path: Path to the input image
        output_path: Path where the output video will be saved
        num_frames: Number of frames to generate (default: 25)
        
    Returns:
        Path to the generated video file
    """
    pipe = load_video_model()
    
    # Load and prepare the input image
    image = load_image(image_path)
    image = image.resize((320, 576))
    
    # Generate video frames
    print(f"\n== GENERATING VIDEO FROM IMAGE: {image_path} ==")
    
    # autocast helper for CUDA
    if device == "cuda":
        autocast = torch.autocast(device_type="cuda", dtype=torch.float16)
    else:
        autocast = DummyCtx()
    
    t0 = time.time()
    with autocast:
        frames = pipe(
            image,
            decode_chunk_size=8,  # Reduce memory usage
            num_frames=num_frames,
            motion_bucket_id=100,  # Control motion amount (1-255, higher = more motion)
            fps=7,  # Frame rate
            noise_aug_strength=0.02,
            callback_on_step_end=svd_step_logger,
            callback_on_step_end_tensor_inputs=["latents"],
        ).frames[0]
    
    dt = time.time() - t0
    print(f"== Generated {len(frames)} frames in {dt:.1f}s ==")    
    
    # Export frames to video
    export_to_video(frames, output_path, fps=7)
    print(f"\n== VIDEO SAVED TO: {output_path} ==")
    
    return output_path
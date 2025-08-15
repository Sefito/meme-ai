import torch
from PIL import Image
from models.image_models import load_sdxl_models, get_pipe
from config.settings import MODEL_LIST_ID, SELECTED_MODEL_ID, device
from diffusers.utils import logging as dlogging
dlogging.enable_progress_bar() 

class DummyCtx:
    """Dummy context manager for non-CUDA environments."""
    def __enter__(self):
        return None
    
    def __exit__(self, *args):
        return False


def generate_image(image_prompt: str, neg_prompt: str = "ugly, blurry, poor quality", 
                  steps: int = 30, guidance: float = 5.0, model: str = "SSD-1B", 
                  aspect: str = "1:1") -> Image.Image:
    """
    Generate an image using either SDXL models or SSD-1B model.
    
    Args:
        image_prompt: Text prompt for image generation
        neg_prompt: Negative prompt to avoid unwanted features
        steps: Number of inference steps for generation (20-60)
        guidance: Guidance scale for generation (3.0-9.0)
        model: Model to use (SSD-1B, SSD-Lite, Flux-1, SDXL)
        aspect: Aspect ratio (1:1, 4:3, 16:9, 9:16)
        
    Returns:
        Generated PIL Image
    """
    # Convert aspect ratio to dimensions
    aspect_ratios = {
        "1:1": (512, 512),
        "4:3": (512, 384),
        "16:9": (512, 288),
        "9:16": (288, 512),
    }
    width, height = aspect_ratios.get(aspect, (512, 512))
    
    # Model selection - for now, we'll map different model names to our available models
    # This allows the UI to show different options while using what we have
    model_mapping = {
        "SSD-1B": "SSD-1B",
        "SSD-Lite": "SSD-1B",  # Fallback to SSD-1B
        "Flux-1": "SSD-1B",    # Fallback to SSD-1B
        "SDXL": "SDXL"
    }
    
    selected_model = model_mapping.get(model, "SSD-1B")
    
    if selected_model == "SDXL" and MODEL_LIST_ID["SDXL"] == SELECTED_MODEL_ID:
        _base_pipe, _refiner_pipe = load_sdxl_models()
        print(f"\n== SDXL MODEL LOADED ({width}x{height}) ==")
        
        high_noise_frac = 0.8
        
        print("\n== GENERATING IMAGE ==")
        image = _base_pipe(
            prompt=image_prompt,
            num_inference_steps=steps,
            denoising_end=high_noise_frac,
            guidance_scale=guidance,
            width=width,
            height=height,
            output_type="latent",
        ).images[0]
        print("\n== BASE IMAGE GENERATED ==")
        
        print("\n== REFINER IMAGE GENERATING ==")
        image = _refiner_pipe(
            prompt=image_prompt,
            num_inference_steps=steps,
            denoising_end=high_noise_frac,
            guidance_scale=guidance,
            image=image,
        ).images[0]
        print("\n== REFINER IMAGE GENERATED ==")
        
    else:
        pipe = get_pipe()
        print(f"\n== {selected_model} MODEL LOADED ({width}x{height}) ==")

        # autocast helper
        if device == "cuda":
            autocast = torch.autocast(device_type="cuda", dtype=torch.float16)
        else:
            autocast = DummyCtx()

        print("\n== GENERATING IMAGE ==")
        print("\n== With params ==")
        print("Image Prompt: {}".format(image_prompt))
        print("Negative Prompt: {}".format(neg_prompt))
        print("Steps: {}".format(steps))
        print("Guidance: {}".format(guidance))
        print("Dimensions: {}x{}".format(width, height))
    
        with autocast:
            image = pipe(
                prompt=image_prompt,
                negative_prompt=neg_prompt,
                num_inference_steps=steps,
                guidance_scale=guidance,
                width=width,
                height=height,
            ).images[0]
        print("\n== IMAGE GENERATED ==")
    
    return image

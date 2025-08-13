import torch
from PIL import Image
from models.image_models import load_sdxl_models, get_pipe
from config.settings import MODEL_LIST_ID, SELECTED_MODEL_ID, device


class DummyCtx:
    """Dummy context manager for non-CUDA environments."""
    def __enter__(self):
        return None
    
    def __exit__(self, *args):
        return False


def generate_image(image_prompt: str, neg_prompt: str = "ugly, blurry, poor quality") -> Image.Image:
    """
    Generate an image using either SDXL models or SSD-1B model.
    
    Args:
        image_prompt: Text prompt for image generation
        neg_prompt: Negative prompt to avoid unwanted features
        
    Returns:
        Generated PIL Image
    """
    if MODEL_LIST_ID["SDXL"] == SELECTED_MODEL_ID:
        _base_pipe, _refiner_pipe = load_sdxl_models()
        print("\n== SDXL MODEL LOADED ==")
        
        n_steps = 40
        high_noise_frac = 0.8
        
        print("\n== GENERATING IMAGE ==")
        image = _base_pipe(
            prompt=image_prompt,
            num_inference_steps=n_steps,
            denoising_end=high_noise_frac,
            output_type="latent",
        ).images[0]
        print("\n== BASE IMAGE GENERATED ==")
        
        print("\n== REFINER IMAGE GENERATING ==")
        image = _refiner_pipe(
            prompt=image_prompt,
            num_inference_steps=n_steps,
            denoising_end=high_noise_frac,
            image=image,
        ).images[0]
        print("\n== REFINER IMAGE GENERATED ==")
        
    else:
        pipe = get_pipe()
        print("\n== SSD-1B MODEL LOADED ==")

        # autocast helper
        if device == "cuda":
            autocast = torch.autocast(device_type="cuda", dtype=torch.float16)
        else:
            autocast = DummyCtx()

        print("\n== GENERATING IMAGE ==")
    
        with autocast:
            image = pipe(
                prompt=image_prompt,
                negative_prompt=neg_prompt,
            ).images[0]
        print("\n== IMAGE GENERATED ==")
    
    return image

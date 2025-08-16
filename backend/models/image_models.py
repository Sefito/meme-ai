import torch
from diffusers import StableDiffusionXLPipeline, DiffusionPipeline, FluxPipeline

# Import configurations
from config.settings import ssd1b_model_id, sdxl_model_id, sdxl_refiner_model_id, flux_model_id, device, dtype, HF_TOKEN

# Global model instances
_pipe = None
_base_pipe = None
_refiner_pipe = None
_flux_pipe = None


def load_sdxl_models():
    """Load SDXL base and refiner models."""
    global _base_pipe, _refiner_pipe
    
    if _base_pipe is None:
        print("\n== Loading SDXL base model with dtype: {} ==".format(dtype))
        _base_pipe = DiffusionPipeline.from_pretrained(
            pretrained_model_name_or_path=sdxl_model_id["model_id"],
            use_safetensors=sdxl_model_id["use_safetensors"],
            variant=sdxl_model_id["variant"],
            torch_dtype=sdxl_model_id["dtype"],
            cache_dir="./model_cache",
            token=HF_TOKEN
        ).to(device)
    print("\n== SDXL BASE MODEL LOADED ==")

    if _refiner_pipe is None:
        print("\n== Loading SDXL refiner model with dtype: {} ==".format(dtype))
        _refiner_pipe = DiffusionPipeline.from_pretrained(
            pretrained_model_name_or_path=sdxl_refiner_model_id["model_id"],
            use_safetensors=sdxl_refiner_model_id["use_safetensors"],
            variant=sdxl_refiner_model_id["variant"],
            torch_dtype=sdxl_refiner_model_id["dtype"],
            cache_dir="./model_cache",
            vae=_base_pipe.vae,
            text_encoder_2=_base_pipe.text_encoder_2,
            token=HF_TOKEN
        ).to(device)
    print("\n== SDXL REFINER MODEL LOADED ==")
    
    return _base_pipe, _refiner_pipe


def get_pipe():
    """Load and return SSD-1B pipeline."""
    global _pipe
    
    if _pipe is None:
        print("\n== Loading SSD-1B model with dtype: {} ==".format(dtype))
        _pipe = StableDiffusionXLPipeline.from_pretrained(
            pretrained_model_name_or_path=ssd1b_model_id["model_id"],
            use_safetensors=ssd1b_model_id["use_safetensors"],
            variant=ssd1b_model_id["variant"],
            torch_dtype=ssd1b_model_id["dtype"],
            cache_dir="./model_cache",
            token=HF_TOKEN
        ).to(device)
    print("\n== SSD-1B MODEL LOADED ==")
    
    return _pipe


def get_flux_pipe():
    """Load and return Flux pipeline."""
    global _flux_pipe
    
    if _flux_pipe is None:
        print("\n== Loading Flux model with dtype: {} ==".format(flux_model_id["dtype"]))
        _flux_pipe = FluxPipeline.from_pretrained(
            pretrained_model_name_or_path=flux_model_id["model_id"],
            torch_dtype=flux_model_id["dtype"],
            cache_dir="./model_cache",
            token=HF_TOKEN
        ).to(device)
        # Enable CPU offloading to save VRAM as recommended in docs
        #_flux_pipe.enable_model_cpu_offload()
    print("\n== FLUX MODEL LOADED ==")
    
    return _flux_pipe

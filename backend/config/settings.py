import os
import torch

# List of models to load
MODEL_LIST_ID = {
    "SSD-1B": "segmind/SSD-1B",
    "SDXL": "stabilityai/stable-diffusion-xl-base-1.0",
    "SDXLRefiner": "stabilityai/stable-diffusion-xl-refiner-1.0",
    "FLUX": "black-forest-labs/FLUX.1-Krea-dev"
}
# Selected model ID
SELECTED_MODEL_ID = MODEL_LIST_ID["SSD-1B"]

# Model configurations
ssd1b_model_id = {
    "model_id": MODEL_LIST_ID["SSD-1B"],
    "use_safetensors": True,
    "variant": "fp16",
    "dtype": torch.float16,
}

sdxl_model_id = {
    "model_id": MODEL_LIST_ID["SDXL"],
    "use_safetensors": True,
    "variant": "fp16",
    "dtype": torch.float16,
}

sdxl_refiner_model_id = {
    "model_id": MODEL_LIST_ID["SDXLRefiner"],
    "use_safetensors": True,
    "variant": "fp16",
    "dtype": torch.float16,
}

flux_model_id = {
    "model_id": MODEL_LIST_ID["FLUX"],
    "use_safetensors": True,
    "variant": "fp16", 
    "dtype": torch.float16,
}

# Environment and path configurations
OUT_DIR = "/outputs"
FONT_PATH = "/fonts/Anton-Regular.ttf"
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

# Device and dtype settings
device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

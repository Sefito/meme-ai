#!/usr/bin/env python3
import os, torch, traceback
from diffusers import StableDiffusionXLPipeline, StableDiffusionXLImg2ImgPipeline

MODELS_DIR = "/models/stabilityai"
BASE_DIR = os.path.join(MODELS_DIR, "stable-diffusion-xl-base-1.0")
REFINER_DIR = os.path.join(MODELS_DIR, "stable-diffusion-xl-refiner-1.0")

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

def check_directory(dir_path):
    print(f"Checking directory: {dir_path}")
    if os.path.exists(dir_path):
        print(f"  ✅ Directory exists")
        files = os.listdir(dir_path)
        print(f"  📁 Contains {len(files)} files/directories")
        if "model_index.json" in files:
            print(f"  ✅ model_index.json found")
        else:
            print(f"  ❌ model_index.json NOT found")
    else:
        print(f"  ❌ Directory does NOT exist")

print("\n== ENVIRONMENT INFO ==")
print(f"PyTorch version: {torch.__version__}")
print(f"Device: {device}")
print(f"Dtype: {dtype}")

print("\n== DIRECTORIES CHECK ==")
check_directory(MODELS_DIR)
check_directory(BASE_DIR)
check_directory(REFINER_DIR)

print("\n== ATTEMPTING TO LOAD BASE MODEL ==")
try:
    base_model = StableDiffusionXLPipeline.from_pretrained(
        BASE_DIR, 
        torch_dtype=dtype,
        use_safetensors=True, 
        variant="fp16" if dtype==torch.float16 else None
    )
    print("✅ Base model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading base model: {e}")
    print("\nDetailed traceback:")
    traceback.print_exc()

print("\n== ATTEMPTING TO LOAD REFINER MODEL ==")
try:
    refiner_model = StableDiffusionXLImg2ImgPipeline.from_pretrained(
        REFINER_DIR,
        torch_dtype=dtype,
        use_safetensors=True, 
        variant="fp16" if dtype==torch.float16 else None
    )
    print("✅ Refiner model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading refiner model: {e}")
    print("\nDetailed traceback:")
    traceback.print_exc()

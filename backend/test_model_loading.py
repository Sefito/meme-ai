#!/usr/bin/env python3
import os, torch, traceback
from diffusers import StableDiffusionXLPipeline

# Use SSD-1B model from HuggingFace Hub
SSD_1B_MODEL_ID = "segmind/SSD-1B"

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

print("\n== ENVIRONMENT INFO ==")
print(f"PyTorch version: {torch.__version__}")
print(f"Device: {device}")
print(f"Dtype: {dtype}")
print(f"SSD-1B Model ID: {SSD_1B_MODEL_ID}")

print("\n== ATTEMPTING TO LOAD SSD-1B MODEL ==")
try:
    pipe = StableDiffusionXLPipeline.from_pretrained(
        SSD_1B_MODEL_ID, 
        torch_dtype=dtype,
        use_safetensors=True, 
        variant="fp16" if dtype==torch.float16 else None
    )
    print("✅ SSD-1B model loaded successfully!")
    print(f"Model components: {list(pipe.components.keys())}")
except Exception as e:
    print(f"❌ Error loading SSD-1B model: {e}")
    print("\nDetailed traceback:")
    traceback.print_exc()

import os, random, requests, re, json
from typing import Tuple
from rq import get_current_job
import torch
from diffusers import StableDiffusionXLPipeline
from PIL import Image, ImageDraw, ImageFont

# Configuration
ssd1b_model_id = {
    "model_id": "segmind/SSD-1B",
    "use_safetensors": True,
    "variant": "fp16",
    "dtype": torch.float16,
}
# Use SD-Turbo model from HuggingFace Hub
SD_TURBO_MODEL_ID = "stabilityai/sd-turbo"
SDXL_TURBO_MODEL_ID = "stabilityai/sdxl-turbo"
OUT_DIR = "/outputs"
FONT_PATH = "/fonts/Anton-Regular.ttf"
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

_pipe = None

def get_pipe():
    global _pipe
    if _pipe is None:
        print("\n== Loding model with dtype: {} ==".format(dtype))
        _pipe = StableDiffusionXLPipeline.from_pretrained(
            pretrained_model_name_or_path=ssd1b_model_id["model_id"],
            use_safetensors=ssd1b_model_id["use_safetensors"],
            variant=ssd1b_model_id["variant"],
            torch_dtype=ssd1b_model_id["dtype"],
            cache_dir="./model_cache"
        ).to(device)
    print("\n== SD-TURBO MODEL LOADED ==")
    return _pipe

def call_ollama(prompt: str) -> Tuple[str, str, str]:
    # Respuesta esperada: JSON con imagePrompt, topText, bottomText
    system = (
        "Eres un escritor de memes virales. Dado un tema, responde JSON estricto con "
        '{"imagePrompt": "... (descripción visual para SSD-1B)", '
        '"topText": "texto arriba corto", "bottomText": "texto abajo corto"}.'
    )
    body = {
        "model": "llama3.1:8b",
        "prompt": f"<<SYS>>{system}<</SYS>>\nUsuario: {prompt}\nJSON:",
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 256}
    }
    r = requests.post(f"{OLLAMA_HOST}/api/generate", json=body, timeout=120)
    r.raise_for_status()
    txt = r.json().get("response","")
    m = re.search(r"\{.*\}", txt, re.S)
    print("\n== OLLAMA RESPONSE ==")
    print(m.group(0))
    data = json.loads(m.group(0)) if m else {"imagePrompt": prompt, "topText":"", "bottomText":""}
    return data.get("imagePrompt", prompt), data.get("topText",""), data.get("bottomText","")

def overlay_caption(img: Image.Image, top: str, bottom: str) -> Image.Image:
    draw = ImageDraw.Draw(img)
    base_size = max(32, img.height//8)  # Increased base size and better ratio
    
    def draw_center(text: str, y: int, is_top: bool = True):
        if not text: return
        size = base_size
        while True:
            font = ImageFont.truetype(FONT_PATH, size=size)
            width = draw.textlength(text.upper(), font=font)
            if width <= img.width*0.9 or size <= 16: break  # More conservative width and minimum size
            size -= 2
        
        # Get text dimensions for better positioning
        bbox = draw.textbbox((0, 0), text.upper(), font=font)
        text_height = bbox[3] - bbox[1]
        
        # Adjust y position based on text height and whether it's top or bottom
        if is_top:
            # For top text, position from the top edge plus some padding
            final_y = y + text_height // 2
        else:
            # For bottom text, position from the bottom edge minus text height and padding
            final_y = y - text_height // 2
        
        # Draw outline (black border)
        for ox in (-2, -1, 0, 1, 2):
            for oy in (-2, -1, 0, 1, 2):
                if ox != 0 or oy != 0:  # Don't draw at center position
                    draw.text((img.width/2+ox, final_y+oy), text.upper(), anchor="mm",
                              font=font, fill="black")
        
        # Draw main text (white with black stroke)
        draw.text((img.width/2, final_y), text.upper(), anchor="mm",
                  font=font, fill="white", stroke_width=2, stroke_fill="black")
    
    # Better padding calculation - more generous margins
    pad = max(20, int(img.height*0.08))  # Minimum 20px padding, or 8% of height
    
    # Draw top text
    draw_center(top, pad, is_top=True)
    
    # Draw bottom text  
    draw_center(bottom, img.height - pad, is_top=False)
    
    return img

def run_job(job_id: str, payload: dict):
    job = get_current_job()
    job.meta.update({"status":"running","progress":5}); job.save_meta()

    user_prompt = payload.get("prompt","")
    steps = int(payload.get("steps") or 4)
    guidance = float(payload.get("guidance") or 2.0)
    seed = int(payload.get("seed") or random.randint(1, 2**31-1))
    generator = torch.Generator(device=device).manual_seed(seed)

    # 1) Ollama → prompt visual + captions
    try:
        image_prompt, top, bottom = call_ollama(user_prompt)
        print(f"Image prompt: {image_prompt}")
        print(f"Top: {top}")
        print(f"Bottom: {bottom}")
    except Exception:
        image_prompt, top, bottom = user_prompt, "", ""
    job.meta.update({"progress":20}); job.save_meta()

    # 2) SSD-1B single-pass generation
    print("\n== SSD-1B MODEL LOADING ==")
    pipe = get_pipe()
    print("\n== SSD-1B MODEL LOADED ==")

    # autocast helper
    if device == "cuda":
        autocast = torch.autocast(device_type="cuda", dtype=torch.float16)
    else:
        class DummyCtx:
            def __enter__(self): return None
            def __exit__(self, *args): return False
        autocast = DummyCtx()

    print("\n== GENERATING IMAGE ==")
    neg_prompt = "ugly, blurry, poor quality" 
    with autocast:
        image = pipe(
            prompt=image_prompt,
            negative_prompt=neg_prompt,
        ).images[0]
    print("\n== IMAGE GENERATED ==")
    image.save("/outputs/{}_source.png".format(job_id))
    job.meta.update({"progress":85}); job.save_meta()

    # 3) Caption estilo meme
    final_img = overlay_caption(image, top, bottom)

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, f"{job_id}.png")
    final_img.save(out_path, "PNG")

    return {
        "status": "done",
        "imageUrl": f"/outputs/{job_id}.png",
        "meta": {
            "seed": seed,
            "steps": 4,
            "model": "SD-Turbo",
            "prompt": image_prompt,
            "top": top, "bottom": bottom
        }
    }

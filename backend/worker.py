import os, random, requests, re, json
from typing import Tuple
from rq import get_current_job
import torch
from diffusers import StableDiffusionXLPipeline
from PIL import Image, ImageDraw, ImageFont

# Use SSD-1B model from HuggingFace Hub
SSD_1B_MODEL_ID = "segmind/SSD-1B"
OUT_DIR = "/outputs"
FONT_PATH = "/fonts/Anton-Regular.ttf"
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

_pipe = None

def get_pipe():
    global _pipe
    if _pipe is None:
        _pipe = StableDiffusionXLPipeline.from_pretrained(
            SSD_1B_MODEL_ID, 
            torch_dtype=dtype, 
            use_safetensors=True, 
            variant="fp16" if dtype==torch.float16 else None
        ).to(device)
        # Enable VAE tiling for memory efficiency
        _pipe.enable_vae_tiling()
    return _pipe

def call_ollama(prompt: str) -> Tuple[str, str, str]:
    # Respuesta esperada: JSON con imagePrompt, topText, bottomText
    system = (
        "Eres un escritor de memes. Dado un tema, responde JSON estricto con "
        '{"imagePrompt": "... (descripción visual para Stable Diffusion XL)", '
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
    data = json.loads(m.group(0)) if m else {"imagePrompt": prompt, "topText":"", "bottomText":""}
    return data.get("imagePrompt", prompt), data.get("topText",""), data.get("bottomText","")

def overlay_caption(img: Image.Image, top: str, bottom: str) -> Image.Image:
    draw = ImageDraw.Draw(img)
    base_size = max(28, img.height//10)
    def draw_center(text: str, y: int):
        if not text: return
        size = base_size
        while True:
            font = ImageFont.truetype(FONT_PATH, size=size)
            width = draw.textlength(text.upper(), font=font)
            if width <= img.width*0.95 or size <= 14: break
            size -= 2
        # outline + fill
        for ox in (-3, -1, 1, 3):
            for oy in (-3, -1, 1, 3):
                draw.text((img.width/2+ox, y+oy), text.upper(), anchor="ma",
                          font=font, fill="black")
        draw.text((img.width/2, y), text.upper(), anchor="ma",
                  font=font, fill="white", stroke_width=3, stroke_fill="black")
    pad = int(img.height*0.06)
    draw_center(top, pad)
    draw_center(bottom, img.height - pad)
    return img

def run_job(job_id: str, payload: dict):
    job = get_current_job()
    job.meta.update({"status":"running","progress":5}); job.save_meta()

    user_prompt = payload.get("prompt","")
    steps = int(payload.get("steps") or 30)
    guidance = float(payload.get("guidance") or 5.0)
    seed = int(payload.get("seed") or random.randint(1, 2**31-1))
    generator = torch.Generator(device=device).manual_seed(seed)

    # 1) Ollama → prompt visual + captions
    try:
        image_prompt, top, bottom = call_ollama(user_prompt)
        print(f"Image prompt: {image_prompt}")
    except Exception:
        image_prompt, top, bottom = user_prompt, "", ""
    job.meta.update({"progress":20}); job.save_meta()

    # 2) SSD-1B single-pass generation
    pipe = get_pipe()

    # autocast helper
    if device == "cuda":
        autocast = torch.autocast(device_type="cuda", dtype=torch.float16)
    else:
        class DummyCtx:
            def __enter__(self): return None
            def __exit__(self, *args): return False
        autocast = DummyCtx()

    with autocast:
        image = pipe(
            prompt=image_prompt,
            num_inference_steps=steps,
            guidance_scale=guidance,
            generator=generator
        ).images[0]
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
            "steps": steps,
            "model": "SSD-1B",
            "prompt": image_prompt,
            "top": top, "bottom": bottom
        }
    }

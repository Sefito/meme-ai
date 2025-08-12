# Meme AI (Ollama + SDXL Refiner)

Stack completo para generar memes con IA: **Frontend React+TS (Vite)** y **Backend FastAPI + RQ + Redis** con **Ollama** (LLM) y **Stable Diffusion XL (base+refiner)**.

## Requisitos
- Docker y Docker Compose
- GPU NVIDIA (recomendado) para inferencia (CUDA 12.x)
- Modelos descargados localmente (ver abajo)

## Estructura
```
meme-ai/
  backend/            # API FastAPI + worker RQ
  frontend/           # Vite + React + Tailwind
  models/             # coloca aquí SDXL base y refiner (ver rutas)
  outputs/            # imágenes generadas
  fonts/              # Anton-Regular.ttf (OFL) u otra
  docker-compose.yml
```

## Pasos rápidos
1) Arranca Ollama y Redis:
```bash
docker compose up -d ollama redis
docker exec -it $(docker ps -qf name=ollama) ollama pull llama3.1:8b
```
2) Copia **SDXL** a `./models/stabilityai/` (carpetas completas):
   - `stable-diffusion-xl-base-1.0/`
   - `stable-diffusion-xl-refiner-1.0/`

3) Copia la fuente `fonts/Anton-Regular.ttf` (OFL) o similar estilo Impact.

4) Sube API y worker:
```bash
docker compose up --build api worker
```

5) Frontend (dev):
```bash
cd frontend && pnpm i && pnpm dev
```

Más detalles en `backend/README.md` y `frontend/README.md`.

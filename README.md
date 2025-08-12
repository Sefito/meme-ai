# Meme AI (Ollama + SSD-1B)

Stack completo para generar memes con IA: **Frontend React+TS (Vite)** y **Backend FastAPI + RQ + Redis** con **Ollama** (LLM) y **SSD-1B** (Stable Diffusion).

## Requisitos
- Docker y Docker Compose
- GPU NVIDIA (recomendado) para inferencia (CUDA 12.x)
- Acceso a internet para descargar SSD-1B automáticamente

## Estructura
```
meme-ai/
  backend/            # API FastAPI + worker RQ
  frontend/           # Vite + React + Tailwind
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
2) Copia la fuente `fonts/Anton-Regular.ttf` (OFL) o similar estilo Impact.

3) Sube API y worker:
```bash
docker compose up --build api worker
```
**Nota:** SSD-1B se descarga automáticamente desde HuggingFace Hub en el primer uso.

4) Frontend (dev):
```bash
cd frontend && pnpm i && pnpm dev
```

## Sobre SSD-1B
SSD-1B es un modelo de difusión optimizado de Segmind, mucho más pequeño y eficiente que Stable Diffusion XL:
- **Tamaño:** ~1B parámetros (vs ~3.5B en SDXL)
- **Velocidad:** 60% más rápido que SDXL
- **Memoria:** Menor uso de VRAM
- **Calidad:** Mantiene alta calidad de imágenes
- **Compatibilidad:** Misma API que StableDiffusionXL

Más detalles en `backend/README.md` y `frontend/README.md`.

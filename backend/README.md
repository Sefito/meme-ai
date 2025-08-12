# Backend (FastAPI + RQ + SDXL + Ollama)

## Endpoints
- `POST /api/jobs` → crea un job `{ prompt, steps?, guidance?, seed? }`
- `GET /api/jobs/:id` → consulta estado `queued|running|done|error`

## Desarrollo local (sin Docker)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export HF_HUB_OFFLINE=1
export OLLAMA_HOST=http://localhost:11434
uvicorn app.main:app --reload
```
En otra terminal:
```bash
rq worker meme
```

## Producción
Usa `docker-compose.yml` en la raíz. Monta `models/`, `outputs/` y `fonts/` como volúmenes.

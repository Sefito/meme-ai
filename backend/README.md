# Backend (FastAPI + RQ + SSD-1B + Ollama)

## Endpoints
- `POST /api/jobs` → crea un job `{ prompt, steps?, guidance?, seed? }`
- `GET /api/jobs/:id` → consulta estado `queued|running|done|error`

## Desarrollo local (sin Docker)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export OLLAMA_HOST=http://localhost:11434
uvicorn app.main:app --reload
```
En otra terminal:
```bash
rq worker meme
```

**Nota:** SSD-1B se descarga automáticamente desde HuggingFace Hub en el primer uso.

## Producción
Usa `docker-compose.yml` en la raíz. Monta `outputs/` y `fonts/` como volúmenes. Los modelos SSD-1B se descargan automáticamente.

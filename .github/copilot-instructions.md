# Meme AI - Ollama + SDXL Refiner

AI-powered meme generation application with **FastAPI backend** and **React TypeScript frontend**. Uses **Ollama** for LLM text processing and **Stable Diffusion XL** for high-quality image generation with AI-generated text overlays.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap the Environment
- Install pnpm globally: `npm install -g pnpm`
- Verify Docker and Docker Compose are available: `docker --version && docker compose version`
- Check NVIDIA GPU support (optional but recommended): `nvidia-smi`

### Frontend Development
- Navigate to frontend directory: `cd frontend`
- Install dependencies: `pnpm install` -- takes 25 seconds. NEVER CANCEL.
- Build for production: `pnpm build` -- takes 3 seconds. NEVER CANCEL.
- Preview production build: `pnpm preview` -- serves on http://localhost:4173
- Start development server: `pnpm dev` -- starts on http://localhost:5173
- The dev server proxies `/api` and `/outputs` to http://localhost:8000 (see vite.config.ts)

### Backend Development

#### Using Docker Compose (Recommended)
- Build backend containers: `docker compose build api worker` -- takes 10+ minutes due to PyTorch dependencies. NEVER CANCEL. Set timeout to 20+ minutes.
- Start infrastructure services: `docker compose up -d ollama redis` -- takes 2-3 minutes. NEVER CANCEL. Set timeout to 5+ minutes.
- Pull Ollama model: `docker exec -it $(docker ps -qf name=ollama) ollama pull llama3.1:8b` -- takes 10+ minutes depending on network. NEVER CANCEL. Set timeout to 30+ minutes.
- Start API and worker: `docker compose up --build api worker` -- NEVER CANCEL.

#### Local Development (Alternative)
- Create virtual environment: `cd backend && python3 -m venv venv && source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt` -- takes 15+ minutes due to PyTorch/CUDA dependencies. NEVER CANCEL. Set timeout to 30+ minutes.
- Set environment variables:
  - `export HF_HUB_OFFLINE=1`
  - `export OLLAMA_HOST=http://localhost:11434`
  - `export PYTHONPATH=/app` (when using Docker) or `export PYTHONPATH=$(pwd)` (local)
- Start API server: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Start RQ worker (separate terminal): `rq worker meme`

### Model Setup (Required for Full Functionality)
**CRITICAL**: The application requires SDXL models to be manually placed in the correct directories:

- Download SDXL base model to: `./models/stabilityai/stable-diffusion-xl-base-1.0/`
- Download SDXL refiner model to: `./models/stabilityai/stable-diffusion-xl-refiner-1.0/`
- Both directories must contain `model_index.json` and complete model files
- Font file `Anton-Regular.ttf` is already provided in `./fonts/`

### Model Validation
- Test model loading: `cd backend && python3 test_model_loading.py`
- This script checks for:
  - Directory existence and contents
  - PyTorch availability and CUDA support
  - Successful model loading
- Expected to fail if models are not downloaded or dependencies not installed

## Validation

### Manual Testing Scenarios
After making code changes, always test these scenarios:

1. **Frontend Build Validation**:
   - Run `cd frontend && pnpm build`
   - Verify no TypeScript errors
   - Check generated files in `frontend/dist/`

2. **Frontend Production Validation**:
   - Build production version: `cd frontend && pnpm build`
   - Preview production build: `pnpm preview`
   - Test production build serves correctly on http://localhost:4173
   - Verify no TypeScript errors during build process
   - Check generated files in `frontend/dist/`

3. **API Health Check**:
   - Start backend services
   - Test health endpoint: `curl http://localhost:8000/api/health`
   - Should return `{"ok": true}`

4. **Complete User Flow** (if models available):
   - Start all services: frontend dev server + backend API + worker
   - Navigate to http://localhost:5173
   - Submit a meme prompt (e.g., "cats being funny")
   - Verify job creation and status polling
   - Wait for image generation completion (may take 2-5 minutes)
   - Verify image display and download functionality

5. **Docker Integration Test**:
   - Build all containers: `docker compose build` -- takes 10+ minutes. NEVER CANCEL.
   - Start all services: `docker compose up -d` -- NEVER CANCEL.
   - Test API endpoints through Docker network
   - Verify volume mounts for models, outputs, and fonts

### Code Quality Checks
- **Frontend**: No specific linter configured, but TypeScript compiler catches errors during build
  - Build command serves as primary validation: `pnpm build`
  - Preview built application: `pnpm preview`
- **Backend**: No specific linter configured, but Python syntax is validated on import
  - Import validation: `python3 -c "import app.main; import worker"`
- Always run `pnpm build` in frontend to catch TypeScript errors before committing
- Test API endpoints manually or with curl before committing backend changes

## Common Tasks

### Repository Structure
```
meme-ai/
├── .github/              # GitHub configuration
├── backend/              # FastAPI + RQ worker
│   ├── app/
│   │   └── main.py      # FastAPI application
│   ├── worker.py        # RQ worker for image generation
│   ├── test_model_loading.py  # Model validation script
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile       # Backend container
├── frontend/            # Vite + React + TypeScript
│   ├── src/
│   │   ├── App.tsx      # Main application component
│   │   ├── api.ts       # API client functions
│   │   ├── types.ts     # TypeScript type definitions
│   │   └── components/  # React components
│   ├── package.json     # Node.js dependencies
│   └── vite.config.ts   # Vite configuration
├── models/              # SDXL models (gitignored, manual setup)
│   └── stabilityai/
├── outputs/             # Generated meme images (gitignored)
├── fonts/               # Font files for text overlay
└── docker-compose.yml   # Multi-service orchestration
```

### Key Technologies and Dependencies

#### Backend Stack
- **FastAPI**: REST API framework
- **RQ (Redis Queue)**: Asynchronous job processing
- **Stable Diffusion XL**: AI image generation (base + refiner)
- **Ollama**: LLM for text processing (llama3.1:8b model)
- **PyTorch**: ML framework with CUDA support
- **Pillow**: Image processing and text overlay

#### Frontend Stack
- **Vite**: Build tool and dev server
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Tanstack Query**: API state management

#### Infrastructure
- **Docker Compose**: Service orchestration
- **Redis**: Queue backend and caching
- **NVIDIA Docker Runtime**: GPU access for AI models

### API Endpoints
- `POST /api/jobs` - Create meme generation job
  - Body: `{ prompt: string, steps?: number, guidance?: number, seed?: number }`
  - Returns: `{ jobId: string }`
- `GET /api/jobs/{job_id}` - Get job status and result
  - Returns job status: `queued|running|done|error`
- `GET /api/health` - Health check
- `GET /outputs/{filename}` - Serve generated images
- `GET /docs` - FastAPI auto-generated documentation

### Environment Variables
- `HF_HUB_OFFLINE=1` - Use local models only (no Hugging Face downloads)
- `OLLAMA_HOST` - Ollama service URL (default: http://localhost:11434)
- `PYTHONPATH` - Python module path for imports

### Build Times and Expectations
- **Frontend install**: ~25 seconds
- **Frontend build**: ~3 seconds  
- **Backend Docker build**: 10-15 minutes (PyTorch + CUDA dependencies)
- **Ollama model download**: 10-30 minutes (4GB+ model)
- **SDXL model download**: Variable (models not included in repo)
- **Image generation**: 2-5 minutes per meme (depending on steps and GPU)

### Troubleshooting Common Issues

#### "ModuleNotFoundError: No module named 'torch'"
- Install backend dependencies: `pip install -r requirements.txt`
- Or use Docker: `docker compose up --build api worker`

#### "Could not find SDXL models"
- Download models manually to `./models/stabilityai/` directories
- Run validation: `python3 backend/test_model_loading.py`

#### Frontend proxy errors (404 on /api calls)
- Ensure backend API is running on port 8000
- Check vite.config.ts proxy configuration
- Verify CORS settings in backend/app/main.py

#### Docker build fails with SSL errors
- Network restrictions in sandboxed environments
- Use pre-built images or install dependencies locally

#### "NameError: name 'logger' is not defined" in worker.py
- Missing import on line 91 of backend/worker.py
- Add `import logging; logger = logging.getLogger(__name__)` to top of file
- Or remove/comment the logger.info() call

#### GPU not detected
- Install NVIDIA Docker runtime: `nvidia-container-toolkit`
- Verify GPU access: `docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi`

### File Locations to Check After Changes
- **API changes**: Test `backend/app/main.py` endpoints with curl
- **Worker changes**: Monitor job processing in `backend/worker.py`
- **UI changes**: Build and test `frontend/src/App.tsx` components
- **Docker changes**: Rebuild containers with `docker compose build`
- **Model changes**: Run validation script `backend/test_model_loading.py`

Always verify that both frontend build and backend health check pass before considering changes complete.
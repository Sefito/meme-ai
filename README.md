# 🎭 Meme AI Generator

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![GPU](https://img.shields.io/badge/GPU-CUDA%2012.x-green.svg)](https://developer.nvidia.com/cuda-downloads)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**AI-powered meme generator combining the best of modern AI**: Ollama LLM for creative text generation and SSD-1B for ultra-fast, high-quality image synthesis. Create hilarious, contextual memes with professional typography in seconds!

## ✨ Key Features

🚀 **Blazing Fast Generation** - SSD-1B delivers 60% faster inference than SDXL
🎨 **Professional Typography** - Custom font rendering with outlined text effects  
🧠 **AI-Driven Creativity** - Ollama LLM generates contextual image prompts and meme text
⚡ **GPU Accelerated** - CUDA optimization for both LLM and image generation
🐳 **Docker Ready** - Complete containerized deployment with microservices architecture
📱 **Modern UI** - Responsive React frontend with real-time progress tracking
🔄 **Queue System** - Redis-backed job processing for scalable meme generation
🎯 **API First** - RESTful FastAPI backend with automatic OpenAPI documentation

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React + TS    │    │   FastAPI       │    │   Redis Queue   │
│   Frontend      │◄──►│   Backend       │◄──►│   Worker        │
│   (Port 5173)   │    │   (Port 8000)   │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Ollama LLM    │              │
         │              │   (Port 11434)  │◄─────────────┘
         │              └─────────────────┘              
         │                       │                       
         │              ┌─────────────────┐              
         │              │     SSD-1B      │              
         │              │  Image Model    │◄─────────────┘
         │              └─────────────────┘              
         │                                               
    ┌─────────────────┐                                  
    │  Static Files   │                                  
    │   /outputs      │◄─────────────────────────────────┘
    └─────────────────┘                                  
```

### 🔄 Meme Generation Pipeline

1. **User Input** → Prompt submission via React frontend
2. **LLM Processing** → Ollama generates image description + meme text (top/bottom)
3. **Image Generation** → SSD-1B creates base image from description
4. **Text Overlay** → Professional meme text rendering with custom font
5. **Delivery** → Real-time progress updates and final meme download

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** - Container orchestration
- **NVIDIA GPU** (recommended) - CUDA 12.x for optimal performance
- **8GB+ RAM** - For model loading and inference
- **Internet Connection** - Auto-downloads AI models on first run

### 🐳 Docker Deployment (Recommended)

1. **Start Core Services**
```bash
# Launch Ollama and Redis
docker compose up -d ollama redis

# Download the LLM model (one-time setup)
docker exec -it $(docker ps -qf name=ollama) ollama pull llama3.1:8b
```

2. **Launch Backend Services**
```bash
# Start API server and background worker
docker compose up --build api worker
```
> 📝 **Note**: SSD-1B model (~2GB) downloads automatically from HuggingFace on first use

3. **Start Frontend (Development)**
```bash
cd frontend
pnpm install  # or npm install
pnpm dev      # Runs on http://localhost:5173
```

4. **Access the Application**
   - **Frontend**: http://localhost:5173
   - **API Documentation**: http://localhost:8000/docs
   - **Generated Memes**: http://localhost:8000/outputs/

### 💻 Local Development Setup

<details>
<summary>Click to expand local development instructions</summary>

**Backend Setup**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export OLLAMA_HOST=http://localhost:11434
export PYTHONPATH=/path/to/backend

# Start services
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
rq worker meme  # In separate terminal
```

**Frontend Setup**
```bash
cd frontend
pnpm install
pnpm dev  # Proxies API requests to localhost:8000
```

</details>

## 🎨 Usage Examples

### Basic Meme Generation

```bash
curl -X POST "http://localhost:8000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Programmer debugging code at 3 AM",
    "steps": 30,
    "guidance": 7.5
  }'
```

### Advanced Configuration

```bash
curl -X POST "http://localhost:8000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Cat sitting on laptop keyboard",
    "seed": 12345,
    "steps": 40,
    "guidance": 5.0,
    "negative": "blurry, low quality, distorted"
  }'
```

### Check Job Status

```bash
curl "http://localhost:8000/api/jobs/{job_id}"
```

## 📚 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs` | Create new meme generation job |
| `GET` | `/api/jobs/{id}` | Get job status and results |
| `GET` | `/api/health` | Service health check |
| `GET` | `/outputs/{filename}` | Download generated images |

### Request Schema

```typescript
interface CreateJob {
  prompt: string;           // Meme theme or description
  seed?: number;           // Reproducible generation (optional)
  negative?: string;       // Negative prompts to avoid (optional)
  steps?: number;          // Inference steps (default: 30)
  guidance?: number;       // Guidance scale (default: 5.0)
}
```

### Response Schema

```typescript
interface JobStatus {
  status: 'queued' | 'running' | 'done' | 'error';
  progress?: number;       // 0-100 for queued/running
  imageUrl?: string;       // Available when status === 'done'
  meta?: {
    seed: number;
    steps: number;
    model: string;
    prompt: string;
    top?: string;          // Top meme text
    bottom?: string;       // Bottom meme text
  };
  message?: string;        // Error message if status === 'error'
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama service URL |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `PYTHONPATH` | `/app` | Python module path |

### Model Configuration

- **LLM Model**: `llama3.1:8b` (Ollama)
- **Image Model**: `segmind/SSD-1B` (HuggingFace)
- **Font**: Anton-Regular.ttf (included)
- **Output Format**: PNG with transparency support

## 🔧 Troubleshooting

<details>
<summary><strong>GPU/CUDA Issues</strong></summary>

- Ensure NVIDIA drivers and CUDA 12.x are installed
- Verify GPU access: `docker run --gpus all nvidia/cuda:12.1-base-ubuntu20.04 nvidia-smi`
- For CPU-only mode, models will automatically fallback but expect slower performance

</details>

<details>
<summary><strong>Model Download Issues</strong></summary>

- **Ollama Model**: `docker exec -it ollama-container ollama pull llama3.1:8b`
- **SSD-1B**: Automatically downloads from HuggingFace (~2GB), ensure stable internet
- Check disk space: Models require ~10GB total storage

</details>

<details>
<summary><strong>Memory Issues</strong></summary>

- **RAM**: Ensure 8GB+ available for model loading
- **VRAM**: 6GB+ recommended for optimal performance
- Reduce `steps` parameter if running out of memory

</details>

<details>
<summary><strong>Port Conflicts</strong></summary>

```bash
# Check port usage
sudo lsof -i :8000  # FastAPI
sudo lsof -i :11434 # Ollama
sudo lsof -i :6379  # Redis
sudo lsof -i :5173  # Frontend
```

</details>

## 🚀 Performance & Benchmarks

### SSD-1B vs Stable Diffusion XL

| Metric | SSD-1B | SDXL | Improvement |
|--------|--------|------|-------------|
| Parameters | ~1B | ~3.5B | 71% smaller |
| Generation Speed | ~2-3s | ~5-8s | 60% faster |
| VRAM Usage | ~4GB | ~8GB | 50% less |
| Model Size | ~2GB | ~7GB | 71% smaller |
| Quality | High | High | Comparable |

### Typical Generation Times (RTX 3080)

- **30 steps**: ~3-4 seconds
- **50 steps**: ~5-6 seconds
- **Queue processing**: <1 second overhead

## 📁 Project Structure

```
meme-ai/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   └── main.py         # API routes and CORS setup
│   ├── worker.py           # RQ background job processor
│   ├── Dockerfile          # Backend container config
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── App.tsx        # Main application
│   │   └── api.ts         # Backend API client
│   ├── package.json       # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
├── fonts/                 # Typography assets
│   └── Anton-Regular.ttf  # Meme font (OFL licensed)
├── outputs/               # Generated meme storage
├── docker-compose.yml     # Multi-service orchestration
└── README.md             # This file
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all containers build successfully
- Test across different GPU configurations

## 🛣️ Roadmap & Future Improvements

### 🎯 Short-term Goals
- [ ] **Multiple Font Support** - Add variety to meme typography
- [ ] **Custom Templates** - Pre-built meme layouts and styles
- [ ] **Batch Processing** - Generate multiple memes simultaneously
- [ ] **Enhanced UI** - Advanced parameter controls and preview modes
- [ ] **Performance Optimization** - Model quantization and caching

### 🚀 Long-term Vision
- [ ] **Multi-language Support** - LLM prompts in various languages
- [ ] **Video Memes** - Animated GIF and MP4 generation
- [ ] **Social Integration** - Direct sharing to platforms
- [ ] **Custom Model Training** - Fine-tune on specific meme styles
- [ ] **Mobile App** - Native iOS and Android applications
- [ ] **Community Features** - Meme gallery and voting system

### 💡 Suggested Improvements

**Technical Enhancements:**
- Implement WebSocket for real-time progress updates
- Add Redis caching for frequently generated memes  
- Support for additional image models (DALL-E, Midjourney API)
- Implement proper logging and monitoring (Prometheus/Grafana)
- Add comprehensive test suite (unit, integration, E2E)
- Kubernetes deployment manifests for production scaling

**User Experience:**
- Drag-and-drop image uploads for custom backgrounds
- Advanced text positioning and styling controls
- Meme history and favorites system
- Social sharing with metadata preservation
- Mobile-responsive design improvements

**AI & ML Improvements:**
- Fine-tune LLM for better meme context understanding
- Implement style transfer for consistent visual themes
- Add NSFW content detection and filtering
- Support for trending meme formats detection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Segmind](https://huggingface.co/segmind)** - For the incredible SSD-1B model
- **[Ollama](https://ollama.ai/)** - For making LLM deployment accessible  
- **[HuggingFace](https://huggingface.co/)** - For the model distribution platform
- **[FastAPI](https://fastapi.tiangolo.com/)** - For the excellent Python API framework
- **[React](https://reactjs.org/)** & **[Vite](https://vitejs.dev/)** - For the modern frontend tooling

---

<div align="center">

**Made with ❤️ by the community**

[Report Bug](https://github.com/Sefito/meme-ai/issues) • [Request Feature](https://github.com/Sefito/meme-ai/issues) • [Contribute](https://github.com/Sefito/meme-ai/pulls)

</div>

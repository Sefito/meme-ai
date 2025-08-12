# Frontend (Vite + React + TS)

UI mínima para enviar prompts y ver progreso/resultado del backend.

## Desarrollo
```bash
pnpm i     # o npm install
pnpm dev   # http://localhost:5173
```
El dev server proxeará `/api` y `/outputs` a `http://localhost:8000` (ver `vite.config.ts`).

## Build
```bash
pnpm build
pnpm preview
```

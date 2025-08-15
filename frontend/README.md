# Frontend (Vite + React + TS)

Interfaz moderna de Meme AI Studio con diseño de 3 columnas, soporte para carga de imágenes y texto de memes.

## Características

### 🎨 Nueva UI/UX
- **Layout de 3 columnas**: Prompt + Upload | Preview | Parámetros
- **Tema claro/oscuro** con toggle persistente
- **Historial lateral** con miniaturas (máx. 24 elementos)
- **Barra inferior pegajosa** con acciones y progreso siempre visible

### 🖼️ Generación de Memes
- **Carga de imagen**: Drag & drop + file picker
- **Texto superior/inferior** con preview en tiempo real
- **Vista previa** con overlay estilo meme (fuente Impact, contorno negro)
- **Parámetros completos**: steps, guidance, modelo, aspect ratio, seed, negative prompt

### 📱 Experiencia de Usuario
- **Notificaciones toast** para feedback inmediato
- **Estados vacíos amigables** con mensajes claros
- **Accesibilidad mejorada** con labels y focus visible
- **Diseño responsivo** que funciona en desktop y móvil

## Desarrollo
```bash
npm install     # o pnpm i
npm run dev     # http://localhost:5173
```
El dev server proxeará `/api` y `/outputs` a `http://localhost:8000` (ver `vite.config.ts`).

## Build
```bash
npm run build
npm run preview
```

## Componentes Principales

- **MemeStudio**: Componente principal con layout y lógica
- **ImageUpload**: Carga de imágenes con drag & drop
- **MemePreview**: Vista previa con overlay de texto
- **ParameterPanel**: Controles de generación
- **HistoryPanel**: Historial con miniaturas
- **ThemeToggle**: Cambio de tema claro/oscuro

## API Integration

La interfaz mantiene compatibilidad completa con el backend existente:
- Endpoints REST para generación y video
- WebSocket para progreso en tiempo real
- Soporte para multipart/form-data cuando se carga imagen
- Fallback a JSON para compatibilidad sin imagen

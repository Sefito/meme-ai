import { useState } from 'react';
import { createJob, createVideoJob } from './api';
import { useJob, useVideoJob } from './hooks/useJob';
import { JobStatus, VideoJobStatus } from './types';
import PromptForm from './components/PromptForm';
import ProgressBar from './components/ProgressBar';

export default function App() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const status: JobStatus = useJob(jobId ?? undefined);
  const videoStatus: VideoJobStatus = useVideoJob(videoJobId ?? undefined);

  const onCreate = async (data: any) => {
    const { jobId } = await createJob(data);
    setJobId(jobId);
    setVideoJobId(null); // Reset video job when creating new image
  };

  const onCreateVideo = async () => {
    if (status.status === 'done' && status.imageUrl) {
      try {
        const { jobId } = await createVideoJob({ imageUrl: status.imageUrl });
        setVideoJobId(jobId);
      } catch (error) {
        console.error('Error creating video job:', error);
      }
    }
  };

  const isWorking = status.status === 'queued' || status.status === 'running';
  const isVideoWorking = videoStatus.status === 'queued' || videoStatus.status === 'running';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meme AI (Ollama + SDXL)</h1>
        <a href="http://localhost:8000/docs" target="_blank" className="text-sm opacity-70 hover:opacity-100">API Docs</a>
      </header>

      <PromptForm onCreate={onCreate} />

      {jobId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Job ID: {jobId}</span>
            <span className="text-sm">{status.status.toUpperCase()}</span>
          </div>
          <ProgressBar value={status.status !== 'done' && status.status !== 'error' ? (status.progress ?? 0) : status.status === 'done' ? 100 : 0} />
        </div>
      )}

      {status.status === 'done' && (
        <div className="space-y-3">
          <img src={status.imageUrl} alt="meme ai" className="w-full rounded border border-neutral-800" />
          <div className="text-sm opacity-80">seed: {status.meta.seed} · steps: {status.meta.steps} · modelo: {status.meta.model}</div>
          <div className="flex gap-3">
            <a href={status.imageUrl} download className="px-3 py-2 rounded bg-white text-black font-semibold">Descargar</a>
            <button 
              onClick={onCreateVideo} 
              disabled={isVideoWorking}
              className="px-3 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVideoWorking ? 'Generando Video...' : 'Generar Video'}
            </button>
            <button onClick={()=>{setJobId(null); setVideoJobId(null);}} className="px-3 py-2 rounded border border-neutral-700">Nuevo</button>
          </div>
        </div>
      )}

      {videoJobId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Video Job ID: {videoJobId}</span>
            <span className="text-sm">{videoStatus.status.toUpperCase()}</span>
          </div>
          <ProgressBar value={videoStatus.status !== 'done' && videoStatus.status !== 'error' ? (videoStatus.progress ?? 0) : videoStatus.status === 'done' ? 100 : 0} />
        </div>
      )}

      {videoStatus.status === 'done' && (
        <div className="space-y-3">
          <video controls className="w-full rounded border border-neutral-800" preload="metadata">
            <source src={videoStatus.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="text-sm opacity-80">frames: {videoStatus.meta.numFrames} · modelo: {videoStatus.meta.model}</div>
          <div className="flex gap-3">
            <a href={videoStatus.videoUrl} download className="px-3 py-2 rounded bg-white text-black font-semibold">Descargar Video</a>
          </div>
        </div>
      )}

      {videoStatus.status === 'error' && (
        <div className="p-3 rounded bg-red-900/30 border border-red-800 text-red-200">
          Error: {videoStatus.message}
        </div>
      )}

      {status.status === 'error' && (
        <div className="p-3 rounded bg-red-900/30 border border-red-800 text-red-200">
          Error: {status.message}
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { createJob } from './api';
import { useJob } from './hooks/useJob';
import { JobStatus } from './types';
import PromptForm from './components/PromptForm';
import ProgressBar from './components/ProgressBar';

export default function App() {
  const [jobId, setJobId] = useState<string | null>(null);
  const status: JobStatus = useJob(jobId ?? undefined);

  const onCreate = async (data: any) => {
    const { jobId } = await createJob(data);
    setJobId(jobId);
  };

  const isWorking = status.status === 'queued' || status.status === 'running';

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
            <button onClick={()=>setJobId(null)} className="px-3 py-2 rounded border border-neutral-700">Nuevo</button>          </div>
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
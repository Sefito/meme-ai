import { useState } from 'react';
import { CreateJob } from '../types';

export default function PromptForm({ onCreate }: { onCreate: (data: CreateJob) => Promise<void> }) {
  const [prompt, setPrompt] = useState('gato programador con gafas, setup de escritorio caótico, estilo foto realista, luz de neón');
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(5.0);
  const [seed, setSeed] = useState<string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({ prompt, steps, guidance, seed: seed ? Number(seed) : undefined });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Prompt</label>
        <textarea className="w-full rounded bg-neutral-900 border border-neutral-800 p-3" rows={3}
          value={prompt} onChange={e => setPrompt(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs mb-1">Steps ({steps})</label>
          <input type="range" min={20} max={60} value={steps} onChange={e=>setSteps(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="block text-xs mb-1">Guidance ({guidance.toFixed(1)})</label>
          <input type="range" min={3} max={9} step={0.1} value={guidance} onChange={e=>setGuidance(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="block text-xs mb-1">Seed (opcional)</label>
          <input type="number" placeholder="aleatoria" value={seed} onChange={e=>setSeed(e.target.value)}
            className="w-full rounded bg-neutral-900 border border-neutral-800 p-2" />
        </div>
      </div>
      <button type="submit" className="px-4 py-2 rounded bg-white text-black font-semibold">Generar</button>
    </form>
  );
}
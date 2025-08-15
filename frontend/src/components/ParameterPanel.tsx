import { ChangeEvent } from 'react';
import { Shuffle, Lock } from 'lucide-react';

interface ParameterPanelProps {
  steps: number;
  setSteps: (value: number) => void;
  guidance: number;
  setGuidance: (value: number) => void;
  seed: string;
  setSeed: (value: string) => void;
  useRandomSeed: boolean;
  setUseRandomSeed: (value: boolean) => void;
  model: string;
  setModel: (value: string) => void;
  aspect: string;
  setAspect: (value: string) => void;
  negative: string;
  setNegative: (value: string) => void;
  className?: string;
}

const MODELS = [
  { value: 'SSD-1B', label: 'SSD-1B' },
  { value: 'SSD-Lite', label: 'SSD-Lite' },
  { value: 'Flux-1', label: 'Flux-1' },
];

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (Cuadrado)' },
  { value: '4:3', label: '4:3 (Clásico)' },
  { value: '16:9', label: '16:9 (Pantalla)' },
  { value: '9:16', label: '9:16 (Vertical)' },
];

export default function ParameterPanel({
  steps, setSteps,
  guidance, setGuidance,
  seed, setSeed,
  useRandomSeed, setUseRandomSeed,
  model, setModel,
  aspect, setAspect,
  negative, setNegative,
  className = ''
}: ParameterPanelProps) {

  const handleSeedToggle = () => {
    setUseRandomSeed(!useRandomSeed);
    if (!useRandomSeed) {
      setSeed('');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold">Parámetros</h3>

      {/* Steps */}
      <div className="space-y-2">
        <label htmlFor="steps" className="block text-sm font-medium">
          Steps: {steps}
        </label>
        <input
          id="steps"
          type="range"
          min={1}
          max={50}
          value={steps}
          onChange={(e) => setSteps(Number(e.target.value))}
          className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer range-thumb"
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>1</span>
          <span>50</span>
        </div>
      </div>

      {/* Guidance */}
      <div className="space-y-2">
        <label htmlFor="guidance" className="block text-sm font-medium">
          Guidance: {guidance.toFixed(1)}
        </label>
        <input
          id="guidance"
          type="range"
          min={1}
          max={10}
          step={0.1}
          value={guidance}
          onChange={(e) => setGuidance(Number(e.target.value))}
          className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>1.0</span>
          <span>10.0</span>
        </div>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label htmlFor="model" className="block text-sm font-medium">
          Modelo
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {MODELS.map(m => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <label htmlFor="aspect" className="block text-sm font-medium">
          Proporción
        </label>
        <select
          id="aspect"
          value={aspect}
          onChange={(e) => setAspect(e.target.value)}
          className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {ASPECT_RATIOS.map(ar => (
            <option key={ar.value} value={ar.value}>
              {ar.label}
            </option>
          ))}
        </select>
      </div>

      {/* Seed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="seed" className="block text-sm font-medium">
            Seed
          </label>
          <button
            type="button"
            onClick={handleSeedToggle}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            {useRandomSeed ? <Shuffle size={12} /> : <Lock size={12} />}
            {useRandomSeed ? 'Aleatoria' : 'Fija'}
          </button>
        </div>
        <input
          id="seed"
          type="number"
          placeholder={useRandomSeed ? "Se generará automáticamente" : "Introduce un número"}
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          disabled={useRandomSeed}
          className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Negative Prompt */}
      <div className="space-y-2">
        <label htmlFor="negative" className="block text-sm font-medium">
          Prompt negativo (opcional)
        </label>
        <textarea
          id="negative"
          placeholder="Elementos que no quieres en la imagen..."
          value={negative}
          onChange={(e) => setNegative(e.target.value)}
          rows={3}
          className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}
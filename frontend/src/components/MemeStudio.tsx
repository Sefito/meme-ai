import { useState, useEffect } from 'react';
import { Download, Video, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createJob, createVideoJob } from '../api';
import { useJob, useVideoJob } from '../hooks/useJob';
import { JobStatus, VideoJobStatus, HistoryItem, CreateJob } from '../types';

import ImageUpload from './ImageUpload';
import MemePreview from './MemePreview';
import ParameterPanel from './ParameterPanel';
import HistoryPanel from './HistoryPanel';
import ProgressBar from './ProgressBar';
import ThemeToggle from './ThemeToggle';
import ChatInterface from './ChatInterface';

export default function MemeStudio() {
  // Job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const status: JobStatus = useJob(jobId ?? undefined);
  const videoStatus: VideoJobStatus = useVideoJob(videoJobId ?? undefined);

  // Form state - keeping prompt for backward compatibility
  const [prompt, setPrompt] = useState('gato programador con gafas, setup de escritorio caótico, estilo foto realista, luz de neón');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  // Chat state
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [useChatMode, setUseChatMode] = useState(false);
  
  // Parameters
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(5.0);
  const [seed, setSeed] = useState('');
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [model, setModel] = useState('SSD-1B');
  const [aspect, setAspect] = useState('1:1');
  const [negative, setNegative] = useState('');

  // UI state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('meme-history');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert timestamp strings back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    }
    return [];
  });

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('meme-history', JSON.stringify(history));
  }, [history]);

  // Add completed jobs to history
  useEffect(() => {
    if (status.status === 'done' && jobId) {
      const existingIndex = history.findIndex(item => item.id === jobId);
      if (existingIndex === -1) {
        const newItem: HistoryItem = {
          id: jobId,
          imageUrl: status.imageUrl,
          prompt,
          timestamp: new Date(),
          meta: status.meta
        };
        
        setHistory(prev => {
          const newHistory = [newItem, ...prev];
          return newHistory.slice(0, 24); // Keep max 24 items
        });
      }
    }
  }, [status, jobId, prompt, history]);

  const isWorking = jobId && (status.status === 'queued' || status.status === 'running');
  const isVideoWorking = videoJobId && (videoStatus.status === 'running' || isWorking);

  const handleGenerate = async (e: React.FormEvent, sessionIdOverride?: string) => {
    e.preventDefault();
    
    // Determine which mode we're using
    const effectiveSessionId = sessionIdOverride || chatSessionId;
    const effectivePrompt = prompt.trim();
    
    // Validation: need either prompt or chat session
    if (!effectivePrompt && !effectiveSessionId) {
      toast.error('Por favor, escribe un prompt o mantén una conversación');
      return;
    }

    try {
      const jobData: CreateJob = {
        prompt: effectivePrompt || undefined,
        session_id: effectiveSessionId || undefined,
        steps,
        guidance,
        seed: useRandomSeed ? undefined : (seed ? Number(seed) : undefined),
        model,
        aspect,
        negative: negative.trim() || undefined,
        image: selectedImage || undefined,
        top_text: topText.trim() || undefined,
        bottom_text: bottomText.trim() || undefined,
      };

      const { jobId: newJobId } = await createJob(jobData);
      setJobId(newJobId);
      setVideoJobId(null); // Reset video job
      toast.success('Generación iniciada');
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Error al crear el trabajo');
    }
  };

  const handleCreateVideo = async () => {
    if (status.status === 'done' && status.imageUrl) {
      try {
        const { jobId: newVideoJobId } = await createVideoJob({ imageUrl: status.imageUrl });
        setVideoJobId(newVideoJobId);
        toast.success('Generación de video iniciada');
      } catch (error) {
        console.error('Error creating video job:', error);
        toast.error('Error al crear el video');
      }
    }
  };

  const handleNew = () => {
    setJobId(null);
    setVideoJobId(null);
    // Keep form values but clear results
    toast.success('Nueva generación lista');
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setPrompt(item.prompt);
    // Optionally restore other parameters from meta if available
    setIsHistoryOpen(false);
    toast.success('Configuración cargada desde historial');
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleChatSessionChange = (sessionId: string) => {
    setChatSessionId(sessionId);
  };

  const handleChatGenerateReady = (sessionId: string) => {
    // User wants to generate meme from chat conversation
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    handleGenerate(syntheticEvent, sessionId);
  };

  const handleModeToggle = () => {
    setUseChatMode(!useChatMode);
    if (!useChatMode) {
      // Switching to chat mode
      setChatSessionId(null);
      toast.success('Modo chat activado');
    } else {
      // Switching to prompt mode
      toast.success('Modo prompt activado');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
      {/* History Panel */}
      <HistoryPanel
        history={history}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
        onClear={handleClearHistory}
        onSelect={handleHistorySelect}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Meme AI Studio</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a 
              href="http://localhost:8000/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              API Docs
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Left Panel: Prompt + Image Upload */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Mode Toggle */}
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !useChatMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Prompt directo
                  </button>
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      useChatMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Chat conversacional
                  </button>
                </div>
              </div>

              {/* Prompt or Chat Interface */}
              {useChatMode ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Conversación sobre tu meme
                  </label>
                  <ChatInterface
                    sessionId={chatSessionId || undefined}
                    onSessionChange={handleChatSessionChange}
                    onGenerateReady={handleChatGenerateReady}
                    disabled={isWorking}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="prompt" className="block text-sm font-medium">
                    Prompt
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe la imagen que quieres generar..."
                    rows={4}
                    className="w-full p-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required={!useChatMode}
                  />
                </div>
              )}

              {/* Meme Text */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="topText" className="block text-sm font-medium">
                    Texto superior
                  </label>
                  <input
                    id="topText"
                    type="text"
                    value={topText}
                    onChange={(e) => setTopText(e.target.value)}
                    placeholder="Texto arriba"
                    className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="bottomText" className="block text-sm font-medium">
                    Texto inferior
                  </label>
                  <input
                    id="bottomText"
                    type="text"
                    value={bottomText}
                    onChange={(e) => setBottomText(e.target.value)}
                    placeholder="Texto abajo"
                    className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <ImageUpload
                onImageSelect={setSelectedImage}
                selectedImage={selectedImage}
              />
            </form>
          </div>

          {/* Center Panel: Preview */}
          <div className="lg:col-span-2">
            <MemePreview
              selectedImage={selectedImage}
              topText={topText}
              bottomText={bottomText}
              status={status}
            />
          </div>

          {/* Right Panel: Parameters */}
          <div className="lg:col-span-1">
            <ParameterPanel
              steps={steps}
              setSteps={setSteps}
              guidance={guidance}
              setGuidance={setGuidance}
              seed={seed}
              setSeed={setSeed}
              useRandomSeed={useRandomSeed}
              setUseRandomSeed={setUseRandomSeed}
              model={model}
              setModel={setModel}
              aspect={aspect}
              setAspect={setAspect}
              negative={negative}
              setNegative={setNegative}
            />
          </div>
        </div>

        {/* Error States */}
        {status.status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            <strong>Error: </strong>{status.message}
          </div>
        )}

        {videoStatus.status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            <strong>Error de video: </strong>{videoStatus.message}
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4 shadow-lg">
        <div className="container mx-auto">
          {/* Progress Bars */}
          {jobId && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                <span>Generando imagen... {status.progress ? Math.round(status.progress) : 0}%</span>
                <span className="uppercase font-medium">{status.status}</span>
              </div>
              <ProgressBar value={status.status !== 'done' && status.status !== 'error' ? (status.progress ?? 0) : status.status === 'done' ? 100 : 0} />
            </div>
          )}

          {videoJobId && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                <span>Generando video... {videoStatus.progress ? Math.round(videoStatus.progress) : 0}%</span>
                <span className="uppercase font-medium">{videoStatus.status}</span>
              </div>
              <ProgressBar value={videoStatus.status !== 'done' && videoStatus.status !== 'error' ? (videoStatus.progress ?? 0) : videoStatus.status === 'done' ? 100 : 0} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 justify-center">
            <button
              onClick={(e) => {
                // In chat mode, we only allow generation if there's an active session
                if (useChatMode && !chatSessionId) {
                  toast.error('Primero mantén una conversación para generar un meme');
                  return;
                }
                handleGenerate(e);
              }}
              disabled={isWorking || (useChatMode && !chatSessionId)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isWorking ? <Loader2 size={20} className="animate-spin" /> : null}
              Generar
            </button>

            {status.status === 'done' && (
              <>
                <a
                  href={status.imageUrl}
                  download
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Download size={20} />
                  Descargar
                </a>

                <button
                  onClick={handleCreateVideo}
                  disabled={isVideoWorking}
                  className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isVideoWorking ? <Loader2 size={20} className="animate-spin" /> : <Video size={20} />}
                  {isVideoWorking ? 'Generando...' : 'Crear Video'}
                </button>
              </>
            )}

            {videoStatus.status === 'done' && (
              <a
                href={videoStatus.videoUrl}
                download
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Download size={20} />
                Descargar Video
              </a>
            )}

            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-3 bg-neutral-600 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-colors"
            >
              <RotateCcw size={20} />
              Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Bottom padding to account for sticky bar */}
      <div className="h-32"></div>
    </div>
  );
}
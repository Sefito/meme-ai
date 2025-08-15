export type CreateJob = { 
  prompt: string; 
  seed?: number; 
  negative?: string; 
  steps?: number; 
  guidance?: number;
  model?: string;
  aspect?: string;
  image?: File;
  top_text?: string;
  bottom_text?: string;
};
export type CreateVideoJob = { imageUrl: string; numFrames?: number };
export type JobQueued = { status: 'queued' | 'running'; progress?: number };
export type JobDone = { status: 'done'; imageUrl: string; meta: { seed: number; steps: number; model: string; prompt: string; top?: string; bottom?: string } };
export type VideoJobDone = { status: 'done'; videoUrl: string; meta: { numFrames: number; model: string; sourceImage: string } };
export type JobError = { status: 'error'; message: string };
export type JobStatus = JobQueued | JobDone | JobError;
export type VideoJobStatus = JobQueued | VideoJobDone | JobError;

// Additional types for UI state management
export type HistoryItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
  meta: JobDone['meta'];
};

export type Theme = 'light' | 'dark';
export type CreateJob = { 
  prompt?: string;  // Make prompt optional since we might use chat session instead
  session_id?: string;  // Chat session ID for conversational meme generation
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

// Chat-related types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  role: string;
  timestamp: string;
  session_id: string;
}

export interface ChatSession {
  session_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}
export type CreateJob = { prompt: string; seed?: number; negative?: string; steps?: number; guidance?: number };
export type JobQueued = { status: 'queued' | 'running'; progress?: number };
export type JobDone = { status: 'done'; imageUrl: string; meta: { seed: number; steps: number; model: string; prompt: string; top?: string; bottom?: string } };
export type JobError = { status: 'error'; message: string };
export type JobStatus = JobQueued | JobDone | JobError;
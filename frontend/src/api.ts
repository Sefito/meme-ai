import { CreateJob, CreateVideoJob, JobStatus, VideoJobStatus } from './types';

export async function createJob(data: CreateJob): Promise<{ jobId: string }> {
  // If there's an image file, use FormData for multipart upload
  if (data.image) {
    const formData = new FormData();
    formData.append('prompt', data.prompt);
    if (data.seed !== undefined) formData.append('seed', data.seed.toString());
    if (data.negative) formData.append('negative_prompt', data.negative);
    if (data.steps) formData.append('steps', data.steps.toString());
    if (data.guidance) formData.append('guidance', data.guidance.toString());
    if (data.model) formData.append('model', data.model);
    if (data.aspect) formData.append('aspect', data.aspect);
    if (data.top_text) formData.append('top_text', data.top_text);
    if (data.bottom_text) formData.append('bottom_text', data.bottom_text);
    formData.append('image', data.image);

    const r = await fetch('/api/jobs', {
      method: 'POST',
      body: formData
    });
    if (!r.ok) throw new Error('No se pudo crear el job');
    return r.json();
  } else {
    // Fallback to JSON for backward compatibility
    const r = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('No se pudo crear el job');
    return r.json();
  }
}

export async function createVideoJob(data: CreateVideoJob): Promise<{ jobId: string }> {
  const r = await fetch('/api/video-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error('No se pudo crear el video job');
  return r.json();
}

export async function getJob(id: string): Promise<JobStatus> {
  const r = await fetch(`/api/jobs/${id}`);
  if (!r.ok) throw new Error('Error obteniendo el job');
  return r.json();
}

export async function getVideoJob(id: string): Promise<VideoJobStatus> {
  const r = await fetch(`/api/video-jobs/${id}`);
  if (!r.ok) throw new Error('Error obteniendo el video job');
  return r.json();
}
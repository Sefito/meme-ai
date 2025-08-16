import { CreateJob, CreateVideoJob, JobStatus, VideoJobStatus, ChatResponse, ChatSession } from './types';

export async function createJob(data: CreateJob): Promise<{ jobId: string }> {
  // If there's an image file, use FormData for multipart upload
  if (data.image) {
    const formData = new FormData();
    if (data.prompt) formData.append('prompt', data.prompt);
    if (data.session_id) formData.append('session_id', data.session_id);
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

// Chat API functions
export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: message,
      session_id: sessionId
    })
  });
  if (!r.ok) throw new Error('No se pudo enviar el mensaje');
  return r.json();
}

export async function getChatHistory(sessionId: string): Promise<ChatSession> {
  const r = await fetch(`/api/chat/${sessionId}`);
  if (!r.ok) throw new Error('Error obteniendo historial de chat');
  return r.json();
}
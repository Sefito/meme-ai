import { CreateJob, JobStatus } from './types';

export async function createJob(data: CreateJob): Promise<{ jobId: string }> {
  const r = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error('No se pudo crear el job');
  return r.json();
}

export async function getJob(id: string): Promise<JobStatus> {
  const r = await fetch(`/api/jobs/${id}`);
  if (!r.ok) throw new Error('Error obteniendo el job');
  return r.json();
}
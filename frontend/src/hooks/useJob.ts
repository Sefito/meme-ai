import { useEffect, useRef, useState } from 'react';
import { JobStatus, VideoJobStatus } from '../types';
import { getJob, getVideoJob } from '../api';

export function useJob(jobId?: string, intervalMs = 800) {
  const [status, setStatus] = useState<JobStatus>({ status: 'queued' });
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const poll = async () => {
      try { setStatus(await getJob(jobId)); } catch (e) { /* ignore */ }
    };
    poll();
    timer.current = window.setInterval(poll, intervalMs);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [jobId, intervalMs]);

  return status;
}

export function useVideoJob(jobId?: string, intervalMs = 1000) {
  const [status, setStatus] = useState<VideoJobStatus>({ status: 'queued' });
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const poll = async () => {
      try { setStatus(await getVideoJob(jobId)); } catch (e) { /* ignore */ }
    };
    poll();
    timer.current = window.setInterval(poll, intervalMs);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [jobId, intervalMs]);

  return status;
}
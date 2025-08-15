import { useEffect, useRef, useState } from 'react';
import { JobStatus, VideoJobStatus } from '../types';
import { getJob, getVideoJob } from '../api';
import { useWebSocketJob, useWebSocketVideoJob } from './useWebSocketJob';

// Enhanced job hook that uses WebSocket with polling fallback
export function useJob(jobId?: string, intervalMs = 800) {
  const [useWebSocket, setUseWebSocket] = useState(true);
  const { status: wsStatus, isConnected } = useWebSocketJob(jobId);
  
  // Polling fallback
  const [pollingStatus, setPollingStatus] = useState<JobStatus>({ status: 'queued' });
  const timer = useRef<number | null>(null);

  // Polling logic (fallback)
  useEffect(() => {
    if (useWebSocket || !jobId) {
      // Clear polling if we're using WebSocket
      if (timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
      return;
    }

    // Start polling as fallback
    const poll = async () => {
      try { 
        setPollingStatus(await getJob(jobId)); 
      } catch (e) { 
        console.error('Polling error:', e);
      }
    };
    
    poll();
    timer.current = window.setInterval(poll, intervalMs);
    
    return () => { 
      if (timer.current) {
        window.clearInterval(timer.current); 
        timer.current = null;
      }
    };
  }, [jobId, intervalMs, useWebSocket]);

  // Fall back to polling after WebSocket connection issues
  useEffect(() => {
    if (jobId && !isConnected && wsStatus.status !== 'done' && wsStatus.status !== 'error') {
      // If WebSocket is not connected and job is not complete, use polling fallback
      const fallbackTimer = setTimeout(() => {
        console.log('WebSocket connection failed, falling back to polling for job:', jobId);
        setUseWebSocket(false);
      }, 5000); // Wait 5 seconds before falling back

      return () => clearTimeout(fallbackTimer);
    }
  }, [jobId, isConnected, wsStatus.status]);

  // Return WebSocket status if connected, otherwise return polling status
  return useWebSocket && isConnected ? wsStatus : pollingStatus;
}

// Enhanced video job hook that uses WebSocket with polling fallback
export function useVideoJob(jobId?: string, intervalMs = 1000) {
  const [useWebSocket, setUseWebSocket] = useState(true);
  const { status: wsStatus, isConnected } = useWebSocketVideoJob(jobId);
  
  // Polling fallback
  const [pollingStatus, setPollingStatus] = useState<VideoJobStatus>({ status: 'queued' });
  const timer = useRef<number | null>(null);

  // Polling logic (fallback)
  useEffect(() => {
    if (useWebSocket || !jobId) {
      // Clear polling if we're using WebSocket
      if (timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
      return;
    }

    // Start polling as fallback
    const poll = async () => {
      try { 
        setPollingStatus(await getVideoJob(jobId)); 
      } catch (e) { 
        console.error('Polling error:', e);
      }
    };
    
    poll();
    timer.current = window.setInterval(poll, intervalMs);
    
    return () => { 
      if (timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [jobId, intervalMs, useWebSocket]);

  // Fall back to polling after WebSocket connection issues
  useEffect(() => {
    if (jobId && !isConnected && wsStatus.status !== 'done' && wsStatus.status !== 'error') {
      // If WebSocket is not connected and job is not complete, use polling fallback
      const fallbackTimer = setTimeout(() => {
        console.log('WebSocket connection failed, falling back to polling for video job:', jobId);
        setUseWebSocket(false);
      }, 5000); // Wait 5 seconds before falling back

      return () => clearTimeout(fallbackTimer);
    }
  }, [jobId, isConnected, wsStatus.status]);

  // Return WebSocket status if connected, otherwise return polling status
  return useWebSocket && isConnected ? wsStatus : pollingStatus;
}
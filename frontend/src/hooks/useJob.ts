import { useWebSocketJob, useWebSocketVideoJob } from './useWebSocketJob';

// Enhanced job hook that uses WebSocket with polling fallback
export function useJob(jobId?: string) {
  const { status: wsStatus } = useWebSocketJob(jobId);

  return wsStatus
}

// Enhanced video job hook that uses WebSocket with polling fallback
export function useVideoJob(jobId?: string) {
  const { status: wsStatus } = useWebSocketVideoJob(jobId);



  // Return WebSocket status if connected, otherwise return polling status
  return wsStatus
}
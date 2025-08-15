import { useEffect, useRef, useState, useCallback } from 'react';
import { JobStatus, VideoJobStatus } from '../types';
import { getJob, getVideoJob } from '../api';

// WebSocket hook for job updates
export function useWebSocketJob(jobId?: string) {
  const [status, setStatus] = useState<JobStatus>({ status: 'queued' });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((jobId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Use proxy path for WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${jobId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for job:', jobId);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            // Handle keepalive pong
            return;
          }
          // Update job status with real-time data
          setStatus(data);
          
          // If job is complete, don't reconnect if connection drops
          if (data.status === 'done') {
            ws.close();
            wsRef.current = null;
            setIsConnected(false);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected for job:', jobId, 'Code:', event.code);
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        wsRef.current?.close();
        wsRef.current = null;
        setIsConnected(false);
      };

      wsRef.current = ws;

      // Send periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!jobId) {
      disconnect();
      return;
    }

    // Disconnect any existing connection first
    disconnect();

    // Get initial status via REST API, then connect WebSocket for updates
    const fetchInitialStatus = async () => {
      try {
        const initialStatus = await getJob(jobId);
        setStatus(initialStatus);
        
        // Only connect WebSocket if job is not complete
        if (initialStatus.status !== 'done' && initialStatus.status !== 'error') {
          connect(jobId);
        }
      } catch (error) {
        console.error('Error fetching initial job status:', error);
      }
    };

    fetchInitialStatus();

    return () => {
      disconnect();
    };
  }, [jobId]);

  // Close WebSocket when component unmounts
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { status, isConnected };
}

// WebSocket hook for video job updates
export function useWebSocketVideoJob(jobId?: string) {
  const [status, setStatus] = useState<VideoJobStatus>({ status: 'queued' });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);


  const connect = useCallback((jobId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    try {
      // Use proxy path for WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${jobId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for video job:', jobId);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            // Handle keepalive pong
            return;
          }
          // Update job status with real-time data
          setStatus(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected for video job:', jobId, 'Code:', event.code);
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current = ws;

      // Send periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!jobId) {
      disconnect();
      return;
    }

    // Disconnect any existing connection first
    disconnect();

    // Get initial status via REST API, then connect WebSocket for updates
    const fetchInitialStatus = async () => {
      try {
        const initialStatus = await getVideoJob(jobId);
        setStatus(initialStatus);
        
        // Only connect WebSocket if job is not complete
        if (initialStatus.status !== 'done' && initialStatus.status !== 'error') {
          connect(jobId);
        }
      } catch (error) {
        console.error('Error fetching initial video job status:', error);
      }
    };

    fetchInitialStatus();

    return () => {
      disconnect();
    };
  }, [jobId]);

  // Close WebSocket when component unmounts
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { status, isConnected };
}

// Export the old polling hooks for backward compatibility/fallback
export { useJob as usePollingJob, useVideoJob as usePollingVideoJob } from './useJob';
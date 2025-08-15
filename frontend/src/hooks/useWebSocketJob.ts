import { useEffect, useRef, useState, useCallback } from 'react';
import { JobStatus, VideoJobStatus } from '../types';
import { getJob, getVideoJob } from '../api';

// WebSocket hook for job updates
export function useWebSocketJob(jobId?: string) {
  const [status, setStatus] = useState<JobStatus>({ status: 'queued' });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback((jobId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${jobId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for job:', jobId);
        setIsConnected(true);
        setReconnectAttempts(0);
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

      ws.onclose = () => {
        console.log('WebSocket disconnected for job:', jobId);
        setIsConnected(false);
        
        // Attempt to reconnect if not intentionally closed
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect(jobId);
          }, delay);
        } else {
          console.log('Max reconnection attempts reached, falling back to polling');
          // TODO: Implement fallback to polling
        }
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
  }, [reconnectAttempts, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setReconnectAttempts(0);
  }, []);

  useEffect(() => {
    if (!jobId) {
      disconnect();
      return;
    }

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
        // Still try to connect WebSocket
        connect(jobId);
      }
    };

    fetchInitialStatus();

    return () => {
      disconnect();
    };
  }, [jobId, connect, disconnect]);

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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback((jobId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${jobId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for video job:', jobId);
        setIsConnected(true);
        setReconnectAttempts(0);
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

      ws.onclose = () => {
        console.log('WebSocket disconnected for video job:', jobId);
        setIsConnected(false);
        
        // Attempt to reconnect if not intentionally closed
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect(jobId);
          }, delay);
        } else {
          console.log('Max reconnection attempts reached, falling back to polling');
          // TODO: Implement fallback to polling
        }
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
  }, [reconnectAttempts, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setReconnectAttempts(0);
  }, []);

  useEffect(() => {
    if (!jobId) {
      disconnect();
      return;
    }

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
        // Still try to connect WebSocket
        connect(jobId);
      }
    };

    fetchInitialStatus();

    return () => {
      disconnect();
    };
  }, [jobId, connect, disconnect]);

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
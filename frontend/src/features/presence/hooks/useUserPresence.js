import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchUserPresence } from '../api/presenceApi';
import { BASE_URL } from '../../../shared/api/client';

function getWebSocketUrl(path) {
  let base = BASE_URL;
  if (!base || base.startsWith('/')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${path}`;
  }
  return base.replace(/^http/, 'ws') + path;
}

/**
 * Custom hook to subscribe to a user's live presence state in real time via WebSocket.
 * @param {string} userId - Target user ID to monitor
 */
export function useUserPresence(userId) {
  const [presence, setPresence] = useState({
    user_id: userId,
    status: 'offline',
    current_activity: null,
    current_resource: null,
    freshness: 'Loading...',
    is_stale: false,
    last_confirmed_at: null
  });
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initial HTTP fetch
  const fetchInitial = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchUserPresence(userId);
      if (data) {
        setPresence(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchInitial();

    let isMounted = true;

    function connectWs() {
      if (!isMounted) return;

      const wsUrl = getWebSocketUrl(`/api/state/ws/user/${encodeURIComponent(userId)}`);
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Socket connected
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'presence_update' && data.state) {
              setPresence(data.state);
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          ws.close();
        };

        ws.onclose = () => {
          if (isMounted) {
            // Reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(connectWs, 5000);
          }
        };
      } catch {
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connectWs, 5000);
        }
      }
    }

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId, fetchInitial]);

  return {
    presence,
    isOnline: presence.status === 'active',
    isIdle: presence.status === 'idle',
    isOffline: presence.status === 'offline',
    status: presence.status,
    activity: presence.current_activity,
    freshness: presence.freshness,
    loading
  };
}

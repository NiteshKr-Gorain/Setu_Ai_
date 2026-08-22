import { useEffect, useRef, useCallback } from 'react';
import { sendHeartbeat } from '../api/presenceApi';
import { getAccessToken } from '../../../shared/api/client';
import { BASE_URL } from '../../../shared/api/client';

// Generate or retrieve persistent tab session identifier
function getTabSessionId() {
  let sid = sessionStorage.getItem('setu_tab_session_id');
  if (!sid) {
    sid = 'tab_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
    sessionStorage.setItem('setu_tab_session_id', sid);
  }
  return sid;
}

/**
 * Custom hook to run periodic backend-confirmed heartbeats (every 20s) with:
 *   1. Page Visibility API support (pauses when tab is hidden, resumes when foregrounded)
 *   2. Inactivity detection (transitions active -> idle after 45s without input)
 *   3. Modern beacon unload ping when closing tab
 *
 * @param {Object} options
 * @param {boolean} [options.isAuthenticated=false] - Whether user is signed in
 * @param {string} [options.currentActivity] - e.g. 'reading_passport', 'browsing_library'
 * @param {string} [options.currentResource] - e.g. article ID or title
 * @param {number} [options.intervalMs=20000] - Heartbeat frequency (default: 20s)
 */
export function useHeartbeat({
  isAuthenticated = false,
  currentActivity = 'browsing',
  currentResource = null,
  intervalMs = 20000
} = {}) {
  const sessionIdRef = useRef(getTabSessionId());
  const lastInteractionRef = useRef(Date.now());
  const activityRef = useRef(currentActivity);
  const resourceRef = useRef(currentResource);

  activityRef.current = currentActivity;
  resourceRef.current = currentResource;

  // Track user activity to determine active vs idle status
  useEffect(() => {
    const handleUserAction = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserAction, { passive: true });
    window.addEventListener('keydown', handleUserAction, { passive: true });
    window.addEventListener('touchstart', handleUserAction, { passive: true });
    window.addEventListener('scroll', handleUserAction, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleUserAction);
      window.removeEventListener('keydown', handleUserAction);
      window.removeEventListener('touchstart', handleUserAction);
      window.removeEventListener('scroll', handleUserAction);
    };
  }, []);

  const dispatchHeartbeat = useCallback(async (forcedStatus = null) => {
    if (!isAuthenticated) return;
    const token = getAccessToken();
    if (!token) return;

    const idleTime = Date.now() - lastInteractionRef.current;
    const status = forcedStatus || (idleTime > 45000 ? 'idle' : 'active');

    try {
      await sendHeartbeat({
        status,
        current_activity: activityRef.current,
        current_resource: resourceRef.current,
        session_id: sessionIdRef.current
      });
    } catch {
      // Silently catch transient network issues during heartbeat
    }
  }, [isAuthenticated]);

  // Periodic heartbeat timer with Page Visibility API pausing
  useEffect(() => {
    if (!isAuthenticated) return;

    let intervalId = null;

    const startPinging = () => {
      if (intervalId) clearInterval(intervalId);
      dispatchHeartbeat();
      intervalId = setInterval(() => {
        dispatchHeartbeat();
      }, intervalMs);
    };

    const stopPinging = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Page Visibility API handler: Pause when browser tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        stopPinging();
      } else {
        startPinging();
      }
    };

    // Start initially if tab is in the foreground
    if (!document.hidden && document.visibilityState !== 'hidden') {
      startPinging();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Send offline heartbeat when closing window/tab
    const handleBeforeUnload = () => {
      const token = getAccessToken();
      if (!token) return;

      const url = `${BASE_URL}/api/state/heartbeat`;
      const payload = JSON.stringify({
        status: 'offline',
        session_id: sessionIdRef.current
      });

      // Use modern fetch with keepalive for reliable unload beacon
      try {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: payload,
          keepalive: true
        }).catch(() => {});
      } catch {
        // Ignore fallback
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopPinging();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated, intervalMs, dispatchHeartbeat]);

  return { sessionId: sessionIdRef.current };
}

export default useHeartbeat;

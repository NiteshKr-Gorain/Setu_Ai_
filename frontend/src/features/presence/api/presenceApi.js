import { api } from '../../../shared/api/client';

/**
 * Sends a backend-confirmed presence heartbeat.
 * @param {Object} params
 * @param {string} [params.status='active'] - 'active' | 'idle' | 'offline'
 * @param {string} [params.current_activity] - e.g. 'reading_passport', 'browsing_library'
 * @param {string} [params.current_resource] - e.g. article ID or title
 * @param {string} [params.session_id] - Unique client tab / session ID
 */
export async function sendHeartbeat({ status = 'active', current_activity, current_resource, session_id } = {}) {
  const payload = {
    status,
    current_activity: current_activity || undefined,
    current_resource: current_resource || undefined,
    session_id: session_id || undefined
  };
  const data = await api.post('/api/state/heartbeat', payload);
  return data;
}

/**
 * Fetches the resolved presence state for a specific user.
 * @param {string} userId
 */
export async function fetchUserPresence(userId) {
  if (!userId) return null;
  const data = await api.get(`/api/state/${encodeURIComponent(userId)}`);
  return data;
}

/**
 * Fetches list of all currently active/idle users.
 * @param {number} [limit=50]
 */
export async function fetchActiveUsers(limit = 50) {
  const data = await api.get(`/api/state/active/list?limit=${limit}`);
  return data;
}

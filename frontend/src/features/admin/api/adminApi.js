import { api } from '../../../shared/api/client';

/**
 * Fetches platform summary overview KPIs, queue sizes, and recent activity.
 */
export async function fetchAdminOverview() {
  const data = await api.get('/api/admin/overview');
  return data;
}

/**
 * Fetches list of knowledge submissions for moderation.
 * @param {Object} params - { status, category, search, skip, limit }
 */
export async function fetchAdminKnowledge(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.category && params.category !== 'All') query.append('category', params.category);
  if (params.search) query.append('search', params.search);
  if (params.skip) query.append('skip', params.skip);
  if (params.limit) query.append('limit', params.limit);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const data = await api.get(`/api/admin/knowledge${qs}`);
  return data;
}

/**
 * Updates moderation status of a knowledge post (approve/reject/draft).
 * @param {string} id - Knowledge Entry ObjectId string
 * @param {string} status - 'completed' | 'draft' | 'rejected' | 'failed'
 * @param {string} [moderationNote] - Moderator review feedback
 * @param {number} [trustScore] - Optional trust score
 */
export async function updateKnowledgeStatus(id, status, moderationNote = null, trustScore = null) {
  const payload = { status };
  if (moderationNote !== null) payload.moderation_note = moderationNote;
  if (trustScore !== null) payload.trust_score = trustScore;

  const data = await api.put(`/api/admin/knowledge/${encodeURIComponent(id)}/status`, payload);
  return data;
}

/**
 * Fast-track verifies a knowledge entry (100% trust, stamps Passport ID & publishes).
 * @param {string} id - Knowledge Entry ObjectId string
 */
export async function fastVerifyKnowledge(id) {
  const data = await api.post(`/api/admin/knowledge/${encodeURIComponent(id)}/fast-verify`, {});
  return data;
}

/**
 * Permanently deletes / takes down a knowledge entry.
 * @param {string} id - Knowledge Entry ObjectId string
 */
export async function deleteAdminKnowledge(id) {
  const data = await api.delete(`/api/admin/knowledge/${encodeURIComponent(id)}`);
  return data;
}

/**
 * Fetches user accounts with permission states (can_post, can_create_community, RFID).
 * @param {Object} params - { search, role, skip, limit }
 */
export async function fetchAdminUsers(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.role && params.role !== 'all') query.append('role', params.role);
  if (params.skip) query.append('skip', params.skip);
  if (params.limit) query.append('limit', params.limit);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const data = await api.get(`/api/admin/users${qs}`);
  return data;
}

/**
 * Updates user permissions (can_post, can_create_community, is_active, role).
 * @param {string} userId - User ObjectId string
 * @param {Object} permissions - { can_post, can_create_community, is_active, role, preferred_language }
 */
export async function updateUserPermissions(userId, permissions = {}) {
  const data = await api.put(`/api/admin/users/${encodeURIComponent(userId)}/permissions`, permissions);
  return data;
}

/**
 * Fetches all community hubs for admin governance.
 */
export async function fetchAdminCommunities() {
  const data = await api.get('/api/admin/communities');
  return data;
}

/**
 * Toggles featured status on a community.
 * @param {string} id - Community ObjectId
 * @param {boolean} featured - true | false
 */
export async function toggleFeatureCommunity(id, featured = true) {
  const data = await api.put(`/api/admin/communities/${encodeURIComponent(id)}/feature?featured=${featured}`, {});
  return data;
}

/**
 * Fetches comprehensive OpenRouter AI cost control telemetry and budget utilization.
 * @param {string} [month] - Optional target month in 'YYYY-MM' format.
 */
export async function fetchAiUsageStats(month = null) {
  const queryStr = month ? `?month=${encodeURIComponent(month)}` : '';
  const data = await api.get(`/api/admin/ai-usage${queryStr}`);
  return data;
}

/**
 * Clears the in-memory AI query cache.
 */
export async function clearAiQueryCache() {
  const data = await api.post('/api/ai/cache/clear', {});
  return data;
}

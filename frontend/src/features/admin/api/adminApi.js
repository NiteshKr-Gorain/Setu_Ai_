import { api } from '../../../shared/api/client';

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

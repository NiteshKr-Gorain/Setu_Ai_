import { apiClient } from '../../../shared/api/client';

export const CATEGORIES = [
  'Agriculture',
  'Health',
  'Traditional Skills',
  'Recipes',
  'Technology',
];

export const CONTENT_TYPES = ['text', 'voice', 'video', 'document'];

/**
  Normalizes a raw backend KnowledgeEntry into the UI format expected by
  the Library cards, search filters, and detail modals.
 */
export function normalizeEntry(entry) {
  if (!entry) return null;

  const contentTypeMap = {
    text: 'Article',
    voice: 'Audio',
    video: 'Video',
    document: 'PDF',
  };

  const formattedType = contentTypeMap[entry.content_type] || 'Article';
  const contributor = entry.author_name || (entry.author ? entry.author.name : 'Community Elder');
  const readTime = entry.content_type === 'text' ? '4 min read' : entry.content_type === 'voice' ? '5 min audio' : '8 min video';

  return {
    id: entry.id,
    title: entry.title,
    category: entry.category || 'Traditional Skills',
    contributor,
    description: entry.description || entry.summary || '',
    summary: entry.summary || entry.description || '',
    traditionalMethod: entry.traditional_method || entry.description || 'Traditional practice documented by community members.',
    scientificExplanation: entry.scientific_explanation || 'Verified through community review and literature benchmarking.',
    benefits: entry.benefits || 'Preserves heritage and promotes natural living.',
    precautions: entry.precautions || null,
    contentType: formattedType,
    rawContentType: entry.content_type || 'text',
    status: entry.status || 'completed',
    mediaUrl: entry.media_url || entry.file_path || null,
    transcription: entry.transcription || null,
    source: 'api',
    readTime,
    likes: entry.likes_count || 0,
    created_at: entry.created_at,
  };
}

export async function fetchKnowledgeEntries(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'All') queryParams.append('category', params.category);
  if (params.contentType && params.contentType !== 'All') queryParams.append('content_type', params.contentType.toLowerCase());
  if (params.q) queryParams.append('q', params.q);

  const queryString = queryParams.toString();
  const endpoint = `/knowledge${queryString ? `?${queryString}` : ''}`;
  const response = await apiClient(endpoint);

  const items = Array.isArray(response) ? response : response.items || [];
  return items.map(normalizeEntry);
}

export async function createKnowledgeEntry({ title, description, category }) {
  return apiClient('/knowledge', {
    method: 'POST',
    body: JSON.stringify({
      title,
      description,
      category,
      content_type: 'text',
    }),
  });
}

export async function uploadKnowledgeFile(entryId, file, contentType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('content_type', contentType);

  return apiClient(`/knowledge/${entryId}/upload`, {
    method: 'POST',
    body: formData,
  });
}

export async function pollKnowledgeStatus(entryId, { onTick, intervalMs = 2000, maxAttempts = 30 } = {}) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    const statusData = await apiClient(`/knowledge/${entryId}/status`);
    if (onTick) onTick(statusData);

    if (statusData.status === 'completed' || statusData.status === 'failed') {
      return statusData;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Processing timed out. Please check back later.');
}

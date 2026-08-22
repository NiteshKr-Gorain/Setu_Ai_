import { api } from './client';

export async function submitVerification(entryId, { trustLevel, comment }) {
  return api.post(`/knowledge/${entryId}/verify`, {
    trust_level: trustLevel, // "verified" | "needs_review" | "disputed"
    comment: comment?.trim() || null,
  });
}

export async function listVerifications(entryId) {
  return api.get(`/knowledge/${entryId}/verifications`);
}

import { apiClient } from '../../../shared/api/client';

export async function listCommunities() {
  return apiClient('/communities');
}

import { apiClient } from '../../../shared/api/client';

export async function listLearningPaths() {
  return apiClient('/learning-paths');
}

export async function getLearningPath(pathId) {
  return apiClient(`/learning-paths/${pathId}`);
}

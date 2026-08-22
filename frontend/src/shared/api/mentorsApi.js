import { api } from './client';

export async function createOrUpdateMentorProfile({ bio, expertiseCategories, yearsOfExperience, availability, contactPreference }) {
  return api.post('/mentors/profile', {
    bio,
    expertise_categories: expertiseCategories,
    years_of_experience: yearsOfExperience,
    availability,
    contact_preference: contactPreference,
  });
}

export async function upsertMentorProfile(data) {
  return api.post('/mentors/profile', data);
}

export async function getMyMentorProfile() {
  return api.get('/mentors/me');
}

export async function listMentors({ category, minExperience } = {}) {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.set('category', category);
  if (minExperience) params.set('min_experience', minExperience);
  const res = await api.get(`/mentors?${params.toString()}`);
  return res?.mentors || [];
}

export async function getMentor(userId) {
  return api.get(`/mentors/${userId}`);
}

export async function requestMentor(mentorUserId, message) {
  return api.post(`/mentors/${mentorUserId}/request`, { message });
}

export async function getIncomingRequests() {
  return api.get('/mentors/requests/incoming');
}

export async function getOutgoingRequests() {
  return api.get('/mentors/requests/outgoing');
}

export async function respondToRequest(requestId, status) {
  return api.put(`/mentors/requests/${requestId}`, { status });
}

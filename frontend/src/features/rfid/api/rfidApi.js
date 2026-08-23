import { apiClient } from '../../../shared/api/client';

/**
 * Scan / Tap an RFID card or NFC tag.
 * Handles both physical hardware readers and virtual simulator taps.
 * @param {string} tagUid 
 * @param {string} deviceId 
 * @param {string} readerType 
 * @returns {Promise<Object>}
 */
export async function scanRfidTag(tagUid, deviceId = 'village-kiosk-main', readerType = 'simulator') {
  return await apiClient('/api/rfid/scan', {
    method: 'POST',
    json: {
      tag_uid: tagUid.trim(),
      device_id: deviceId,
      reader_type: readerType,
    },
  });
}

/**
 * Bind an RFID card to the currently authenticated user.
 * @param {string} tagUid 
 * @param {string} label 
 * @returns {Promise<Object>}
 */
export async function bindUserCard(tagUid, label = 'Personal Smart Badge') {
  return await apiClient('/api/rfid/bind-user', {
    method: 'POST',
    json: {
      tag_uid: tagUid.trim(),
      label: label.trim(),
    },
  });
}

/**
 * Bind an RFID physical tag to a Knowledge Entry.
 * @param {string} tagUid 
 * @param {string} entryId 
 * @param {string} label 
 * @returns {Promise<Object>}
 */
export async function bindKnowledgeTag(tagUid, entryId, label = 'Physical Artifact Tag') {
  return await apiClient('/api/rfid/bind-knowledge', {
    method: 'POST',
    json: {
      tag_uid: tagUid.trim(),
      entry_id: entryId,
      label: label.trim(),
    },
  });
}

/**
 * List registered RFID tags.
 * @param {string} tagType 
 * @param {number} skip 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function listRfidTags(tagType = null, skip = 0, limit = 50) {
  const params = new URLSearchParams();
  if (tagType) params.append('tag_type', tagType);
  if (skip) params.append('skip', skip);
  if (limit) params.append('limit', limit);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return await apiClient(`/api/rfid/tags${queryStr}`);
}

/**
 * Delete / unbind an RFID tag.
 * @param {string} tagUid 
 * @returns {Promise<Object>}
 */
export async function deleteRfidTag(tagUid) {
  return await apiClient(`/api/rfid/tags/${encodeURIComponent(tagUid.trim())}`, {
    method: 'DELETE',
  });
}

/**
 * Seed default demonstration RFID smart cards and artifact tags.
 * @returns {Promise<Object>}
 */
export async function seedRfidTags() {
  return await apiClient('/api/rfid/seed', {
    method: 'POST',
  });
}

/**
 * Get RFID scan history / audit trail.
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getRfidHistory(limit = 50) {
  return await apiClient(`/api/rfid/history?limit=${limit}`);
}

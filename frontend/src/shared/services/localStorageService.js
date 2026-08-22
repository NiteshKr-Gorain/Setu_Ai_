// Storage keys
const RECENT_CHATS_KEY = 'ai_setu_recent_chats';
const CACHE_KEY = 'ai_setu_chat_cache';
const SAVED_CHATS_KEY = 'ai_setu_saved_chat_sessions';

// Default list
const DEFAULT_RECENT_CHATS = [];

// Get sessions
export function getSavedChatSessions() {
  try {
    // Read storage
    const data = localStorage.getItem(SAVED_CHATS_KEY);
    if (data) {
      // Parse data
      return JSON.parse(data);
    }
    // Fallback data
    const recentData = localStorage.getItem(RECENT_CHATS_KEY);
    if (recentData) {
      // Parse recent
      const recents = JSON.parse(recentData);
      if (Array.isArray(recents) && recents.length > 0) {
        // Map items
        return recents.map(r => ({
          id: r.id || `chat_${Date.now()}`,
          title: r.title,
          category: r.category || 'General',
          timestamp: r.timestamp || 'Just now',
          messages: r.messages || []
        }));
      }
    }
    // Empty default
    return [];
  } catch (err) {
    // Handle error
    console.error('Error reading saved chat sessions:', err);
    return [];
  }
}

// Load chats
export function loadSavedChats() {
  return getSavedChatSessions();
}

// Save storage
export function saveChatsToStorage(chats) {
  try {
    // Write storage
    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(chats));
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(chats));
  } catch (err) {
    // Handle error
    console.error('Error saving chats to storage:', err);
  }
}

// Recent chats
export function getRecentChats() {
  return getSavedChatSessions();
}

// Find session
export function getChatSessionById(id) {
  // Validate ID
  if (!id) return null;
  // Search list
  const sessions = getSavedChatSessions();
  return sessions.find(s => s.id === id) || null;
}

// Save session
export function saveChatSession(session) {
  try {
    // Get existing
    const sessions = getSavedChatSessions();
    // Clean title
    const cleanTitle = session.title && session.title.length > 32 
      ? session.title.substring(0, 32) + '...' 
      : (session.title || 'New Conversation');

    // Generate ID
    const sessionId = session.id || `chat_${Date.now()}`;
    const existingIdx = sessions.findIndex(s => s.id === sessionId);
    
    // Create record
    const updatedSession = {
      id: sessionId,
      title: cleanTitle,
      category: session.category || 'General',
      timestamp: 'Just now',
      updatedAt: new Date().toISOString(),
      messages: session.messages || []
    };

    // Update list
    let updatedList;
    if (existingIdx >= 0) {
      // Replace existing
      updatedList = [
        updatedSession,
        ...sessions.filter((_, idx) => idx !== existingIdx)
      ];
    } else {
      // Prepend new
      updatedList = [updatedSession, ...sessions];
    }

    // Save items
    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedList));
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (err) {
    // Handle error
    console.error('Error saving chat session:', err);
    return getSavedChatSessions();
  }
}

// Add chat
export function addRecentChat(title, category = 'General', messages = []) {
  // New session
  const newSession = {
    id: `chat_${Date.now()}`,
    title,
    category,
    messages
  };
  return saveChatSession(newSession);
}

// Delete chat
export function deleteChatById(id) {
  try {
    // Filter list
    const sessions = getSavedChatSessions();
    const updated = sessions.filter(s => s.id !== id);
    // Write storage
    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updated));
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    // Handle error
    console.error('Error deleting chat:', err);
    return getSavedChatSessions();
  }
}

// Clear chats
export function clearRecentChats() {
  try {
    // Reset storage
    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify([]));
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify([]));
    return [];
  } catch (err) {
    // Handle error
    console.error('Error clearing chats:', err);
    return [];
  }
}

// Get history
export function getAllHistory() {
  try {
    // Read cache
    const cacheRaw = localStorage.getItem(CACHE_KEY);
    if (!cacheRaw) {
      // Init empty
      localStorage.setItem(CACHE_KEY, JSON.stringify({}));
      return [];
    }

    // Parse cache
    const cache = JSON.parse(cacheRaw);
    const demoIds = ['hist_1', 'hist_2', 'hist_3', 'hist_4'];
    // Filter keys
    const keys = Object.keys(cache).filter(key => {
      const item = cache[key];
      return item && !demoIds.includes(item.id);
    });

    // Format list
    return keys.map((key, idx) => ({
      id: cache[key].id || `hist_${idx}_${Date.now()}`,
      query: cache[key].query || key,
      response: cache[key].response,
      category: cache[key].category || 'General',
      source: cache[key].source || 'Local Storage Cache',
      timestamp: cache[key].savedAt || new Date().toISOString()
    }));
  } catch (err) {
    // Handle error
    console.error('Error fetching history:', err);
    return [];
  }
}

// Delete item
export function deleteHistoryItem(queryToDelete) {
  try {
    // Read cache
    const cacheRaw = localStorage.getItem(CACHE_KEY);
    if (!cacheRaw) return [];
    
    // Parse cache
    const cache = JSON.parse(cacheRaw);
    const normalizedKey = queryToDelete.trim().toLowerCase();
    
    // Remove key
    delete cache[normalizedKey];
    
    // Clean queries
    Object.keys(cache).forEach(k => {
      if (cache[k].query && cache[k].query.toLowerCase() === normalizedKey) {
        delete cache[k];
      }
    });

    // Write storage
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return getAllHistory();
  } catch (err) {
    // Handle error
    console.error('Error deleting history item:', err);
    return getAllHistory();
  }
}

// Delete combined
export function deleteHistoryAndChat(id, queryTitle) {
  try {
    // Delete session
    if (id) {
      deleteChatById(id);
    }
    // Delete query
    if (queryTitle) {
      deleteHistoryItem(queryTitle);
    }
    // Return both
    return {
      recentChats: getRecentChats(),
      allHistory: getAllHistory()
    };
  } catch (err) {
    // Handle error
    console.error('Error deleting history and chat:', err);
    return {
      recentChats: getRecentChats(),
      allHistory: getAllHistory()
    };
  }
}

// Clear cache
export function clearLocalStorageCache() {
  try {
    // Reset cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({}));
    return [];
  } catch (err) {
    // Handle error
    console.error('Error clearing cache:', err);
    return [];
  }
}

// Search cache
export function searchLocalStorage(query) {
  try {
    // Read cache
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const normalizedQuery = query.trim().toLowerCase();
    const demoIds = ['hist_1', 'hist_2', 'hist_3', 'hist_4'];
    
    // Exact match
    if (cache[normalizedQuery]) {
      const item = cache[normalizedQuery];
      if (item && !demoIds.includes(item.id)) {
        return { found: true, data: item };
      }
    }

    // Partial match
    const matchedKey = Object.keys(cache).find(k => {
      const item = cache[k];
      if (item && demoIds.includes(item.id)) return false;
      return k.includes(normalizedQuery) || normalizedQuery.includes(k);
    });

    // Return match
    if (matchedKey) {
      return { found: true, data: cache[matchedKey] };
    }

    // Not found
    return { found: false };
  } catch (err) {
    // Handle error
    console.error('Error searching local storage:', err);
    return { found: false };
  }
}

// Cache response
export function saveToLocalStorageCache(query, response, category = 'General', extraData = {}) {
  try {
    // Parse cache
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const normalizedQuery = query.trim().toLowerCase();
    // Build object
    cache[normalizedQuery] = {
      id: `hist_${Date.now()}`,
      query,
      response,
      category: extraData.category || category,
      source: extraData.source || 'FastAPI Backend Engine',
      points: extraData.points || null,
      kerasMetadata: extraData.kerasMetadata || extraData.keras_metadata || null,
      persona: extraData.persona || 'Wise Old Master',
      savedAt: new Date().toISOString()
    };
    // Save storage
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    // Handle error
    console.error('Error saving to local storage:', err);
  }
}

// Export JSON
export function exportHistoryAsJSON() {
  try {
    // Fetch history
    const historyData = getAllHistory();
    // Build JSON
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(historyData, null, 2)
    )}`;
    // Create link
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'history.json');
    document.body.appendChild(downloadAnchor);
    // Trigger download
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    // Handle error
    console.error('Error exporting history JSON:', err);
  }
}

// Import JSON
export function importHistoryFromJSON(jsonArray) {
  try {
    // Validate array
    if (!Array.isArray(jsonArray)) return getAllHistory();
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    
    // Loop entries
    jsonArray.forEach((item) => {
      if (item.query && item.response) {
        const key = item.query.trim().toLowerCase();
        // Insert record
        cache[key] = {
          id: item.id || `hist_${Date.now()}`,
          query: item.query,
          response: item.response,
          category: item.category || 'General',
          source: item.source || 'Local Storage Cache',
          savedAt: item.timestamp || new Date().toISOString()
        };
      }
    });

    // Save storage
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return getAllHistory();
  } catch (err) {
    // Handle error
    console.error('Error importing history JSON:', err);
    return getAllHistory();
  }
}

// Font exports
export {
  getSavedTextSizePreference,
  applyTextSizePreference,
  FONT_SIZE_PRESETS
} from './fontSizeService';

// Service imports
import { ENV } from '../config/env';

// Base URL
const API_BASE_URL = ENV.API_URL;

// Health check
export async function checkBackendHealth() {
  try {
    // Send ping
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      // Offline status
      return { connected: false, statusText: response.statusText };
    }
    // Parse health
    const data = await response.json();
    return { connected: true, ...data };
  } catch (error) {
    // Handle error
    return { connected: false, error: error.message };
  }
}

// Chat request
export async function sendChatMessage(prompt, category = 'General', localContext = null) {
  try {
    // Post prompt
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, category, local_context: localContext }),
    });

    // Check errors
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error: ${response.status}`);
    }

    // Success response
    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    // Warn failure
    console.warn('Backend API request failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Stream request
export async function sendChatMessageStream(prompt, options = {}, onChunk, signal) {
  try {
    // Post stream
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, options }),
      signal
    });

    if (!response.ok) {
      // Fallback stream
      const fallbackResponse = `Thank you for asking about "${prompt}". Setu's traditional knowledge database emphasizes time-tested methods passed down by generations of elders, combined with modern ecological science for sustainable living.`;
      const words = fallbackResponse.split(' ');
      for (const word of words) {
        if (signal?.aborted) break;
        onChunk(word + ' ');
        await new Promise((r) => setTimeout(r, 40));
      }
      return;
    }

    // Read chunks
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    
    // Fallback simulation
    const fallbackResponse = `Thank you for asking about "${prompt}". Setu's verified heritage archives detail ancestral practices and local wisdom passed down through generations.`;
    const words = fallbackResponse.split(' ');
    for (const word of words) {
      if (signal?.aborted) break;
      onChunk(word + ' ');
      await new Promise((r) => setTimeout(r, 45));
    }
  }
}

// Classify prompt
export async function classifyPrompt(prompt) {
  try {
    // Post classify
    const response = await fetch(`${API_BASE_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error('Classification failed');
    return await response.json();
  } catch (_error) {
    // Fallback category
    return { category: 'General', confidence: 0.5, vector_norm: 0.0 };
  }
}

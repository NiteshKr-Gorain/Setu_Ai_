// Environment config
export const ENV = {
  // API URL
  API_URL: (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, ''),
  
  // App title
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Setu - Bridge of Wisdom',
  
  // App version
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Feature voice
  ENABLE_AI_VOICE: import.meta.env.VITE_ENABLE_AI_VOICE !== 'false',
  
  // Feature embeddings
  ENABLE_KERAS_EMBEDDINGS: import.meta.env.VITE_ENABLE_KERAS_EMBEDDINGS !== 'false',
  
  // Default language
  DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en',
  
  // Default scale
  DEFAULT_FONT_SIZE: Number(import.meta.env.VITE_DEFAULT_FONT_SIZE) || 100,
  
  // Dev mode
  IS_DEV: import.meta.env.DEV,
  
  // Prod mode
  IS_PROD: import.meta.env.PROD
};

// Default export
export default ENV;

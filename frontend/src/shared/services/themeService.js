// Global Theme & Appearance Service for Setu

const THEME_KEY = 'setu_theme_preference';

export const THEME_PRESETS = [
  {
    id: 'light',
    name: 'Setu Classic (Light)',
    description: 'Clean bright layout with warm saffron amber accents, optimized for daylight.',
    bgPreview: '#FFFFFF',
    accentPreview: '#EA580C'
  },
  {
    id: 'warm',
    name: 'Warm Heritage (Sepia)',
    description: 'Soft parchment warm tones that reduce eye strain for reading traditional wisdom and archives.',
    bgPreview: '#FDFBF7',
    accentPreview: '#D97706'
  },
  {
    id: 'dark',
    name: 'Midnight Dark',
    description: 'Sleek dark slate aesthetic for comfortable night-time browsing and high contrast.',
    bgPreview: '#0F172A',
    accentPreview: '#F97316'
  },
  {
    id: 'forest',
    name: 'Vedic Forest (Green)',
    description: 'Nature-inspired earthy emerald tones reflecting traditional agriculture and herbal wisdom.',
    bgPreview: '#F0FDF4',
    accentPreview: '#16A34A'
  }
];

export function getSavedThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && THEME_PRESETS.some((t) => t.id === saved)) {
      return saved;
    }
  } catch (err) {
    console.error('Error reading theme preference:', err);
  }
  return 'light';
}

export function applyThemePreference(themeId) {
  const validId = THEME_PRESETS.some((t) => t.id === themeId) ? themeId : 'light';

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', validId);
    if (validId === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  try {
    localStorage.setItem(THEME_KEY, validId);
  } catch (err) {
    console.error('Error saving theme preference:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('setu-theme-changed', { detail: { theme: validId } }));
  }

  return validId;
}

// Automatically apply saved theme preference when module loads
if (typeof window !== 'undefined') {
  try {
    const saved = getSavedThemePreference();
    if (saved) {
      applyThemePreference(saved);
    }
  } catch (err) {
    console.error('Error initializing theme preference:', err);
  }
}

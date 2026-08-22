// Global Text Size & Accessibility Scaling Service for Setu

const FONT_SIZE_KEY = 'setu_text_size_preference';

export const FONT_SIZE_PRESETS = [
  {
    id: 'small',
    label: 'Compact',
    badge: '87.5% (14px)',
    scale: 87.5,
    px: 14,
    icon: '🔍',
    description: 'Compact layout for viewing more content on screen'
  },
  {
    id: 'default',
    label: 'Standard',
    badge: '100% (16px)',
    scale: 100,
    px: 16,
    icon: '✨',
    description: 'Recommended default balanced readability for all devices'
  },
  {
    id: 'large',
    label: 'Large',
    badge: '112.5% (18px)',
    scale: 112.5,
    px: 18,
    icon: '📖',
    description: 'Enhanced text clarity, comfortable for long reading'
  },
  {
    id: 'extra-large',
    label: 'Extra Large',
    badge: '125% (20px)',
    scale: 125,
    px: 20,
    icon: '👓',
    description: 'Maximum accessibility and high visibility for seniors & elders'
  }
];

export function getSavedTextSizePreference() {
  try {
    const raw = localStorage.getItem(FONT_SIZE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.scale === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading font size preference:', err);
  }
  return { preset: 'default', scale: 100, px: 16 };
}

export function applyTextSizePreference(scaleOrPreset) {
  let scale = 100;
  let preset = 'default';
  let px = 16;

  if (typeof scaleOrPreset === 'string') {
    const found = FONT_SIZE_PRESETS.find((p) => p.id === scaleOrPreset);
    if (found) {
      scale = found.scale;
      preset = found.id;
      px = found.px;
    }
  } else if (typeof scaleOrPreset === 'number') {
    scale = Math.min(135, Math.max(80, Math.round(scaleOrPreset)));
    px = Math.round((scale / 100) * 16);
    const matched = FONT_SIZE_PRESETS.find((p) => Math.abs(p.scale - scale) < 2);
    preset = matched ? matched.id : 'custom';
  } else if (typeof scaleOrPreset === 'object' && scaleOrPreset !== null) {
    scale = typeof scaleOrPreset.scale === 'number' ? Math.min(135, Math.max(80, Math.round(scaleOrPreset.scale))) : 100;
    preset = scaleOrPreset.preset || 'default';
    px = scaleOrPreset.px || Math.round((scale / 100) * 16);
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.fontSize = `${scale}%`;
    document.documentElement.style.setProperty('--setu-text-scale', `${scale / 100}`);
    document.documentElement.setAttribute('data-text-size', preset);
  }

  const preference = { preset, scale, px };
  try {
    localStorage.setItem(FONT_SIZE_KEY, JSON.stringify(preference));
  } catch (err) {
    console.error('Error saving font size preference:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('setu-font-size-changed', { detail: preference }));
  }

  return preference;
}

// Automatically apply saved text size preference when module loads
if (typeof window !== 'undefined') {
  try {
    const saved = getSavedTextSizePreference();
    if (saved && saved.scale) {
      applyTextSizePreference(saved);
    }
  } catch (err) {
    console.error('Error initializing text size preference:', err);
  }
}

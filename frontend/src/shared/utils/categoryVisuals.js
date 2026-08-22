// Backend knowledge entries don't come with curated cover images (unlike
// the old hardcoded demo array), so we render a category-themed gradient
// + emoji placeholder instead of a broken <img> tag.
const VISUALS = {
  Healthcare: { emoji: '🩺', gradient: 'from-rose-100 to-pink-50' },
  Agriculture: { emoji: '🌾', gradient: 'from-emerald-100 to-lime-50' },
  Engineering: { emoji: '⚙️', gradient: 'from-slate-200 to-blue-50' },
  Education: { emoji: '📚', gradient: 'from-amber-100 to-orange-50' },
  Business: { emoji: '💼', gradient: 'from-indigo-100 to-blue-50' },
  Technology: { emoji: '💻', gradient: 'from-sky-100 to-cyan-50' },
  'Traditional Knowledge': { emoji: '🏺', gradient: 'from-orange-100 to-amber-50' },
};

const DEFAULT_VISUAL = { emoji: '📖', gradient: 'from-blue-50 to-orange-50' };

export function getCategoryVisual(category) {
  return VISUALS[category] || DEFAULT_VISUAL;
}

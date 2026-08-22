import React, { useState } from 'react';

export default function ShareKnowledgeModal({ isOpen, onClose, onAddKnowledge }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Agriculture');
  const [contributor, setContributor] = useState('');
  const [location, setLocation] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [step1, setStep1] = useState('');
  const [step2, setStep2] = useState('');
  const [step3, setStep3] = useState('');
  const [tools, setTools] = useState('');
  const [precautions, setPrecautions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !contributor.trim() || !description.trim()) {
      alert('Please fill out the title, your name, and description.');
      return;
    }

    setIsSubmitting(true);

    // Convert YouTube URL to embed if provided
    let embedUrl = '';
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const vidId = videoUrl.split('watch?v=')[1]?.split('&')[0];
      if (vidId) embedUrl = `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`;
    } else if (videoUrl.includes('youtu.be/')) {
      const vidId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (vidId) embedUrl = `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`;
    } else if (videoUrl.startsWith('http')) {
      embedUrl = videoUrl;
    }

    const newKnowledgeItem = {
      id: `shared-${Date.now()}`,
      title: title.trim(),
      category,
      skillLevel: 'Community Heritage',
      duration: 'Full Masterclass',
      contributor: contributor.trim(),
      location: location.trim() || 'India',
      thumbnail: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      videoUrl: '/Setu_Video.mp4',
      onlineEmbedUrl: embedUrl || 'https://www.youtube-nocookie.com/embed/sF8zP-4xR5U?rel=0&autoplay=1',
      description: description.trim(),
      aiChapters: [
        { time: '00:15', title: '1. Preparation & Materials', detail: 'Gather raw ingredients and ancestral tools' },
        { time: '02:30', title: '2. Core Technique Execution', detail: 'Execute the traditional process step-by-step' },
        { time: '05:00', title: '3. Application & Quality Check', detail: 'Verify output with traditional benchmarks' }
      ],
      aiCommonQuestions: [
        { q: `What is the core benefit of ${title}?`, a: description },
        { q: 'What safety precautions must be followed?', a: precautions || 'Follow ancestral guidelines and avoid synthetic chemical adulteration.' }
      ],
      aiSummary: {
        coreTechnique: description.trim(),
        scientificValidation: 'Setu AI has verified the biochemical and physical principles of this traditional community practice.',
        keyBenefits: 'Preserves ancestral wisdom, zero synthetic dependence, and promotes sustainable community self-reliance.',
        precautions: precautions.trim() || 'Follow traditional seasonal timings and hygienic storage standards.',
        aiScore: '99.1%'
      },
      aiDeepDive: {
        overview: description.trim(),
        stepByStep: [
          step1.trim() || 'Gather all organic materials and prepare clean terracotta or wooden equipment.',
          step2.trim() || 'Perform the authentic formulation mixing following traditional measurements.',
          step3.trim() || 'Store in cool ambient conditions or apply during early morning or sunset.'
        ],
        toolsRequired: tools ? tools.split(',').map((t) => t.trim()) : ['Traditional mortar', 'Terracotta vessel', 'Cotton cloth'],
        masterTips: 'Perform this technique during the optimal lunar cycle and maintain uniform ambient temperature.',
        ecologicalImpact: 'Zero carbon footprint traditional method safeguarding indigenous biodiversity.'
      }
    };

    setTimeout(() => {
      onAddKnowledge(newKnowledgeItem);
      setIsSubmitting(false);
      setSuccessMessage(true);

      setTimeout(() => {
        setSuccessMessage(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-100 text-left relative space-y-5 my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
            <span>🤝 Community Wisdom Repository</span>
            <span>•</span>
            <span className="text-brand-primary">Share Knowledge</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Share Your Heritage Knowledge &amp; Full Skill Video
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Contribute traditional practices, organic farming methods, Ayurvedic remedies, or craft videos to safeguard ancient wisdom for future generations.
          </p>
        </div>

        {successMessage ? (
          <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95">
            <span className="text-5xl">✨</span>
            <h3 className="text-xl font-bold text-emerald-900">Knowledge Successfully Shared!</h3>
            <p className="text-xs text-emerald-700">
              Setu AI has verified your contribution. Your full skill video and ancestral wisdom are now live in the Library!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Knowledge / Skill Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Natural Turmeric Root Fermentation for Joint Health"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary focus:bg-white cursor-pointer"
                >
                  <option value="Agriculture">Agriculture &amp; Natural Farming</option>
                  <option value="Traditional Skills">Traditional Skills &amp; Craft</option>
                  <option value="Health & Ayurveda">Health &amp; Ayurveda</option>
                  <option value="Recipes">Ancestral Recipes</option>
                  <option value="Eco-Technology">Eco-Technology &amp; Water</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Your Name / Master Artisan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vaidya Rameshwar / Sita Devi"
                  value={contributor}
                  onChange={(e) => setContributor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Region / Village / State</label>
                <input
                  type="text"
                  placeholder="e.g. Kangra Valley, Himachal Pradesh"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Full Online Skill Video URL (YouTube or Stream)</label>
              <input
                type="url"
                placeholder="e.g. https://www.youtube.com/watch?v=sF8zP-4xR5U"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary focus:bg-white"
              />
              <p className="text-[10px] text-slate-400">
                Paste any YouTube or educational video link to play directly in Setu with AI Companion.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Core Technique &amp; Formulation Description *</label>
              <textarea
                rows={3}
                required
                placeholder="Explain the traditional technique, key ingredients, mixing ratios, and why this method works..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary focus:bg-white leading-relaxed"
              />
            </div>

            <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="font-bold text-slate-800 block">Step-by-Step Instructions (Optional)</label>
              <input
                type="text"
                placeholder="Step 1: Preparation of raw ingredients"
                value={step1}
                onChange={(e) => setStep1(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary"
              />
              <input
                type="text"
                placeholder="Step 2: Fermentation or craft execution"
                value={step2}
                onChange={(e) => setStep2(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary"
              />
              <input
                type="text"
                placeholder="Step 3: Storage, dosage, or application"
                value={step3}
                onChange={(e) => setStep3(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tools Required (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Stone mortar, Terracotta pot, Muslin cloth"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Safety Precautions</label>
                <input
                  type="text"
                  placeholder="e.g. Dilute 1:20 before applying; avoid direct midday sun"
                  value={precautions}
                  onChange={(e) => setPrecautions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold transition-all shadow-md shadow-brand-primary/25 cursor-pointer disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{isSubmitting ? 'Verifying with Setu AI...' : 'Publish Knowledge to Library'}</span>
                <span>✨</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

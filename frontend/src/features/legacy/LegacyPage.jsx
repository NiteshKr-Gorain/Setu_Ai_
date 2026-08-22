import React, { useState, useRef, useMemo, useCallback } from 'react';
import LazyImage from '../../shared/components/LazyImage';

const mockVideos = [
  {
    id: 'v1',
    title: '🌾 Preserving Ancestral Seed Varieties in Drylands',
    storytellerName: 'Harbhajan Singh',
    category: 'Agriculture',
    duration: '4:12',
    thumbnail: 'https://images.unsplash.com/photo-1593113598332-cd59c5bc3f90?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'Elder farmer Harbhajan Singh explains how his family has preserved non-hybrid, drought-resistant heirloom seeds across 4 generations in arid soil.'
  },
  {
    id: 'v2',
    title: '🏺 Micro-porous Terracotta Firing Techniques',
    storytellerName: 'Sita Devi',
    category: 'Traditional Skills',
    duration: '3:45',
    thumbnail: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    description: 'Master artisan Sita Devi demonstrates river clay wedging and wood pit kiln baking secrets passed down through centuries.'
  },
  {
    id: 'v3',
    title: '🌿 Wild Herbal Kashayam for Respiratory Defense',
    storytellerName: 'Dr. V. Sharma',
    category: 'Ayurveda & Health',
    duration: '5:20',
    thumbnail: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Ayurvedic expert Dr. Sharma shares the exact brewing ratios for Tulsi, ginger, and licorice decoction for immunity.'
  },
  {
    id: 'v4',
    title: '🥣 Germinated Finger Millet (Ragi) Breakfast Brew',
    storytellerName: 'Savitri Devi',
    category: 'Heritage Recipes',
    duration: '2:50',
    thumbnail: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: 'Grandmother Savitri Devi details the 36-hour germination process that multiplies calcium bioavailability in millet.'
  },
  {
    id: 'v5',
    title: '💧 Community Check-Dam Rainwater Harvesting',
    storytellerName: 'Village Elders Collective',
    category: 'Ecological Wisdom',
    duration: '6:15',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'A case study of how dry-stone check dams restored groundwater well levels by 4 meters across 3 droughts.'
  },
  {
    id: 'v6',
    title: '🧵 Organic Cotton Handloom Weaving Traditions',
    storytellerName: 'Kamla Devi',
    category: 'Traditional Skills',
    duration: '4:30',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    description: 'Master weaver Kamla Devi demonstrates handloom shuttle techniques and natural indigo dye extraction.'
  }
];

const categories = [
  'Agriculture',
  'Traditional Skills',
  'Ayurveda & Health',
  'Heritage Recipes',
  'Ecological Wisdom'
];

export default function LegacyPage() {
  const [activeVideo, setActiveVideo] = useState(mockVideos[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const playerRef = useRef(null);

  const filteredVideos = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return mockVideos.filter(video => {
      const matchesSearch = !query ||
        video.title.toLowerCase().includes(query) ||
        video.storytellerName.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectVideo = useCallback((video) => {
    setActiveVideo(video);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      playerRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-8">
        
        {/* Page Intro Header */}
        <div className="text-left space-y-2 max-w-2xl">
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/50 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wide">
            Oral Heritage Vault
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight pt-1">
            Legacy Video &amp; Voice Archives
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            Listen to the direct voices of elder generations sharing life journeys, local traditions, historical events, and craft secrets.
          </p>
        </div>

        {/* 1. Featured Video Player Section with Lazy Loading & Preload */}
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-0 text-left">
          <div className="lg:col-span-7 bg-black aspect-video flex items-center justify-center relative cursor-pointer">
            <video
              ref={playerRef}
              src={activeVideo.videoUrl}
              poster={activeVideo.thumbnail}
              controls
              preload="none"
              playsInline
              onClick={(e) => {
                if (e.currentTarget.paused) {
                  e.currentTarget.play().catch(() => {});
                }
              }}
              className="w-full h-full object-contain cursor-pointer"
            />
          </div>
          
          <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/40 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  {activeVideo.category}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">⌛ {activeVideo.duration}</span>
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900 leading-snug">
                {activeVideo.title}
              </h2>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                🗣️ Storyteller: {activeVideo.storytellerName}
              </p>
              <div className="h-px bg-slate-100"></div>
              <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed font-normal">
                {activeVideo.description}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 italic">
              * Seeded wisdom transcript verified by Setu.
            </div>
          </div>
        </div>

        {/* 2. Control Bar */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-left shadow-xs space-y-5">
          <div className="flex items-center bg-slate-50 border border-slate-200/50 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-brand-primary/30 focus-within:ring-2 focus-within:ring-brand-light/50 transition-all duration-300">
            <span className="pl-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search stories by keywords or storyteller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs focus:outline-none px-3 py-2 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="h-px bg-slate-100"></div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-amber-600 text-white shadow-3xs'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              All Stories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-3xs'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Grid of Video Cards with Lazy Thumbnail Loading */}
        <div className="space-y-6 text-left">
          <h3 className="font-bold text-sm text-slate-800 pl-1">Wisdom Archives Playlist</h3>
          
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map(video => {
                const isPlaying = activeVideo.id === video.id;
                return (
                  <div
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    className={`bg-white rounded-3xl border overflow-hidden flex flex-col hover:shadow-md hover:border-amber-200 transition-all duration-300 cursor-pointer group text-left shadow-2xs ${
                      isPlaying ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-100'
                    }`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-50">
                      <LazyImage
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full"
                        imgClassName="group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-60 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-xs transform group-hover:scale-110 transition-transform">
                          {isPlaying ? '⏸️' : '▶️'}
                        </div>
                      </div>
                      <span className="absolute bottom-2.5 right-2.5 bg-black/75 px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider font-sans">
                        {video.duration}
                      </span>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                          {video.category}
                        </span>
                        <h4 className="text-xs md:text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {video.title}
                        </h4>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Storyteller: {video.storytellerName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100 text-xs">
              No oral story videos found matching "{searchQuery}".
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

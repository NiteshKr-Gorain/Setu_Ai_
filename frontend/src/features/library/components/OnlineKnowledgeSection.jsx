import React, { useState } from 'react';

export const ONLINE_KNOWLEDGE_ARTICLES = [
  {
    id: 'art-1',
    title: 'The Thermodynamics of Earthen Water Cooling (Terracotta Physics)',
    category: 'Traditional Skills',
    readTime: '4 min read',
    author: 'Dr. V. K. Raman',
    region: 'Rajasthan & Gujarat',
    icon: '🏺',
    summary: 'How porous clay micro-capillaries induce continuous latent heat evaporation, cooling drinking water by 8-10°C without electricity.',
    fullContent: `Traditional Indian terracotta matkas and surahis are sophisticated thermodynamic evaporative coolers. When unglazed clay is fired at 750-800°C, interconnected sub-micron pores remain open throughout the vessel walls.

Water slowly seeps through these microscopic channels onto the exterior surface. As ambient warm air sweeps across the damp exterior, surface water molecules absorb latent heat of vaporization (approx. 2260 kJ/kg) from the water inside the pot.

Furthermore, clay minerals naturally adsorb heavy metallic impurities and neutralize water acidity, raising pH from 6.8 to a gentle alkaline 7.4.`,
    scientificPoints: [
      'Latent heat of vaporization extracts 540 calories per gram of evaporated surface water.',
      'Natural cation-exchange capacity of alluvial silt neutralizes acidic runoff water.',
      '100% biodegradable and zero fossil fuel carbon footprint.'
    ],
    precautions: 'Wash periodically with clean warm water and salt; never use synthetic dish detergents that clog micro-capillaries.'
  },
  {
    id: 'art-2',
    title: 'Phytochemical Matrix of Aged Cow Urine & Azadirachta Indica (Neem)',
    category: 'Agriculture',
    readTime: '5 min read',
    author: 'Prof. Subhash Sharma',
    region: 'Punjab & Haryana',
    icon: '🌿',
    summary: 'The molecular mechanism of azadirachtin bio-pesticide in disrupting pest ecdysone receptors without synthetic neurotoxin residues.',
    fullContent: `Neem (Azadirachta indica) contains more than 100 biologically active limonoid compounds, with Azadirachtin A and B acting as the principal anti-feedants. Unlike synthetic organophosphates that poison the nervous system, azadirachtin mimics the insect hormone ecdysone.

When leaf-chewing caterpillars ingest fermented neem extract, azadirachtin prevents pupation and reproductive egg-laying. 

Fermenting the crushed leaves in aged cow urine adds urea, uric acid, and beneficial anaerobic bacteria that act as natural surfactants, allowing the azadirachtin to adhere tenaciously to the leaf waxy cuticle even through light rains.`,
    scientificPoints: [
      'Azadirachtin selectively targets ecdysis without affecting honeybees or earthworms.',
      'Fermented urea provides a slow-release foliar nitrogen boost of 0.8% N.',
      'Natural sulfur metabolites in aged urine inhibit powdery mildew spores.'
    ],
    precautions: 'Dilute at minimum 1:20 ratio with fresh water; apply during early morning hours before high UV index.'
  },
  {
    id: 'art-3',
    title: 'Biomicrobial Ecology of Jeevamrutha in Soil Rhizosphere Regeneration',
    category: 'Agriculture',
    readTime: '6 min read',
    author: 'K. Subhash Palekar Collective',
    region: 'Karnataka & Maharashtra',
    icon: '🌱',
    summary: 'How 48-hour aerobic fermentation of desi cow dung and forest soil multiplies billions of phosphate-solubilizing microbes per milliliter.',
    fullContent: `Jeevamrutha is not a fertilizer in the conventional NPK sense; it is a live bio-catalytic culture. A single gram of fresh indigenous (Bos indicus) cow dung contains an estimated 300 to 500 million beneficial bacteria, actinomycetes, and mycorrhizal spores.

When combined with organic jaggery (carbon energy source) and pulse flour (nitrogen and protein substrate), the microbial population undergoes exponential logarithmic multiplication over 48 to 72 hours.

Upon soil application, these microorganisms colonize the root rhizosphere, releasing organic acids that solubilize fixed insoluble soil phosphorus and potassium into bioavailable forms.`,
    scientificPoints: [
      'Microbial density reaches >2.5 × 10⁹ CFU/ml after 48 hours of fermentation.',
      'Re-activates deep dormant native earthworm cocoons through volatile fatty acid signaling.',
      'Eliminates the need for synthetic chemical nitrogen, phosphorus, and potassium inputs.'
    ],
    precautions: 'Apply to moist soil within 7-10 days of preparation; protect fermentation drum from direct solar heat.'
  },
  {
    id: 'art-4',
    title: 'Pharmacological Science of Ayurvedic Decoctions (Sneha Kalpana)',
    category: 'Health & Ayurveda',
    readTime: '5 min read',
    author: 'Vaidya Madhavan',
    region: 'Kerala & Uttarakhand',
    icon: '🍵',
    summary: 'The thermodynamic principles of cooking aqueous herbal extracts with lipid carrier oils to cross the dermal stratum corneum.',
    fullContent: `In classical Ayurvedic pharmaceutics (Bhaishajya Kalpana), botanicals are processed through three distinct phases: Kwatha (aqueous decoction), Kalka (fine herb paste), and Sneha (pure unrefined sesame or mustard oil).

Simmering this mixture over gentle heat until all water evaporates forces lipid-soluble diterpenes, flavonoids, and volatile essential oils to dissolve into the carrier triglycerides.

The final endpoint (Madhyama Paka) ensures maximum transdermal absorption through lipid bilayer skin channels, providing deep relief to inflamed joints and neuromuscular tissues.`,
    scientificPoints: [
      'Sesamolin and sesamol in cold-pressed oil prevent oxidative rancidity during cooking.',
      'Transdermal carrier efficiency increases active bioavailability by over 400% compared to raw herbs.',
      'Zero synthetic parabens, petroleum paraffin, or artificial preservatives.'
    ],
    precautions: 'Do not scorch the paste; store in dark amber glass away from ultraviolet light degradation.'
  },
  {
    id: 'art-5',
    title: 'Interlocking Dry-Stone Check Dams: Non-Rigid Watershed Hydraulics',
    category: 'Eco-Technology',
    readTime: '4 min read',
    author: 'Tarun Bharat Sangh Engineers',
    region: 'Rajasthan & Gujarat',
    icon: '🌊',
    summary: 'Why non-cemented dry-stone barriers withstand torrential flash floods while accelerating subterranean aquifer percolation.',
    fullContent: `Modern concrete check dams frequently fail due to hydrostatic silt accumulation and rigid foundation fracture. In contrast, indigenous dry-stone masonry (Bori Bandh / Johad) utilizes self-adjusting gravitational friction.

Angular basalt stones interlock without mortar, allowing high-velocity floodwaters to decelerate gently through porous gravel filter voids from 3.5 m/s to 0.4 m/s.

This controlled reduction in kinetic energy stops topsoil erosion and provides the residence time necessary for water to percolate downward through alluvial soil strata into shallow unconfined village aquifers.`,
    scientificPoints: [
      'Reduces flood kinetic energy by 88% while retaining fertile silt in farm fields.',
      'Recharges village ground water table by 3 to 5 meters in 2 consecutive monsoon seasons.',
      'Constructed with 100% locally available stone, gravel, and vetiver grass roots.'
    ],
    precautions: 'Anchor both dam flanks into firm soil banks using deep-rooted vetiver (Khus) grass to prevent flank bypass.'
  },
  {
    id: 'art-6',
    title: 'Cellulose Tension & Micro-Aeration in Handloom Cotton Weaving',
    category: 'Traditional Skills',
    readTime: '5 min read',
    author: 'Weavers Guild of Chanderi',
    region: 'Madhya Pradesh',
    icon: '🧵',
    summary: 'How gentle shuttle beat-up and organic rice-starch sizing preserve the natural hollow lumen of organic cotton fibers.',
    fullContent: `Industrial automated high-speed projectile looms operate under extreme mechanical tension (up to 400 RPM), which flattens the natural cylindrical lumen of cotton fibers.

Traditional handloom weaving uses low-speed rhythmic wooden fly-shuttles and natural fermented rice starch (Maandi) sizing. The cotton fiber retains its natural twist and microscopic interior air cavity.

This micro-void structure makes handloom fabrics exceptionally breathable, hygroscopic (absorbing 27 times its weight in perspiration), and thermally adaptive to both tropical summer heat and cool winters.`,
    scientificPoints: [
      'Preserves the natural spiral fibrillar structure and hollow lumen of raw Gossypium fibers.',
      'Zero electricity consumed during spinning, warping, and shuttle weaving.',
      'Natural organic rice sizing washes out completely with plain cold water.'
    ],
    precautions: 'Maintain 60-70% ambient humidity in weaving shed to prevent single-thread warp snapping.'
  }
];

export default function OnlineKnowledgeSection({ onShareKnowledgeClick, onSelectArticle }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [activeArticle, setActiveArticle] = useState(null);

  const categories = ['All', 'Agriculture', 'Traditional Skills', 'Health & Ayurveda', 'Eco-Technology'];

  const filteredArticles = ONLINE_KNOWLEDGE_ARTICLES.filter((art) => {
    const matchCat = selectedCat === 'All' || art.category === selectedCat;
    const matchQuery =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 text-left space-y-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-100/40 via-orange-100/30 to-blue-50/20 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-slate-50 border border-slate-200/80 rounded-full px-3.5 py-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              <span className="text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
                📚 Verified Online Heritage Knowledge Repository
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-slate-950">
              Ancestral Wisdom &amp; <span className="bg-gradient-to-r from-brand-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">Scientific Validations</span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed max-w-2xl">
              Explore in-depth documentation, phytochemical mechanisms, ecological research, and ancestral records verified by Setu AI.
            </p>
          </div>

          <button
            onClick={onShareKnowledgeClick}
            className="self-start md:self-auto px-6 py-3.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-black rounded-2xl shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:shadow-brand-primary/40 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center space-x-2 shrink-0"
          >
            <span>🤝</span>
            <span>Share Knowledge</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="relative z-10 pt-2 flex flex-col md:flex-row gap-3">
          <div className="flex-grow flex items-center bg-slate-50 border border-slate-200/60 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
            <span className="pl-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search online knowledge by topic, science, author, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none px-3 py-2 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-brand-primary hover:bg-brand-hover text-white shadow-md shadow-brand-primary/25'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            onClick={() => setActiveArticle(art)}
            className="bg-white rounded-3xl border border-slate-100/90 shadow-xs hover:shadow-xl hover:border-amber-200 transition-all duration-300 p-6 flex flex-col justify-between cursor-pointer group space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl p-2.5 rounded-2xl bg-amber-50 border border-amber-100/80 group-hover:scale-110 transition-transform">
                  {art.icon}
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  ⏱️ {art.readTime}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  {art.category} • {art.region}
                </span>
                <h3 className="font-bold text-base text-slate-900 leading-snug group-hover:text-brand-primary transition-colors mt-1">
                  {art.title}
                </h3>
              </div>

              <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3">
                {art.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium text-[11px]">By {art.author}</span>
              <span className="text-brand-primary font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                <span>Read Article</span>
                <span>→</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Modal */}
      {activeArticle && (
        <div
          onClick={() => setActiveArticle(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-100 text-left relative space-y-5 my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                <span>{activeArticle.icon}</span>
                <span>{activeArticle.category}</span>
                <span>•</span>
                <span>{activeArticle.region}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {activeArticle.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Research Record by <span className="font-bold text-slate-800">{activeArticle.author}</span> • {activeArticle.readTime}
              </p>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line p-4 rounded-2xl bg-slate-50 border border-slate-100">
              {activeArticle.fullContent}
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <span>🔬</span>
                <span>Key Scientific Validations:</span>
              </h4>
              <div className="space-y-1.5">
                {activeArticle.scientificPoints.map((pt, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start space-x-2">
                    <span>✓</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-900 space-y-0.5">
              <span className="font-bold">⚠️ Precaution &amp; Handling Note:</span>
              <p>{activeArticle.precautions}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

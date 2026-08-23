import React, { useState, useEffect, useCallback } from 'react';
import LibraryCard from './components/LibraryCard';
import VersionHistoryPanel from './components/VersionHistoryPanel';
import {
  fetchKnowledgeEntries,
  fetchPassportSummary,
  fetchVersionHistory,
  fetchProvenanceTimeline,
  verifyPassportIntegrity
} from './api/knowledgeApi';
import { listLearningPaths } from './api/learningPathsApi';

const CATEGORIES = ['All', 'Agriculture', 'Health', 'Traditional Skills', 'Recipes', 'Technology'];
const CONTENT_TYPES = ['All', 'Article', 'Audio', 'Video', 'PDF'];

const fallbackMockEntries = [
  {
    id: 'mock-1',
    title: 'Natural Pest Control with Neem & Cow Urine Extract (Neemastra)',
    category: 'Agriculture',
    contributor: 'Harbhajan Singh',
    location: 'Punjab',
    description: 'An ancient organic biopesticide preparation that repels over 200 species of leaf-chewing insects without toxic chemical residues.',
    summary: 'A time-tested herbal biopesticide concocted by fermenting crushed neem leaves (Azadirachta indica), wild garlic cloves, and aged cow urine for 14 days.',
    traditionalMethod: 'Crush 5kg fresh neem leaves into a paste. Steep in 10 liters of fermented cow urine in a shaded clay urn for 14-21 days.',
    scientificExplanation: 'Azadirachtin disrupts the ecdysone steroid hormone cycle in insect larvae, halting metamorphosis.',
    benefits: 'Zero chemical runoff toxicity, cost-effective for smallholder farmers, and enhances plant leaf immunity naturally.',
    precautions: 'Dilute at a 1:20 ratio with fresh water prior to spraying to prevent foliar leaf scorch.',
    contentType: 'Article',
    readTime: '4 min read'
  },
  {
    id: 'mock-2',
    title: 'Centering River Clay on Stone Potter Wheel & Water Evaporation',
    category: 'Traditional Skills',
    contributor: 'Sita Devi',
    location: 'Rajasthan',
    description: 'Tactile techniques of wedging, centering, and throwing micro-porous earthen matkas that naturally chill drinking water.',
    summary: 'Master craftswoman Sita Devi demonstrates hand position, rotational momentum physics, and clay moisture balance required to throw unglazed water pots.',
    traditionalMethod: 'Harvest fine riverbed alluvial silt. Wedge repeatedly on granite slabs to exhaust all trapped air pockets.',
    scientificExplanation: 'Microscopic interconnected pores in fired terracotta enable continuous capillary action and surface evaporative cooling.',
    benefits: 'Maintains drinking water temperature 8-10°C below ambient without electricity while adding trace essential minerals.',
    precautions: 'Sun-dry slowly in shaded ambient air before firing to avoid structural thermal fractures in kilns.',
    contentType: 'Video',
    readTime: '8 min video'
  },
  {
    id: 'mock-3',
    title: 'Sprouted Finger Millet (Ragi Ambali) Probiotic Porridge',
    category: 'Recipes',
    contributor: 'Savitri Devi',
    location: 'Tamil Nadu',
    description: 'Nutrient-rich traditional breakfast porridge providing sustained energy, high bioavailable calcium, and digestive probiotics.',
    summary: 'Grandmother Savitri Devi details the 36-hour germination and slow-roasting process that unlocks finger millet nutrients for growing children and seniors.',
    traditionalMethod: 'Soak whole Ragi grains for 12 hours. Wrap tightly in moist muslin cloth for 24 hours until sprouts appear.',
    scientificExplanation: 'Sprouting activates endogenous alpha-amylase and phytase enzymes, breaking down phytic acid bound minerals.',
    benefits: 'High dietary calcium density (344mg/100g), extremely low glycemic index, and rich in natural prebiotic fibers.',
    precautions: 'Cook on gentle low flame while continuously stirring to prevent starch clump formations.',
    contentType: 'Audio',
    readTime: '5 min audio'
  },
  {
    id: 'mock-4',
    title: 'Ayurvedic Respiratory Decoction (Tulsi & Ginger Kashayam)',
    category: 'Health',
    contributor: 'Dr. Madhavan',
    location: 'Kerala',
    description: 'Ancestral multi-herb decoction combining crushed holy basil, fresh ginger root, black pepper, and licorice to relieve chest congestion.',
    summary: 'Classical Ayurvedic water extraction concentrating anti-inflammatory gingerols and immunomodulatory terpenes without synthetic pharmaceuticals.',
    traditionalMethod: 'Simmer 10 Tulsi leaves, 1-inch crushed ginger, and 3 peppercorns in 2 cups water until reduced to exactly 1 cup.',
    scientificExplanation: 'Gingerols inhibit COX-2 inflammatory pathways while piperine in black pepper enhances bioavailability by 2000%.',
    benefits: 'Clears bronchial airways, soothes sore throats, and strengthens upper respiratory immunity naturally.',
    precautions: 'Never boil raw honey; add honey only after the decoction cools to lukewarm.',
    contentType: 'Article',
    readTime: '4 min read'
  },
  {
    id: 'mock-5',
    title: 'Dry-Stone Check Dams (Bori Bandh) & Groundwater Recharge',
    category: 'Technology',
    contributor: 'Village Watershed Collective',
    location: 'Gujarat',
    description: 'Non-cemented gravity masonry check dams constructed across seasonal stream gullies to decelerate flash floods and replenish aquifers.',
    summary: 'Interlocking dry-stone engineering that dissipates flood kinetic energy and channels clear water into sand-filtered percolation recharge wells.',
    traditionalMethod: 'Stack heavy angular basalt stones in interlocking trapezoidal courses without cement mortar along natural contour gullies.',
    scientificExplanation: 'Porous void spaces reduce flood velocity from 3.5 m/s to 0.4 m/s, giving water residence time for deep subterranean infiltration.',
    benefits: 'Raises village water tables by 4 meters, eliminates summer drinking water scarcity, and halts fertile topsoil erosion.',
    precautions: 'Desilt the upstream gravel filter beds annually before the onset of monsoon rains.',
    contentType: 'PDF',
    readTime: '6 min read'
  },
  {
    id: 'mock-6',
    title: 'Earthquake-Resilient Bamboo Joinery & Living Bridge Construction',
    category: 'Traditional Skills',
    contributor: 'Tenzing Norbu',
    location: 'Assam',
    description: 'Indigenous seismic architecture using river-cured Bambusa balcooa, fish-mouth mortise joints, and flexible rattan lashings.',
    summary: 'Traditional construction method perfected in high seismic zones where natural tensile elasticity absorbs ground tremors without structural collapse.',
    traditionalMethod: 'Submerge mature bamboo culms in flowing river water for 21 days to leach out sugars, and join using split rattan cane lashings.',
    scientificExplanation: 'Hollow cylindrical botany provides exceptional strength-to-weight ratios; starch removal makes the wood immune to beetle larvae.',
    benefits: '100% carbon-negative construction, zero cement dependency, and 30+ year lifespan with natural thermal insulation.',
    precautions: 'Elevate column bases on river rock plinths to prevent soil moisture capillary dampness.',
    contentType: 'Video',
    readTime: '9 min video'
  },
  {
    id: 'mock-7',
    title: 'Ancient Chola Teak Wood Carving & Temple Relief Restoration',
    category: 'Traditional Skills',
    contributor: 'Master S. Muthukumar',
    location: 'Tamil Nadu',
    description: 'Hand-carved architectural panels following Shilpa Shastra proportions with 32 specialized carbon-steel chisels and beeswax patina.',
    summary: 'Master artisan Muthukumar details natural air-seasoning, grain alignment, and hand-rubbed linseed beeswax finish that lasts for centuries.',
    traditionalMethod: 'Carve seasoned country teak along natural grain orientation and buff with warm beeswax and cold-pressed linseed oil.',
    scientificExplanation: 'High natural tectoquinone resin content in country teak heartwood permanently resists termite and moisture rot.',
    benefits: 'Preserves ancient cultural architecture, creates lifelong family heirlooms, and uses zero toxic fumes or lacquers.',
    precautions: 'Always chisel with the wood grain direction to prevent fiber splintering.',
    contentType: 'Video',
    readTime: '7 min video'
  },
  {
    id: 'mock-8',
    title: 'Natural Indigo Fermentation & Handloom Cotton Weaving',
    category: 'Traditional Skills',
    contributor: 'Radha Bai',
    location: 'Madhya Pradesh',
    description: 'Authentic fermented indigo reduction vats utilizing wood ash lye and jaggery to dye hand-spun organic cotton sized with rice starch.',
    summary: 'Heritage textile craft from Chanderi where yellow-green reduced indigo oxidizes into royal blue upon contact with atmospheric oxygen.',
    traditionalMethod: 'Ferment Indigofera leaf cakes with wood ash water and jaggery in terracotta cisterns; handloom weave on pit looms.',
    scientificExplanation: 'Atmospheric oxygen locks insoluble indigotin pigment molecules deep within the hollow lumen of cotton cellulose fibers.',
    benefits: 'Zero chemical dye wastewater, non-toxic to artisan skin, and produces breathable, thermally adaptive summer fabrics.',
    precautions: 'Keep the dye vat strictly anaerobic during resting hours to prevent surface scum oxidation.',
    contentType: 'Article',
    readTime: '5 min read'
  },
  {
    id: 'mock-9',
    title: 'Aerobic Jeevamrutha Microbial Soil Catalyst & Bio-Fertilizer',
    category: 'Agriculture',
    contributor: 'Balwinder Singh',
    location: 'Punjab',
    description: 'Multiplying billions of phosphate-solubilizing microbes using 48-hour aerobic fermentation of desi cow dung, pulse flour, and forest soil.',
    summary: 'Organic bio-catalyst developed in Natural Farming that activates dormant soil micro-flora and brings native earthworms back to farmland.',
    traditionalMethod: 'Mix 200L water, 10kg desi cow dung, 10L urine, 2kg jaggery, 2kg besan, and virgin soil; ferment in shade for 72 hours.',
    scientificExplanation: 'Logarithmic microbial multiplication produces humic and fulvic acids that solubilize locked insoluble soil phosphorus and potassium.',
    benefits: 'Eliminates synthetic NPK fertilizers, increases soil water-holding capacity by 40%, and restores living soil ecology.',
    precautions: 'Use within 7 to 10 days of preparation while bacterial colonies are actively vigorous.',
    contentType: 'Video',
    readTime: '6 min video'
  },
  {
    id: 'mock-10',
    title: 'Clay Pitcher Sub-Surface Drip Irrigation (Ghara Sinchai)',
    category: 'Technology',
    contributor: 'Madan Lal',
    location: 'Rajasthan',
    description: 'Ultra-low-cost desert irrigation using buried unglazed earthen pots that release moisture directly to root zones via soil matric suction.',
    summary: 'Ancient Thar desert hydrology method where unglazed clay walls automatically weep water when soil is dry and halt when soil is saturated.',
    traditionalMethod: 'Bury 15-liter unglazed terracotta pots in crop beds up to their necks, surround with seedlings, and cover with clay lids.',
    scientificExplanation: 'Soil moisture tension gradient pulls water through porous clay micro-channels with zero surface evaporation loss.',
    benefits: 'Saves 80% water in arid climates, eliminates plastic drip line clogging, and requires zero electricity or pumps.',
    precautions: 'Keep pitcher openings tightly sealed with clay saucers to prevent mosquito breeding and evaporation.',
    contentType: 'PDF',
    readTime: '5 min read'
  },
  {
    id: 'mock-11',
    title: 'Navadanya 9-Crop Intercropping & Soil Moisture Conservation',
    category: 'Agriculture',
    contributor: 'Govindappa',
    location: 'Karnataka',
    description: 'Ancestral multi-canopy biodiversity farming sowing 9 traditional desi grains, pulses, oilseeds, and fiber crops simultaneously.',
    summary: 'Vedic agro-ecological polyculture where multi-tier root depths access distinct soil moisture layers, insuring farmers against severe drought.',
    traditionalMethod: 'Mix 9 traditional seeds in balanced volumetric ratios and sow with wooden bullock ploughs in concentric rows.',
    scientificExplanation: 'Niche differentiation allows multi-tiered root systems and foliage canopies to capture 100% of sunlight without nutrient competition.',
    benefits: 'Guarantees food and fodder yield even during erratic monsoons and continuously fixes atmospheric nitrogen.',
    precautions: 'Test germination percentages of all 9 seed varieties before blending to maintain optimal crop density.',
    contentType: 'Article',
    readTime: '6 min read'
  },
  {
    id: 'mock-12',
    title: 'Ancestral Sun-Cured Mango Pickle with Cold-Pressed Mustard Oil',
    category: 'Recipes',
    contributor: 'Parvati Bai',
    location: 'Uttar Pradesh',
    description: 'Ancestral preservation technique utilizing Himalayan rock salt, hand-pounded fenugreek, and cold-pressed mustard oil for 4+ year shelf life.',
    summary: 'Traditional Indian pickling combining solar desiccation, osmotic moisture control, and lipid immersion in ceramic Martaban urns.',
    traditionalMethod: 'Dry-salt raw mango chunks for 48 hours, sun-dry on cotton sheets for 8 hours, and submerge in spiced cold-pressed mustard oil.',
    scientificExplanation: 'High osmotic pressure from rock salt and antimicrobial isothiocyanates in raw mustard oil inhibit bacterial and fungal spores.',
    benefits: 'Provides live natural probiotics for gut flora, zero chemical preservatives, and prevents seasonal post-harvest crop waste.',
    precautions: 'Use completely dry wooden spoons; any water droplet breaks the sterile lipid seal and causes mold.',
    contentType: 'Audio',
    readTime: '5 min audio'
  }
];

export default function LibraryPage({ onContribute }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedContentType, setSelectedContentType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6); // Incremental pagination: initial 6 items
  
  // Server-side pagination and offline states
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [hasMoreServer, setHasMoreServer] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedCard, setSelectedCard] = useState(null);
  const [aiSummaryCard, setAiSummaryCard] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Passport UI States
  const [activeModalTab, setActiveModalTab] = useState('details');
  const [passportSummary, setPassportSummary] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);
  const [loadingPassportData, setLoadingPassportData] = useState(false);

  const [learningPaths, setLearningPaths] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function initLoad() {
      setLoading(true);
      setIsBackendOffline(false);
      try {
        const apiData = await fetchKnowledgeEntries({
          category: selectedCategory,
          contentType: selectedContentType,
          q: searchQuery,
          skip: 0,
          limit: 6
        });

        if (isMounted) {
          setEntries(apiData);
          setHasMoreServer(apiData.length === 6);
          setVisibleCount(6);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Backend API unavailable, using fallback mock library data:', err.message);
          setIsBackendOffline(true);
          const filteredMock = fallbackMockEntries.filter((item) => {
            const matchCat = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
            const matchType = selectedContentType === 'All' || item.contentType.toLowerCase() === selectedContentType.toLowerCase();
            const matchSearch =
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.contributor.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchType && matchSearch;
          });
          setEntries(filteredMock);
          setVisibleCount(6);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initLoad();
    return () => { isMounted = false; };
  }, [selectedCategory, selectedContentType, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    listLearningPaths()
      .then((data) => {
        if (isMounted) setLearningPaths(Array.isArray(data) ? data : data?.items || []);
      })
      .catch(() => {
        // Learning paths optional fallback
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedCard || !selectedCard.id || selectedCard.id.startsWith('mock-')) {
      setPassportSummary(null);
      setVersionHistory([]);
      setTimelineEvents([]);
      setSelectedHistoryVersion(null);
      setVerificationResult(null);
      setActiveModalTab('details');
      return;
    }

    let isMounted = true;
    async function loadPassportData() {
      setLoadingPassportData(true);
      setActiveModalTab('details');
      setSelectedHistoryVersion(null);
      setVerificationResult(null);
      try {
        const [passport, versions, timeline] = await Promise.all([
          fetchPassportSummary(selectedCard.id).catch(() => null),
          fetchVersionHistory(selectedCard.id).catch(() => []),
          fetchProvenanceTimeline(selectedCard.id).catch(() => ({ timeline: [] }))
        ]);

        if (isMounted) {
          setPassportSummary(passport);
          setVersionHistory(versions || []);
          setTimelineEvents(timeline?.timeline || []);
        }
      } catch (err) {
        console.error('Failed to load passport info:', err);
      } finally {
        if (isMounted) setLoadingPassportData(false);
      }
    }
    loadPassportData();
    return () => { isMounted = false; };
  }, [selectedCard]);

  const handleVerifyIntegrity = async () => {
    if (!selectedCard) return;
    setVerifyingIntegrity(true);
    setVerificationResult(null);
    try {
      const res = await verifyPassportIntegrity(selectedCard.id);
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
      setVerificationResult({
        verified: false,
        message: 'Failed to perform cryptographic verification. Backend offline.'
      });
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  const handleToggleBookmark = useCallback((id) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleReadMore = useCallback((entry) => {
    setSelectedCard(entry);
  }, []);

  const handleAiSummary = useCallback((entry) => {
    setAiSummaryCard(entry);
  }, []);

  const handleShowMore = async () => {
    if (isBackendOffline) {
      setVisibleCount((prev) => prev + 6);
      return;
    }

    setLoadingMore(true);
    try {
      const nextEntries = await fetchKnowledgeEntries({
        category: selectedCategory,
        contentType: selectedContentType,
        q: searchQuery,
        skip: entries.length,
        limit: 6
      });
      setEntries((prev) => [...prev, ...nextEntries]);
      setHasMoreServer(nextEntries.length === 6);
    } catch (err) {
      console.error('Failed to load more entries from server:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const displayedEntries = isBackendOffline ? entries.slice(0, visibleCount) : entries;
  const hasMore = isBackendOffline ? (visibleCount < entries.length) : hasMoreServer;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-8">
        
        {/* Intro Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/60 pb-8 text-left">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/50 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wide">
              Heritage Knowledge Repository
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight pt-1">
              Ancestral Wisdom Library
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Explore verified traditional practices, oral recipes, ecological wisdom, and ancestral craftsmanship cataloged with intelligent scientific explanations.
            </p>
          </div>

          {onContribute && (
            <button
              onClick={onContribute}
              className="px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-full shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap self-start md:self-auto"
            >
              <span>✍️</span>
              <span>Share Knowledge</span>
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-left shadow-xs space-y-5">
          <div className="flex items-center bg-slate-50 border border-slate-200/50 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100/50 transition-all duration-300">
            <span className="pl-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search knowledge by keywords, remedies, or techniques..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(6);
              }}
              className="w-full bg-transparent text-xs focus:outline-none px-3 py-2 text-slate-800 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="pr-3 text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="h-px bg-slate-100"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(6);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-3xs'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Content Type Filter */}
            <div className="flex items-center space-x-2 self-start md:self-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format:</span>
              <select
                value={selectedContentType}
                onChange={(e) => {
                  setSelectedContentType(e.target.value);
                  setVisibleCount(6);
                }}
                className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Learning Paths Section (if present) */}
        {learningPaths.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 md:p-8 text-white text-left space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Guided Curriculums
              </span>
              <span className="text-xs text-blue-200 font-semibold">{learningPaths.length} Active Paths</span>
            </div>
            <h3 className="text-lg font-extrabold">Structured Traditional Learning Paths</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {learningPaths.map((path) => (
                <div key={path.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2">
                  <h4 className="font-bold text-sm text-white">{path.title}</h4>
                  <p className="text-xs text-blue-100 leading-relaxed font-normal">{path.description}</p>
                  <div className="flex items-center justify-between pt-2 text-[10px] font-bold text-blue-200">
                    <span>{path.steps_count || 3} Learning Steps</span>
                    <span className="text-amber-300">★ {path.level || 'Beginner'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cards Grid Section */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Library Archives...</p>
          </div>
        ) : displayedEntries.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedEntries.map((item) => (
                <LibraryCard
                  key={item.id}
                  item={item}
                  onReadMore={handleReadMore}
                  onAiSummary={handleAiSummary}
                  onBookmark={handleToggleBookmark}
                  isBookmarked={bookmarkedIds.includes(item.id)}
                />
              ))}
            </div>

            {/* Show More Posts Button at the Bottom */}
            {hasMore && (
              <div className="pt-4 pb-2 flex flex-col items-center justify-center space-y-2">
                <button
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/40 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center space-x-2.5"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Show More Knowledge Posts</span>
                      {isBackendOffline && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">
                          +{Math.min(6, entries.length - visibleCount)} more
                        </span>
                      )}
                      <span>↓</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isBackendOffline 
                    ? `Showing ${displayedEntries.length} of ${entries.length} knowledge entries`
                    : `Showing ${displayedEntries.length} knowledge entries`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-400 text-xs italic shadow-3xs space-y-2">
            <p className="text-2xl font-normal">🔍</p>
            <p className="font-semibold text-slate-600">No knowledge entries found matching your search criteria.</p>
            <p>Try clearing filters or search query.</p>
          </div>
        )}

      </div>

      {/* Read More Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 p-8 text-left space-y-6 overflow-y-auto max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedCard.category}
              </span>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{selectedCard.title}</h2>
              <p className="text-xs text-slate-400 font-semibold">Contributed by {selectedCard.contributor}</p>
            </div>

            {/* Tab Switched Header */}
            <div className="flex border-b border-slate-100 space-x-1">
              <button
                onClick={() => setActiveModalTab('details')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeModalTab === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📖 Details
              </button>
              {!selectedCard.id?.startsWith('mock-') && (
                <>
                  <button
                    onClick={() => setActiveModalTab('passport')}
                    className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      activeModalTab === 'passport'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    🛡️ Knowledge Passport
                  </button>
                  <button
                    onClick={() => setActiveModalTab('history')}
                    className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      activeModalTab === 'history'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    📜 Versions ({versionHistory.length})
                  </button>
                  <button
                    onClick={() => setActiveModalTab('timeline')}
                    className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      activeModalTab === 'timeline'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ⏱️ Provenance ({timelineEvents.length})
                  </button>
                </>
              )}
            </div>

            {/* Tab Contents */}
            {activeModalTab === 'details' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{selectedCard.description}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">🌿 Traditional Technique</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{selectedCard.traditionalMethod}</p>
                </div>
              </div>
            )}

            {activeModalTab === 'passport' && (
              <div className="space-y-4">
                {loadingPassportData ? (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loading Passport Summary...</p>
                  </div>
                ) : passportSummary ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Passport Identifier</span>
                        <p className="font-mono text-xs font-bold text-slate-900 mt-1">{passportSummary.passport_id}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Version</span>
                        <p className="text-xs font-bold text-slate-900 mt-1">v{passportSummary.version_number}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trust Score</span>
                        <p className="text-xs font-bold text-emerald-600 mt-1">{(passportSummary.trust_score * 100).toFixed(0)}%</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peer Reviews</span>
                        <p className="text-xs font-bold text-slate-900 mt-1">{passportSummary.verification_count} reviews</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Signature (SHA-256 Content Hash)</span>
                      <p className="font-mono text-[10px] text-slate-600 break-all select-all">{passportSummary.content_hash}</p>
                    </div>

                    {/* Cryptographic Integrity Verification Panel */}
                    <div className="bg-blue-50/30 border border-blue-200/50 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-800">Cryptographic Integrity Verification</h4>
                        <button
                          onClick={handleVerifyIntegrity}
                          disabled={verifyingIntegrity}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all animate-pulse"
                        >
                          {verifyingIntegrity ? 'Verifying...' : 'Verify Signature'}
                        </button>
                      </div>
                      
                      {verificationResult && (
                        <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                          verificationResult.verified 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          <p className="font-bold flex items-center space-x-1">
                            <span>{verificationResult.verified ? '✓' : '⚠️'}</span>
                            <span>{verificationResult.verified ? 'Integrity Verification Passed' : 'Verification Issue Detected'}</span>
                          </p>
                          <p className="text-[11px] font-normal leading-relaxed">{verificationResult.message}</p>
                          <div className="pt-2 font-mono text-[10px] space-y-0.5">
                            <p><span className="font-semibold">Computed:</span> {verificationResult.computed_hash}</p>
                            <p><span className="font-semibold">Stored:</span> {verificationResult.stored_hash || 'None'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No passport data available.</p>
                )}
              </div>
            )}

            {activeModalTab === 'history' && (
              <div className="space-y-4">
                <VersionHistoryPanel
                  articleId={selectedCard.id}
                  initialContributor={selectedCard.contributor}
                />
              </div>
            )}

            {activeModalTab === 'timeline' && (
              <div className="space-y-4">
                {timelineEvents.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 text-xs text-left">
                    {timelineEvents.map((evt) => (
                      <div key={evt.id || evt.created_at} className="relative">
                        <span className="absolute -left-[31px] top-1 bg-white border-2 border-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[8px] text-blue-600 font-bold">
                          ✓
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wide">
                              {evt.event_type}
                            </span>
                            <span className="text-[9px] text-slate-400">{new Date(evt.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 font-normal leading-relaxed">{evt.description}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">Verified by: {evt.actor_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No provenance logs recorded.</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  const target = selectedCard;
                  setSelectedCard(null);
                  setAiSummaryCard(target);
                }}
                className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ✨ View AI Summary
              </button>
              <button
                onClick={() => setSelectedCard(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {aiSummaryCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-left animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🤖</span>
                <h3 className="font-extrabold text-base">Setu AI Verification &amp; Summary</h3>
              </div>
              <button
                onClick={() => setAiSummaryCard(null)}
                className="text-white hover:text-blue-100 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {aiSummaryCard.category}
                </span>
                <h4 className="text-md font-bold text-slate-900 mt-2">{aiSummaryCard.title}</h4>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-1">
                  <h5 className="font-bold text-blue-800 uppercase tracking-wider text-[10px]">🔬 Scientific Explanation</h5>
                  <p className="text-slate-600 leading-relaxed font-normal">{aiSummaryCard.scientificExplanation}</p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-1">
                  <h5 className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">✓ Key Benefits</h5>
                  <p className="text-slate-600 leading-relaxed font-normal">{aiSummaryCard.benefits}</p>
                </div>

                {aiSummaryCard.precautions && (
                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-1">
                    <h5 className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">⚠️ Safety Precautions</h5>
                    <p className="text-slate-600 leading-relaxed font-normal">{aiSummaryCard.precautions}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAiSummaryCard(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

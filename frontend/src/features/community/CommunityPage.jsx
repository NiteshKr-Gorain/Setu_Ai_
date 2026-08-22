import React, { useState, useEffect } from 'react';
import organicFarmingImg from '../../assets/organic_farming.png';
import potteryImg from '../../assets/pottery.png';
import ayurvedicRemediesImg from '../../assets/ayurvedic_remedies.png';
import milletRecipesImg from '../../assets/millet_recipes.jpg';
import rainwaterHarvestingImg from '../../assets/rainwater_harvesting.jpg';
import bambooCraftImg from '../../assets/bamboo_craft.png';
import woodCarvingImg from '../../assets/wood_carving.png';
import handloomWeavingImg from '../../assets/handloom_weaving.png';
import neemPesticideImg from '../../assets/neem_pesticide.png';
import compostMakingImg from '../../assets/compost_making.png';
import dripIrrigationImg from '../../assets/drip_irrigation.png';
import cropRotationImg from '../../assets/crop_rotation.png';
import herbalPlantsImg from '../../assets/herbal_plants.png';
import pickleMakingImg from '../../assets/pickle_making.jpg';
import healthyDietImg from '../../assets/healthy_diet.png';
import traditionalSkillsImg from '../../assets/traditional_skills.png';
import solarIrrigationImg from '../../assets/solar_irrigation.jpg';
import { CATEGORIES as BACKEND_CATEGORIES } from '../library/api/knowledgeApi';
import * as mentorsApi from '../../shared/api/mentorsApi';

// Initial verified community skill stories & traditional knowledge posts
const initialStories = [
  {
    id: 1,
    userName: "Ramesh Kumar",
    role: "Elder",
    contributorTitle: "Master Farmer",
    location: "Bihar",
    category: "Agriculture",
    title: "🌱 Organic Farming Techniques & Soil Biology",
    description: "Transitioning to organic farming methods using intercropping and natural bio-inputs has restored our soil biology. By planting legume crops alongside wheat, we naturally fix nitrogen. We completely avoid chemical urea. The soil texture is now dark, rich, and spongy, returning to its natural fertile state.",
    coverImage: organicFarmingImg,
    postedDate: "July 12, 2026",
    likes: 58,
    comments: [
      { id: 1, author: "Amit Singh", text: "Truly inspiring Ramesh ji. We are trying to implement this in our village in UP too." },
      { id: 2, author: "Gurpreet Kaur", text: "Our earthworm count doubled within 6 months using this legume rotation!" }
    ],
    traditionalMethod: "Intercropping beans and maize in a 1:2 row ratio, applying composted organic manure twice per cycle.",
    scientificExplanation: "Legume root nodules house Rhizobium bacteria which convert atmospheric nitrogen into bioavailable ammonium, enhancing crop nutrient absorption naturally.",
    benefits: "Restores soil microbial flora, increases earthworm density, lowers cultivation costs, and produces chemical-free crops.",
    precautions: "Ensure crop spacing is sufficient to prevent leaf shade competition for sunlight.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 2,
    userName: "Sita Devi",
    role: "Expert",
    contributorTitle: "Master Potter",
    location: "Rajasthan",
    category: "Traditional Skills",
    title: "🏺 Traditional Wheel Pottery & Evaporative Water Cooling",
    description: "Shaping river clay on a hand-spun stone potter's wheel is a meditation passed down through generations. Once centered, the hands pull and hollow the clay to shape porous water pots (matkas). These are then fired in straw-insulated kilns using dry leaves and wood. This traditional firing technique is vital for natural water cooling.",
    coverImage: potteryImg,
    postedDate: "July 14, 2026",
    likes: 67,
    comments: [
      { id: 1, author: "Neha Patel", text: "The water stored in these clay pots tastes sweet and is incredibly cooling!" },
      { id: 2, author: "Ananya Roy", text: "How many hours do you bake in the wood pit?" }
    ],
    traditionalMethod: "Wedging alluvial silt clay to remove air bubbles, centering on a heavy wheel, and wood pit kiln baking at 800°C.",
    scientificExplanation: "Wood firing creates micro-porosity in the clay walls, which facilitates slow evaporative cooling of stored drinking water.",
    benefits: "Biodegradable storage wares, keeps drinking water naturally cold without electricity, and preserves cultural art.",
    precautions: "Clay must dry slowly in shade; drying too fast in direct hot sun causes cracking.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "incoming"
  },
  {
    id: 3,
    userName: "Dr. Madhavan",
    role: "Expert",
    contributorTitle: "Ayurvedic Physician",
    location: "Kerala",
    category: "Health",
    title: "🌿 Ayurvedic Home Remedy for Cold & Respiratory Relief (Kashayam)",
    description: "An age-old herbal tea (Kashayam) recipe to relieve cold, dry cough, and seasonal congestion. By boiling fresh ginger root, holy basil (Tulsi) leaves, black pepper, and licorice bark, we create a soothing brew that clears blockages and boosts respiratory health naturally.",
    coverImage: ayurvedicRemediesImg,
    postedDate: "July 15, 2026",
    likes: 74,
    comments: [
      { id: 1, author: "Dr. Ankit", text: "The proportion of black pepper and ginger is critical for bioavailability." }
    ],
    traditionalMethod: "Boiling 5-6 crushed Tulsi leaves, a slice of ginger, and 3 black peppercorns in 1 cup water until halved, sweetening with raw honey when warm.",
    scientificExplanation: "Ginger contains active gingerols with anti-inflammatory properties, Tulsi has immunomodulatory terpenes, and licorice acts as a demulcent to soothe throat irritation.",
    benefits: "Clears respiratory phlegm, reduces throat soreness, and strengthens immunity without synthetic pills.",
    precautions: "Never boil honey, as high heat denatures its beneficial organic enzymes. Add honey only after the tea has cooled to lukewarm.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 4,
    userName: "Savitri Devi",
    role: "Elder",
    contributorTitle: "Nutritional Elder",
    location: "Tamil Nadu",
    category: "Recipes",
    title: "🍲 Sprouted Finger Millet Porridge (Ragi Ambali Superfood)",
    description: "Sharing our family recipe for Sprouted Finger Millet (Ragi) porridge. Sprouting the Ragi seeds overnight increases their nutritional content. We then sun-dry, roast, and grind them into flour. Boiled with water and diluted with buttermilk and green chilies, it makes a nutrient-rich breakfast.",
    coverImage: milletRecipesImg,
    postedDate: "July 16, 2026",
    likes: 49,
    comments: [
      { id: 1, author: "Rahul Dev", text: "Perfect breakfast drink for hot summers! Easy to digest too." }
    ],
    traditionalMethod: "Soaking millet for 12 hours, sprouting in a damp cotton cloth, drying, roasting, grinding to powder, and cooking on a low fire stove.",
    scientificExplanation: "Germination activates amylase enzymes that pre-digest starches, making calcium, iron, and amino acids highly bioavailable.",
    benefits: "High calcium density, extremely low glycemic index, gluten-free, and gives hours of sustained physical energy.",
    precautions: "Cook on low flame and stir continuously to avoid lump formation.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "connected"
  },
  {
    id: 5,
    userName: "Village Watershed Collective",
    role: "Expert",
    contributorTitle: "Hydrology Keepers",
    location: "Gujarat",
    category: "Technology",
    title: "💧 Dry-Stone Check Dams (Bori Bandh) & Aquifer Recharge",
    description: "Our village restored two ancient rainwater check dams (boris) to capture monsoon runoff. This gravity-fed design redirects surface water into dry brick-lined wells, replenishing our shallow water table. We have managed to raise the groundwater level by 4 meters, securing our village well water for the dry seasons.",
    coverImage: rainwaterHarvestingImg,
    postedDate: "July 10, 2026",
    likes: 82,
    comments: [
      { id: 1, author: "Siddharth Rajan", text: "This is a great example of combining community effort with ecological engineering." }
    ],
    traditionalMethod: "Building low-cost dry-stone check dams across monsoon pathways and channeling runoff into sandy recharge pits.",
    scientificExplanation: "Recharge pits act as physical sand-filters, removing silt and debris while allowing gravity percolation to feed aquifers.",
    benefits: "Replenishes groundwater tables, resolves village summer drinking water crises, and controls soil erosion.",
    precautions: "Desilt recharge basins before the onset of monsoon rains to prevent clay scaling blockages.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 6,
    userName: "Tenzing Norbu",
    role: "Expert",
    contributorTitle: "Bamboo Architect",
    location: "Assam",
    category: "Traditional Skills",
    title: "🎋 Earthquake-Resilient Bamboo Joinery & Living Bridges",
    description: "In our northeastern hills, bamboo construction has withstood major seismic tremors for centuries. We cure culms of mature Bambusa balcooa in running river water to leach out fermentable sugars, preventing borer beetles. Using mortise-and-tenon rattan lashings without iron nails allows the structures to flex harmoniously with earth vibrations.",
    coverImage: bambooCraftImg,
    postedDate: "July 18, 2026",
    likes: 53,
    comments: [
      { id: 1, author: "Arjun Barua", text: "The flexibility of river-cured bamboo is unbelievable during high winds!" }
    ],
    traditionalMethod: "Harvesting mature 3-year bamboo during waning moon, water soaking for 21 days, and flame-straightening with herbal smoke.",
    scientificExplanation: "Removing free starch starves beetle larvae, while high natural tensile strength (comparable to structural steel) absorbs dynamic seismic shear forces.",
    benefits: "Carbon-negative housing, zero cement dependence, 30+ year lifespan, and 100% natural thermal insulation.",
    precautions: "Keep bamboo footing 18 inches elevated on river stone pillars to avoid capillary soil dampness.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 7,
    userName: "Master S. Muthukumar",
    role: "Elder",
    contributorTitle: "Heritage Wood Sculptor",
    location: "Tamil Nadu",
    category: "Traditional Skills",
    title: "🪵 Ancient Teak Wood Carving & Temple Relief Restoration",
    description: "Carving intricate architectural temple panels from seasoned country teak (Tectona grandis). By following the traditional Shilpa Shastra geometry, we shape relief figures using 32 specialized hand chisels. The finished carvings are protected with cold-pressed linseed oil and pure beeswax, creating a protective patina that lasts for centuries.",
    coverImage: woodCarvingImg,
    postedDate: "July 20, 2026",
    likes: 61,
    comments: [
      { id: 1, author: "K. Natarajan", text: "The depth and expression on the temple door panels are pure mastery." }
    ],
    traditionalMethod: "Using naturally air-seasoned country teak, tracing with charcoal on tracing cloth, and hand-carving along grain orientation.",
    scientificExplanation: "High natural tectoquinone content in heartwood resists white ants and fungal rot without any toxic synthetic chemical lacquers.",
    benefits: "Preserves ancient architectural heritage, creates lifelong heirlooms, and uses zero toxic fumes.",
    precautions: "Always carve with the wood grain, never across the grain, to prevent fiber tear-out.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 8,
    userName: "Radha Bai",
    role: "Expert",
    contributorTitle: "Master Weaver",
    location: "Madhya Pradesh",
    category: "Traditional Skills",
    title: "🧵 Natural Indigo Dyeing & Handloom Cotton Weaving",
    description: "Weaving breathable gossamer Chanderi cotton using authentic fermented indigo vats. The raw cotton yarn is hand-spun on charkhas and sized with fermented rice starch (Maandi). We submerge the yarn in ancestral vats fed with wood ash lye and jaggery. The green fabric turns into rich royal indigo only when exposed to atmospheric oxygen.",
    coverImage: handloomWeavingImg,
    postedDate: "July 22, 2026",
    likes: 72,
    comments: [
      { id: 1, author: "Meera Sen", text: "The fabric feels like a cool second skin in 45°C summer heat!" }
    ],
    traditionalMethod: "Fermenting Indigofera tinctoria leaves with lime and jaggery in terracotta cisterns, hand-dipping yarn 8 times.",
    scientificExplanation: "Leuco-indigo in the reduced alkaline vat oxidizes upon contact with ambient O₂ into insoluble indigotin pigment locked deep in cellulose fibers.",
    benefits: "Zero chemical wastewater, protects artisan skin health, and creates thermally adaptive breathable fabric.",
    precautions: "Keep the indigo vat strictly anaerobic during resting hours to prevent premature surface scum oxidation.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 9,
    userName: "Kavita Deshmukh",
    role: "Expert",
    contributorTitle: "Natural Farming Pioneer",
    location: "Maharashtra",
    category: "Agriculture",
    title: "🍃 Neem-Karanj Natural Bio-Pesticide (Neemastra Formulation)",
    description: "Protecting our pomegranate and cotton crops from sucking pests and caterpillars using 100% farm-sourced Neemastra. We crush fresh neem leaves, karanj seeds, and green chilies in aged cow urine. After 48 hours of shade fermentation, this extract repels bollworms, aphids, and whiteflies without killing honeybees or beneficial ladybird beetles.",
    coverImage: neemPesticideImg,
    postedDate: "July 24, 2026",
    likes: 89,
    comments: [
      { id: 1, author: "Subhash Patel", text: "Saved me Rs 18,000 in synthetic sprays on my 4-acre cotton plot!" }
    ],
    traditionalMethod: "Crushing 5kg neem leaves + 2kg karanj leaves in 10 liters desi cow urine; stirring clockwise twice daily for 2 days.",
    scientificExplanation: "Azadirachtin acts as an anti-feedant and disrupts insect ecdysis (molting), while capsaicin in chili repels larval borers naturally.",
    benefits: "Zero chemical pesticide residue in food, saves thousands in farm input costs, and protects beneficial pollinator insects.",
    precautions: "Always filter thoroughly with double muslin cloth to prevent nozzle clogging in sprayers; apply in late evening.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 10,
    userName: "Balwinder Singh",
    role: "Elder",
    contributorTitle: "Organic Soil Scientist",
    location: "Punjab",
    category: "Agriculture",
    title: "🪱 Aerobic Jeevamrutha Microbial Soil Catalyst (Bio-Fermentation)",
    description: "Rebuilding dead alkaline farm soil into a living ecosystem using Jeevamrutha. A single gram of fresh desi cow dung contains hundreds of millions of beneficial microbes. Fermenting it for 48 hours with black jaggery, chickpea flour, and virgin forest soil multiplies these colonies exponentially. When applied, earthworms return within 3 weeks.",
    coverImage: compostMakingImg,
    postedDate: "July 26, 2026",
    likes: 95,
    comments: [
      { id: 1, author: "Harpreet Singh", text: "Our soil pH dropped from 8.6 to 7.2 over 2 seasons using Jeevamrutha!" }
    ],
    traditionalMethod: "200L water + 10kg fresh cow dung + 10L cow urine + 2kg jaggery + 2kg besan + handful virgin soil; ferment in shade for 72h.",
    scientificExplanation: "Exponential logarithmic microbial bloom produces plant-available humic acids and solubilizes locked insoluble soil phosphorus.",
    benefits: "Eliminates synthetic NPK fertilizers, increases soil water-holding capacity by 40%, and revives native earthworm populations.",
    precautions: "Must be used within 7 to 10 days of preparation while microbial colonies are actively vigorous.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 11,
    userName: "Parvati Bai",
    role: "Elder",
    contributorTitle: "Culinary Heritage Keeper",
    location: "Uttar Pradesh",
    category: "Recipes",
    title: "🥒 Ancestral Sun-Cured Raw Mango Pickle with Cold-Pressed Mustard Oil",
    description: "Preserving raw country mangoes (Desi Kairi) using solar heat, Himalayan rock salt, and cold-pressed mustard oil. Our grandmothers taught us to toss the mango chunks in rock salt for 48 hours to draw out moisture, followed by 8 hours of sun drying on clean cotton cloth. Stored in ceramic Martaban jars, it stays fresh for 4+ years without preservatives.",
    coverImage: pickleMakingImg,
    postedDate: "July 27, 2026",
    likes: 64,
    comments: [
      { id: 1, author: "Sunita Verma", text: "The ceramic Martaban jar is the real secret to preventing oil rancidity!" }
    ],
    traditionalMethod: "Salting mango cubes in clay urn, sun-drying for 8 hours, roasting fenugreek and fennel, packing tightly in oil-sealed Martaban jars.",
    scientificExplanation: "High osmotic pressure from rock salt and antimicrobial allyl isothiocyanates in cold-pressed mustard oil prevent fungal and bacterial spore germination.",
    benefits: "Provides live natural probiotics for gut flora, zero chemical preservatives or synthetic vinegar, and zero post-harvest fruit waste.",
    precautions: "Never allow moisture or wet spoons into the jar; moisture breaks the sterile lipid seal and causes surface white mold.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 12,
    userName: "Madan Lal",
    role: "Expert",
    contributorTitle: "Desert Hydrologist",
    location: "Rajasthan",
    category: "Technology",
    title: "☀️ Clay Pitcher Sub-Surface Drip Irrigation (Ghara Sinchai)",
    description: "Farming vegetables in the arid Thar Desert with 80% less water using unglazed earthen pitchers buried up to their necks between crop rows. As the surrounding soil dries, clay micro-pores slowly release moisture directly to plant roots through natural soil matric suction. Zero evaporative water loss under midday desert sun.",
    coverImage: dripIrrigationImg,
    postedDate: "July 28, 2026",
    likes: 78,
    comments: [
      { id: 1, author: "Ghanshyam Gurjar", text: "We grew lush gourds and tomatoes in the middle of 48°C summer with just 1 pitcher per 4 plants." }
    ],
    traditionalMethod: "Burying unglazed 15-liter terracotta pots in soil beds, filling with water, and covering with inverted clay lids.",
    scientificExplanation: "Soil moisture tension gradient pulls water through porous clay walls automatically when soil is dry and halts when soil is saturated.",
    benefits: "Saves 80% water compared to surface flooding, prevents weed growth between rows, and requires zero electricity or plastic drip pipes.",
    precautions: "Cover pitcher openings tightly with clay lids to prevent mosquito breeding and dust contamination.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 13,
    userName: "Govindappa",
    role: "Elder",
    contributorTitle: "Native Seed Conservationist",
    location: "Karnataka",
    category: "Agriculture",
    title: "🌾 Navadanya 9-Crop Intercropping & Soil Moisture Conservation",
    description: "Practicing the ancient Navadanya (Nine Seeds) agro-ecological system on our rainfed farm. By sowing a harmonious blend of cereals (millets), pulses (pigeon pea, cowpea), oilseeds (sesame), and fiber crops simultaneously, the field acts as a self-balancing ecosystem. If monsoon rains are delayed, drought-hardy millets still thrive.",
    coverImage: cropRotationImg,
    postedDate: "July 29, 2026",
    likes: 85,
    comments: [
      { id: 1, author: "Dr. K. Swaminathan", text: "This multi-canopy system provides complete insurance against erratic monsoon climate changes." }
    ],
    traditionalMethod: "Mixing 9 traditional desi seeds in balanced ratios, sowing with indigenous wooden bullock ploughs in concentric rows.",
    scientificExplanation: "Multi-layered root depths (shallow millet roots + deep taproot pulses) access different soil moisture strata without nutrient competition.",
    benefits: "Guarantees crop yield even during severe drought, prevents total farm failure, and continuously enriches soil nitrogen.",
    precautions: "Ensure seed germination rates are tested before mixing to maintain optimal crop density.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 14,
    userName: "Vaidya Laxmi",
    role: "Expert",
    contributorTitle: "Himalayan Herbalist",
    location: "Uttarakhand",
    category: "Health",
    title: "🪴 Cultivating Sacred Himalayan Herbs (Ashwagandha & Brahmi Garden)",
    description: "Growing high-potency medicinal botanicals in high-altitude organic terraced beds. We cultivate Ashwagandha (Withania somnifera) in well-drained sandy loam soil fertilized with decomposed pine needle mulch and wood ash. Harvesting roots during the post-monsoon dormant phase maximizes active withanolide alkaloid concentrations.",
    coverImage: herbalPlantsImg,
    postedDate: "July 30, 2026",
    likes: 71,
    comments: [
      { id: 1, author: "Alok Joshi", text: "The root aroma from mountain-grown Ashwagandha is far stronger than commercial greenhouse varieties." }
    ],
    traditionalMethod: "Sowing seeds during late monsoon on raised terrace beds, weeding manually, and harvesting 150-day roots in dry winter.",
    scientificExplanation: "Moderate moisture stress in well-drained soils triggers secondary metabolite synthesis, increasing withanolide A & B adaptogens.",
    benefits: "Produces certified therapeutic-grade Ayurvedic herbs, supports mountain women collectives, and preserves endangered native flora.",
    precautions: "Avoid waterlogged clay soils which cause root rot within 48 hours; dry harvested roots in shade.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 15,
    userName: "Birsa Munda Tribal Collective",
    role: "Expert",
    contributorTitle: "Forest Wisdom Keepers",
    location: "Jharkhand",
    category: "Traditional Skills",
    title: "🍯 Non-Destructive Wild Forest Honey Harvesting (Apis dorsata)",
    description: "Harvesting pure wild forest honey from giant rock bees (Apis dorsata) without burning nests or killing bees. Using sacred herbal smoke made from dried Shorea robusta (Sal) leaves and lemongrass, bees are gently calmed and moved aside. We cut only the outer honeycomb surplus, leaving the brood comb completely intact for colony survival.",
    coverImage: traditionalSkillsImg,
    postedDate: "July 31, 2026",
    likes: 93,
    comments: [
      { id: 1, author: "Hemant Soren", text: "This sustainable method ensures bee colonies return to the same cliff year after year!" }
    ],
    traditionalMethod: "Harvesting at twilight using cool herbal smoke, climbing with wild vine ropes, and cutting only honey reserve combs.",
    scientificExplanation: "Sal resin smoke contains natural terpenes that tranquilize guard bees without triggering alarm pheromone (isopentyl acetate) defense attacks.",
    benefits: "Safeguards forest wild bee colonies, produces raw medicinal enzyme-rich forest honey, and provides ethical tribal livelihoods.",
    precautions: "Never harvest during rainy periods; always leave minimum 40% of honey reserves for the bee brood.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  },
  {
    id: 16,
    userName: "Anand Varma",
    role: "Expert",
    contributorTitle: "Eco-Architect",
    location: "Himachal Pradesh",
    category: "Technology",
    title: "🧱 Rammed Earth & Cob Sustainable Eco-Housing Architecture",
    description: "Constructing thermally comfortable mountain homes using local subsoil, river sand, straw, and natural lime. By ramming earth in wooden formwork, we create 18-inch thick high-mass walls that absorb solar warmth during sunny mountain days and radiate it back inside during freezing winter nights. Zero cement, zero steel.",
    coverImage: solarIrrigationImg,
    postedDate: "August 2, 2026",
    likes: 88,
    comments: [
      { id: 1, author: "Kunal Pathak", text: "The indoor temperature stays an incredible 21°C even when it is -2°C outside in winter!" }
    ],
    traditionalMethod: "Mixing 70% subsoil + 15% sand + 15% clay with wheat straw and cow dung; pneumatic or wooden pestle ramming into wooden shutters.",
    scientificExplanation: "High thermal inertia creates a 10-to-12 hour thermal lag, balancing extreme diurnal temperature swings naturally.",
    benefits: "90% reduction in building embodied energy, zero air conditioning needed, 100% recyclable, and naturally breathable indoor air.",
    precautions: "Provide deep roof eaves (chhajjas) to protect exterior raw earth walls from direct monsoon rain splashes.",
    isLiked: false,
    isBookmarked: false,
    connectionStatus: "none"
  }
];

const categories = [
  'All',
  'Agriculture',
  'Health',
  'Traditional Skills',
  'Recipes',
  'Technology',
  'Education',
  'Culture'
];

export default function CommunityPage({ userProfile }) {
  const [stories, setStories] = useState(initialStories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleComments, setVisibleComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  const [summaryPost, setSummaryPost] = useState(null);
  const [readMorePost, setReadMorePost] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestLocation, setGuestLocation] = useState('');

  const [titleInput, setTitleInput] = useState('');
  const [catInput, setCatInput] = useState('Agriculture');
  const [descInput, setDescInput] = useState('');
  const [sourceInput, setSourceInput] = useState('Personal Experience');
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImageUrl, setPostImageUrl] = useState('');

  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatInputs, setChatInputs] = useState({});
  const [chatMessages, setChatMessages] = useState({
    "Savitri Devi": [
      { id: 1, sender: "them", text: "Hello! I hope you like my traditional Ragi porridge recipe. Let me know if you have any questions about millet recipes!" }
    ],
    "Sita Devi": [
      { id: 1, sender: "them", text: "Thank you for accepting my connection request! Traditional clay work requires lots of practice. I would love to guide you." }
    ]
  });
  const [isTyping, setIsTyping] = useState(false);

  const [mentors, setMentors] = useState([]);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [mentorsError, setMentorsError] = useState('');
  const [mentorCategoryFilter, setMentorCategoryFilter] = useState('All');
  const [requestingMentorId, setRequestingMentorId] = useState(null);
  const [mentorActionMsg, setMentorActionMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setMentorsLoading(true);
    setMentorsError('');
    mentorsApi
      .listMentors({ category: mentorCategoryFilter })
      .then((data) => {
        if (!cancelled) setMentors(Array.isArray(data) ? data : data?.items || []);
      })
      .catch((err) => {
        if (!cancelled) setMentorsError(err.message || 'Could not load mentors. Is the backend running?');
      })
      .finally(() => {
        if (!cancelled) setMentorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mentorCategoryFilter]);

  const handleRequestMentor = async (mentorUserId) => {
    setRequestingMentorId(mentorUserId);
    setMentorActionMsg('');
    try {
      await mentorsApi.requestMentor(mentorUserId, "Hi! I'd love to learn from your experience on Setu.");
      setMentorActionMsg('Mentorship request sent!');
    } catch (err) {
      setMentorActionMsg(err.message || 'Could not send request. Please sign in first.');
    } finally {
      setRequestingMentorId(null);
      setTimeout(() => setMentorActionMsg(''), 4000);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLike = (id) => {
    setStories(stories.map(story => {
      if (story.id === id) {
        return {
          ...story,
          likes: story.isLiked ? story.likes - 1 : story.likes + 1,
          isLiked: !story.isLiked
        };
      }
      return story;
    }));
  };

  const handleBookmark = (id) => {
    setStories(stories.map(story => {
      if (story.id === id) {
        return {
          ...story,
          isBookmarked: !story.isBookmarked
        };
      }
      return story;
    }));
    const story = stories.find(s => s.id === id);
    if (story) {
      showToast(story.isBookmarked ? "Removed from bookmarks" : "Bookmarked successfully!");
    }
  };

  const handleShare = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/community#story-${id}`);
    showToast("Post link copied to clipboard!");
  };

  const handleCommentToggle = (id) => {
    setVisibleComments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddComment = (e, storyId) => {
    e.preventDefault();
    const commentText = commentInputs[storyId] || '';
    if (!commentText.trim()) return;

    setStories(stories.map(story => {
      if (story.id === storyId) {
        return {
          ...story,
          comments: [
            ...story.comments,
            {
              id: Date.now(),
              author: userProfile ? userProfile.name : "Guest Contributor",
              text: commentText
            }
          ]
        };
      }
      return story;
    }));

    setCommentInputs(prev => ({
      ...prev,
      [storyId]: ''
    }));
  };

  const handleConnectRequest = (userName) => {
    setStories(stories.map(story => {
      if (story.userName === userName) {
        return { ...story, connectionStatus: "pending" };
      }
      return story;
    }));
    showToast(`Connection request sent to ${userName}`);
  };

  const handleAcceptRequest = (userName) => {
    setStories(stories.map(story => {
      if (story.userName === userName) {
        return { ...story, connectionStatus: "connected" };
      }
      return story;
    }));
    if (!chatMessages[userName]) {
      setChatMessages(prev => ({
        ...prev,
        [userName]: [
          { id: 1, sender: "them", text: `Hi! Thank you for connecting. I am looking forward to exchanging knowledge with you.` }
        ]
      }));
    }
    showToast(`You are now connected with ${userName}!`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImageFile(file);
      setPostImageUrl(URL.createObjectURL(file));
    }
  };

  const handleShareSubmit = (e) => {
    e.preventDefault();
    if (!titleInput.trim() || !descInput.trim() || !guestName.trim() || !guestLocation.trim()) {
      showToast("Please fill in all fields.");
      return;
    }

    const defaultImages = {
      'Agriculture': 'https://images.unsplash.com/photo-1593113598332-cd59c5bc3f90?auto=format&fit=crop&w=800&q=80',
      'Health': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80',
      'Traditional Skills': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
      'Recipes': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80',
      'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
    };

    const newStory = {
      id: Date.now(),
      userName: guestName,
      role: 'Contributor',
      contributorTitle: 'Heritage Contributor',
      location: guestLocation,
      category: catInput,
      title: titleInput,
      description: descInput,
      coverImage: postImageUrl || defaultImages[catInput] || defaultImages['Agriculture'],
      postedDate: "Today",
      likes: 0,
      comments: [],
      traditionalMethod: `Knowledge shared based on: ${sourceInput}.`,
      scientificExplanation: "Verification analysis will be compiled by community experts.",
      benefits: "Supports traditional learning.",
      precautions: "Refer to elder coordinates.",
      isLiked: false,
      isBookmarked: false,
      connectionStatus: "none"
    };

    setStories([newStory, ...stories]);
    setTitleInput('');
    setDescInput('');
    setPostImageFile(null);
    setPostImageUrl('');
    setGuestName('');
    setGuestLocation('');
    setShowShareModal(false);
    showToast("Knowledge shared successfully! Posted to feed.");
  };

  const handleSendMessage = (e, userName) => {
    e.preventDefault();
    const input = chatInputs[userName] || '';
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "me",
      text: input
    };

    setChatMessages(prev => ({
      ...prev,
      [userName]: [...(prev[userName] || []), newMsg]
    }));

    setChatInputs(prev => ({
      ...prev,
      [userName]: ''
    }));

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Hello! That sounds very interesting. Let me know if you would like to discuss more details or collaborate.";

      if (userName === "Savitri Devi") {
        replyText = "Thank you for the message! I'm happy to help you learn traditional cooking. Ragi is highly beneficial for calcium, especially in the mornings.";
      } else if (userName === "Sita Devi") {
        replyText = "Greetings! Traditional pottery teaches patience. I would be glad to guide you in wedging and centering the river clay.";
      }

      const autoReply = {
        id: Date.now() + 1,
        sender: "them",
        text: replyText
      };

      setChatMessages(prev => ({
        ...prev,
        [userName]: [...(prev[userName] || []), autoReply]
      }));
    }, 1500);
  };

  const filteredStories = stories.filter(story => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = story.title.toLowerCase().includes(query) ||
      story.category.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl z-50 text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Right-Side Icon Button for Share Heritage Knowledge */}
      <div className="fixed bottom-24 right-6 z-40 flex items-center group">
        {/* Tooltip on hover */}
        <div className="absolute right-16 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/50 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
          <span>Share Heritage Knowledge</span>
        </div>

        {/* Ambient Ring Glow */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500 rounded-full blur-md opacity-60 group-hover:opacity-100 group-hover:blur-lg transition-all duration-300 animate-pulse pointer-events-none"></div>

        {/* Main Floating Round Icon Button */}
        <button
          id="floating-share-heritage-button"
          onClick={() => setShowShareModal(true)}
          aria-label="Share Heritage Knowledge"
          title="Share Heritage Knowledge"
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center border-2 border-white/40 transform hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden text-2xl"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <span className="drop-shadow-md transition-transform duration-300 group-hover:rotate-12">✍️</span>
        </button>
      </div>

      {/* AI Summary Modal Overlay */}
      {summaryPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in duration-200 text-left">
            <div className="bg-gradient-to-r from-blue-500 to-orange-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🤖</span>
                <h3 className="font-bold text-md">Setu AI Verified Summary</h3>
              </div>
              <button
                onClick={() => setSummaryPost(null)}
                className="text-white hover:text-orange-100 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold uppercase">
                  {summaryPost.category}
                </span>
                <h4 className="text-md font-bold text-slate-800 mt-2">{summaryPost.title}</h4>
              </div>
              <div className="h-px bg-slate-100"></div>

              <div className="space-y-3.5">
                <div>
                  <h5 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">🌿 Core Practice</h5>
                  <p className="text-xs text-slate-650 leading-relaxed font-normal">{summaryPost.traditionalMethod}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">🔬 Scientific Explanation</h5>
                  <p className="text-xs text-slate-650 leading-relaxed font-normal">{summaryPost.scientificExplanation}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">✓ Benefits</h5>
                  <p className="text-xs text-slate-650 leading-relaxed font-normal">{summaryPost.benefits}</p>
                </div>
                {summaryPost.precautions && (
                  <div>
                    <h5 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">⚠️ Precaution</h5>
                    <p className="text-xs text-slate-650 leading-relaxed font-normal">{summaryPost.precautions}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSummaryPost(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read More Detail Modal */}
      {readMorePost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in duration-200 text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-bold uppercase">
                  {readMorePost.category}
                </span>
                <span className="text-xs text-slate-400">Published {readMorePost.postedDate}</span>
              </div>
              <button
                onClick={() => setReadMorePost(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                <img
                  src={readMorePost.coverImage}
                  alt={readMorePost.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-2">
                  {readMorePost.profilePic && (
                    <img
                      src={readMorePost.profilePic}
                      alt={readMorePost.userName}
                      loading="lazy"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {readMorePost.userName} <span className="text-[10px] text-slate-400 font-medium">({readMorePost.contributorTitle}, {readMorePost.location})</span>
                    </p>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">{readMorePost.role}</p>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">{readMorePost.title}</h3>
              </div>

              <div className="h-px bg-slate-100"></div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{readMorePost.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-orange-50/30 border border-orange-100/50 rounded-2xl p-4">
                    <h5 className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-1">Traditional Practice</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{readMorePost.traditionalMethod}</p>
                  </div>
                  <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-4">
                    <h5 className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Scientific Verification</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{readMorePost.scientificExplanation}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setReadMorePost(null);
                  setSummaryPost(readMorePost);
                }}
                className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                🤖 AI Summary
              </button>
              <button
                onClick={() => setReadMorePost(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Knowledge Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 text-left">
            <div className="border-b border-slate-100 p-5 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-md">Share Heritage Knowledge</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-md font-bold cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleShareSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Anand Patel"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full border border-slate-200/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Your Location</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Gujarat, India"
                    value={guestLocation}
                    onChange={(e) => setGuestLocation(e.target.value)}
                    className="w-full border border-slate-200/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Knowledge Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Rainwater Harvesting in Villages..."
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full border border-slate-200/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Category</label>
                  <select
                    value={catInput}
                    onChange={(e) => setCatInput(e.target.value)}
                    className="w-full border border-slate-200/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium bg-white"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Source</label>
                  <select
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    className="w-full border border-slate-200/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium bg-white"
                  >
                    <option value="Personal Experience">Personal Experience</option>
                    <option value="Family Tradition">Family Tradition</option>
                    <option value="Research">Research</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the practice details, traditional methods, and your direct observations..."
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full border border-slate-200/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase block tracking-wide">Upload Image or Video</label>
                <div className="flex items-center justify-between border border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-colors cursor-pointer bg-slate-50 relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center space-x-3 pointer-events-none">
                    <span className="text-2xl">📸</span>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-700">
                        {postImageFile ? postImageFile.name : "Select photo/video asset"}
                      </p>
                      <p className="text-[10px] text-slate-400">JPG, PNG, MP4 up to 10MB</p>
                    </div>
                  </div>
                </div>
                {postImageUrl && (
                  <img
                    src={postImageUrl}
                    alt="Preview"
                    loading="lazy"
                    className="w-full h-32 object-cover rounded-xl mt-2 border border-slate-100"
                  />
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                >
                  Post to Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Messaging Box */}
      {activeChatUser && (
        <div className="fixed bottom-0 right-4 w-80 bg-white border border-slate-200/80 shadow-2xl rounded-t-3xl z-40 overflow-hidden flex flex-col h-96 animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white shadow-sm">
            <div className="flex items-center space-x-2">
              <img
                src={activeChatUser.avatar}
                alt={activeChatUser.name}
                loading="lazy"
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">{activeChatUser.name}</p>
                <p className="text-[9px] text-blue-100 leading-none">{activeChatUser.role} • {activeChatUser.location}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveChatUser(null)}
              className="text-white hover:text-blue-100 text-xs font-bold font-sans cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50 flex flex-col text-left">
            {(chatMessages[activeChatUser.name] || []).map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${msg.sender === "me"
                    ? "bg-blue-600 text-white self-end rounded-tr-none"
                    : "bg-white text-slate-700 self-start border border-slate-100 rounded-tl-none shadow-3xs"
                  }`}
              >
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="bg-white text-slate-400 px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-slate-100 self-start text-[10px] italic flex items-center space-x-1.5 animate-pulse shadow-3xs">
                <span>💬</span>
                <span>{activeChatUser.name} is writing...</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => handleSendMessage(e, activeChatUser.name)}
            className="p-3 border-t border-slate-100 bg-white flex space-x-2"
          >
            <input
              type="text"
              placeholder="Send message..."
              value={chatInputs[activeChatUser.name] || ''}
              onChange={(e) => setChatInputs({ ...chatInputs, [activeChatUser.name]: e.target.value })}
              className="flex-grow border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-3 py-2 text-xs focus:outline-none font-medium"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* REAL, BACKEND-WIRED SECTION — Mentor Discovery */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                🤝 Find a Mentor
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Real mentors from the Setu community, connected directly to your backend.
              </p>
            </div>
            <select
              value={mentorCategoryFilter}
              onChange={(e) => setMentorCategoryFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-brand-primary bg-white"
            >
              <option value="All">All Categories</option>
              {BACKEND_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {mentorActionMsg && (
            <div className="mb-4 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-4 py-2.5 rounded-2xl">
              {mentorActionMsg}
            </div>
          )}

          {mentorsLoading ? (
            <div className="py-10 text-center">
              <div className="w-8 h-8 mx-auto border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : mentorsError ? (
            <div className="py-8 text-center text-xs font-semibold text-rose-500">{mentorsError}</div>
          ) : mentors.length === 0 ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400">
              No mentors found yet for this category. Create a mentor profile from your Profile page to be the first!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((mentor) => (
                <div key={mentor.user_id} className="border border-slate-100 rounded-2xl p-4 space-y-2.5 hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">{mentor.name || 'Setu Mentor'}</h4>
                    {mentor.rating_count > 0 && (
                      <span className="text-[10px] font-bold text-amber-500">★ {mentor.rating_avg?.toFixed(1)} ({mentor.rating_count})</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(mentor.expertise_categories || []).map((cat) => (
                      <span key={cat} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{cat}</span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold">{mentor.years_of_experience} yrs experience · {mentor.availability}</p>
                  <button
                    onClick={() => handleRequestMentor(mentor.user_id)}
                    disabled={requestingMentorId === mentor.user_id}
                    className="w-full mt-1 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-60"
                  >
                    {requestingMentorId === mentor.user_id ? 'Sending…' : 'Request Mentorship'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Feed */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="space-y-6">

          {/* Category Filter and Search widgets */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 text-left shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow flex items-center bg-slate-50 border border-slate-200/50 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100/50 transition-all duration-300">
                  <span className="pl-3 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Search knowledge by title or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs focus:outline-none px-3 py-2 text-slate-800 placeholder-slate-400 font-medium"
                  />
                </div>
                <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/40 text-[10px] font-bold text-slate-450 uppercase whitespace-nowrap">
                  📄 {filteredStories.length} Verified Stories
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${selectedCategory === 'All'
                      ? 'bg-blue-600 text-white shadow-3xs'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                >
                  All Categories
                </button>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(selectedCategory === c ? 'All' : c)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${selectedCategory === c
                        ? 'bg-blue-600 text-white shadow-3xs'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Stories List - Responsive Grid & Compact Post Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between text-left transition-all duration-300 hover:shadow-md hover:border-slate-200"
                >
                  <div>
                    {/* Header: User, Location, Connections Button */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-50 gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {story.profilePic ? (
                          <img
                            src={story.profilePic}
                            alt={story.userName}
                            loading="lazy"
                            className="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs shrink-0">
                            {story.userName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">{story.userName}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-semibold shrink-0">{story.role}</span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-400 truncate">
                            {story.contributorTitle} • {story.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {userProfile && userProfile.name !== story.userName && (
                          <>
                            {story.connectionStatus === 'none' && (
                              <button
                                onClick={() => handleConnectRequest(story.userName)}
                                className="px-2.5 py-1 border border-blue-200 text-blue-600 hover:bg-blue-50 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                              >
                                Connect
                              </button>
                            )}
                            {story.connectionStatus === 'pending' && (
                              <span className="px-2.5 py-1 border border-slate-200 text-slate-400 text-[10px] font-bold rounded-lg bg-slate-50 select-none">
                                Requested
                              </span>
                            )}
                            {story.connectionStatus === 'incoming' && (
                              <button
                                onClick={() => handleAcceptRequest(story.userName)}
                                className="px-2.5 py-1 bg-orange-500 hover:bg-orange-650 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-3xs"
                              >
                                Accept
                              </button>
                            )}
                            {story.connectionStatus === 'connected' && (
                              <button
                                onClick={() => setActiveChatUser({
                                  name: story.userName,
                                  avatar: story.profilePic || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
                                  role: story.role,
                                  location: story.location
                                })}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-3xs flex items-center space-x-1"
                              >
                                <span>💬</span>
                                <span className="hidden sm:inline">Message</span>
                              </button>
                            )}
                          </>
                        )}

                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200/50 rounded-md text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                          {story.category}
                        </span>
                      </div>
                    </div>

                    {/* Cover photo - Compact aspect ratio */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50 border-b border-slate-50">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    {/* Text contents */}
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] text-slate-400 font-semibold">{story.postedDate}</span>
                      <h3
                        onClick={() => setReadMorePost(story)}
                        className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
                      >
                        {story.title}
                      </h3>
                      <p className="text-slate-600 text-xs leading-relaxed font-normal line-clamp-2">
                        {story.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    {/* Action controls row */}
                    <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleLike(story.id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            story.isLiked ? 'bg-red-50 text-red-650' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                          title="Like"
                        >
                          <span>❤️</span>
                          <span className="text-[11px]">{story.likes}</span>
                        </button>
                        <button
                          onClick={() => handleCommentToggle(story.id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            visibleComments[story.id] ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title="Comments"
                        >
                          <span>💬</span>
                          <span className="text-[11px]">{story.comments.length}</span>
                        </button>
                        <button
                          onClick={() => handleBookmark(story.id)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            story.isBookmarked ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title="Bookmark"
                        >
                          <span>🔖</span>
                        </button>
                        <button
                          onClick={() => handleShare(story.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
                          title="Share"
                        >
                          <span>📤</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setSummaryPost(story)}
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-650 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1"
                          title="AI Summary"
                        >
                          <span>🤖</span>
                          <span className="hidden sm:inline">AI Summary</span>
                        </button>
                        <button
                          onClick={() => setReadMorePost(story)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-650 text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
                        >
                          Read More
                        </button>
                      </div>
                    </div>

                    {/* Comment box */}
                    {visibleComments[story.id] && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments ({story.comments.length})</h4>

                        {story.comments.length > 0 ? (
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {story.comments.map((c) => (
                              <div key={c.id} className="bg-white p-2.5 rounded-xl border border-slate-200/50 text-[11px]">
                                <p className="font-bold text-slate-800 mb-0.5">{c.author}</p>
                                <p className="text-slate-650 leading-relaxed font-normal">{c.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No comments yet. Join the discussion!</p>
                        )}

                        <form onSubmit={(e) => handleAddComment(e, story.id)} className="flex space-x-1.5">
                          <input
                            type="text"
                            placeholder="Type comment..."
                            value={commentInputs[story.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [story.id]: e.target.value })}
                            className="flex-grow bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none font-medium"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

        </div>
      </div>

    </div>
  );
}

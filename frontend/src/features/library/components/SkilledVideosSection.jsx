import React, { useState, useRef, useEffect } from 'react';

// Import authentic local traditional assets
import neemImg from '../../../assets/neem_pesticide.png';
import potteryImg from '../../../assets/pottery.png';
import milletImg from '../../../assets/millet_recipes.jpg';
import ayurvedaImg from '../../../assets/ayurvedic_remedies.png';
import handloomImg from '../../../assets/handloom_weaving.png';
import rainwaterImg from '../../../assets/rainwater_harvesting.jpg';
import bambooImg from '../../../assets/bamboo_craft.png';
import woodCarvingImg from '../../../assets/wood_carving.png';
import organicFarmingImg from '../../../assets/organic_farming.png';
import compostImg from '../../../assets/compost_making.png';
import pickleImg from '../../../assets/pickle_making.jpg';
import herbalImg from '../../../assets/herbal_plants.png';
import tradSkillsImg from '../../../assets/traditional_skills.png';
import dripIrrigationImg from '../../../assets/drip_irrigation.png';
import cropRotationImg from '../../../assets/crop_rotation.png';

export const SKILLED_VIDEOS = [
  {
    id: 'sk-1',
    title: 'Natural Pest Control with Fermented Neem & Cow Urine Extract',
    category: 'Agriculture',
    skillLevel: 'Beginner',
    duration: '8:45',
    contributor: 'Harbhajan Singh',
    location: 'Punjab',
    thumbnail: neemImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/bM5J2m0g57s?rel=0&autoplay=1',
    description: 'Learn the exact fermentation ratio and application timing of neem leaves and aged cow urine to repel 200+ leaf-chewing insect species naturally.',
    aiChapters: [
      { time: '00:15', title: '1. Harvesting Fresh Neem Leaves', detail: 'Pluck 5kg mature green leaves free of fungal blight' },
      { time: '02:10', title: '2. Stone Mortar Crushing', detail: 'Pound leaves to rupture cell walls and release azadirachtin' },
      { time: '04:30', title: '3. Terracotta Steeping with Cow Urine', detail: 'Submerge in 10L aged urine inside earthen pot' },
      { time: '06:50', title: '4. Filtration & Soapberry Emulsification', detail: 'Strain through muslin and add 20g reetha for wetting' }
    ],
    aiCommonQuestions: [
      { q: 'What is the exact dilution ratio before foliar spraying?', a: 'Dilute exactly 500ml of concentrated extract in 10 liters of clean water (1:20 ratio). Never apply undiluted under strong sunlight.' },
      { q: 'Why is aged cow urine superior to fresh?', a: 'Fermentation produces natural ammonia compounds and microbial metabolites that enhance penetration through insect waxy cuticles.' }
    ],
    aiSummary: {
      coreTechnique: 'Crushing neem leaves and steeping in fermented cow urine inside sealed earthen vessels for 14 to 21 days in shaded conditions.',
      scientificValidation: 'Azadirachtin binds to insect ecdysone receptors, blocking metamorphosis without leaving synthetic neurotoxic residues on edible produce.',
      keyBenefits: 'Zero pesticide input cost for small farmers, preserves beneficial honeybee populations, and enhances leaf cuticle resistance.',
      precautions: 'Always dilute at 1:20 with clean water before morning foliar application to prevent sun scorch on tender vegetable shoots.',
      aiScore: '98.8%'
    },
    aiDeepDive: {
      overview: 'This ancestral biopesticide has safeguarded agricultural ecosystems across Northern India for over four centuries. Unlike synthetic chemical insecticides that induce resistance, the complex phytochemical matrix of neem prevents pest adaptation.',
      stepByStep: [
        'Harvest 5kg of fresh, mature green neem leaves and wash with river/well water to remove dust.',
        'Pound the leaves into a coarse paste using a wooden or stone mortar.',
        'Place the paste into a clean terracotta urn and add 10 liters of fermented cow urine.',
        'Tie a breathable muslin cloth over the mouth and store in cool shade for 14-21 days, stirring clockwise once daily.',
        'Filter the concentrated extract through cheesecloth and store in opaque glass or ceramic bottles.',
        'Dilute 500ml of extract in 10 liters of water with 20g of dissolved soapberry (Reetha) as a natural wetting agent before spraying.'
      ],
      toolsRequired: ['Terracotta storage urn', 'Stone mortar and pestle', 'Muslin filtration cloth', 'Handheld brass sprayer'],
      masterTips: 'Prepare batches during the waning moon cycle when fermentation ambient humidity is stable. Add 500g crushed wild garlic to broaden fungicidal potency.',
      ecologicalImpact: 'Replaces expensive organophosphate chemicals and preserves earthworms and beneficial microbial flora in agricultural soils.'
    }
  },
  {
    id: 'sk-2',
    title: 'Centering & Throwing Porous Water Matkas on a Stone Wheel',
    category: 'Traditional Skills',
    skillLevel: 'Master',
    duration: '10:15',
    contributor: 'Sita Devi',
    location: 'Rajasthan',
    thumbnail: potteryImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/sF8zP-4xR5U?rel=0&autoplay=1',
    description: 'Master craftswoman Sita Devi demonstrates the rotational physics, alluvial silt wedging, and thin-wall throwing required for natural evaporative water cooling pots.',
    aiChapters: [
      { time: '00:20', title: '1. Silt Clay Kneading & Ash Blending', detail: 'Foot-knead alluvial silt with 10% sieved wood ash' },
      { time: '03:00', title: '2. Wheel Centering & Spin Momentum', detail: 'Lock 4kg cone on stone wheel with bilateral palm balance' },
      { time: '06:15', title: '3. Thin-Wall Pulling & Belly Shaping', detail: 'Draw uniform 4mm porous walls with wooden paddle support' },
      { time: '08:40', title: '4. Pit Kiln Firing & Slow Cooling', detail: 'Bake at 750°C with dry straw insulation for thermal porosity' }
    ],
    aiCommonQuestions: [
      { q: 'How does a matka cool water without electricity?', a: 'Micro-capillaries within fired terracotta permit slow water weeping. Evaporating water draws latent heat from the pot interior, dropping water temperature by 8-10°C.' },
      { q: 'Why add sieved wood ash to the clay?', a: 'Wood ash introduces silica particles and micro-voids that prevent thermal shock fractures when filled with cold water.' }
    ],
    aiSummary: {
      coreTechnique: 'Centering heavy alluvial river clay on a hand-spun stone wheel, drawing uniform 4mm porous walls, and pit-firing with straw and wood.',
      scientificValidation: 'Interconnected micro-capillaries within fired terracotta promote slow surface water percolation, generating continuous latent heat cooling.',
      keyBenefits: 'Naturally cools drinking water by 8-10°C without electricity, naturally neutralizes acidic water pH, and is 100% biodegradable.',
      precautions: 'Dry freshly thrown pots strictly under shaded thatch roofs; rapid direct sun exposure causes uneven shrinkage and hairline fractures.',
      aiScore: '99.2%'
    },
    aiDeepDive: {
      overview: 'Terracotta pottery is both an ancient craft and thermodynamic engineering. The porosity of the matka walls creates a micro-evaporative cooling chamber that operates effectively in high-temperature arid climates.',
      stepByStep: [
        'Collect silt-rich clay from dry riverbed alluvial deposits and sieve out coarse pebbles.',
        'Add 10% sieved wood ash and fine river sand to create thermal shock resistance.',
        'Wedge clay by kneading with bare feet and hands for 2 hours to eliminate all air bubbles.',
        'Center 4kg of clay onto the spinning stone wheel using palm pressure and water lubrication.',
        'Hollow the core and pull walls upward with steady bilateral finger pressure.',
        'Shape the bellied curvature with a wooden curved paddle while supporting the interior with a smooth round stone anvil.',
        'Slow-dry in ambient shade for 7 days before wood-kiln firing at 750-800°C.'
      ],
      toolsRequired: ['Hand-spun stone wheel', 'Curved wooden paddle (Thapa)', 'Terracotta interior anvil (Pindi)', 'Straw-insulated firing pit'],
      masterTips: 'Rub the dried outer wall with a smooth quartz pebble before firing; this creates a silky burnished finish while keeping micro-pores open.',
      ecologicalImpact: 'Zero carbon footprint storage vessels that replace single-use plastic water coolers and electric refrigeration in rural households.'
    }
  },
  {
    id: 'sk-3',
    title: 'Sprouted Finger Millet (Ragi) Herbal Breakfast Ambali',
    category: 'Recipes',
    skillLevel: 'Beginner',
    duration: '6:30',
    contributor: 'Savitri Devi',
    location: 'Tamil Nadu',
    thumbnail: milletImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/7_rNkJ-1V4Q?rel=0&autoplay=1',
    description: 'Ancestral step-by-step masterclass on germinating, roasting, and fermenting whole Ragi grain into an easily digestible, calcium-dense probiotic breakfast.',
    aiChapters: [
      { time: '00:10', title: '1. Grain Soaking & Sprouting', detail: '24-hour cotton bundle germination for phytase activation' },
      { time: '02:00', title: '2. Sun Drying & Cast-Iron Roasting', detail: 'Slow pan roasting until nutty aroma develops' },
      { time: '03:45', title: '3. Stone Milling & Porridge Cooking', detail: 'Whisk in cold water to prevent lumps; simmer 8 mins' },
      { time: '05:20', title: '4. Overnight Probiotic Fermentation', detail: 'Cool in earthen pot and blend with fresh cultured buttermilk' }
    ],
    aiCommonQuestions: [
      { q: 'Why is sprouted Ragi superior to regular Ragi flour?', a: 'Sprouting neutralizes phytic acid anti-nutrients and triples bio-available calcium (344mg/100g) and iron absorption.' },
      { q: 'Can diabetic individuals consume Ambali?', a: 'Yes! Fermented millet ambali has a low glycemic index (GI < 52) and produces short-chain fatty acids that improve insulin sensitivity.' }
    ],
    aiSummary: {
      coreTechnique: '36-hour grain germination followed by slow sun-drying, light roasting on cast iron, and fermenting porridge with cultured buttermilk.',
      scientificValidation: 'Sprouting activates endogenous phytase enzymes that break down phytic acid complexes, increasing bioavailable calcium and iron absorption by 300%.',
      keyBenefits: 'Provides 344mg calcium per 100g, sustains low-glycemic energy for farmers, and restores healthy gut microbiome.',
      precautions: 'Whisk continuously with cold water before placing on heat to prevent hard starch lumps.',
      aiScore: '97.5%'
    },
    aiDeepDive: {
      overview: 'Ragi Ambali is an ancient staple sustaining agrarian communities through intense heat and physical labor. Germination transforms complex starches into prebiotic maltose and unlocks vital micronutrients.',
      stepByStep: [
        'Soak whole organic finger millet grains in spring or filtered water for 12 hours.',
        'Drain and wrap tightly in a damp unbleached cotton cloth; keep in a dark warm cupboard for 24 hours until white sprout shoots emerge.',
        'Spread sprouted grains on woven bamboo mats to sun-dry completely for 1 day.',
        'Lightly roast in a dry cast-iron skillet over gentle fire until fragrant aroma releases.',
        'Grind into fine flour using stone chakki or heavy mill.',
        'Cook 3 tablespoons of flour in 2 cups of water with rock salt for 8 minutes, cool to lukewarm, and stir in fresh cultured buttermilk and crushed shallots.'
      ],
      toolsRequired: ['Muslin sprouting cloth', 'Cast-iron kadai', 'Traditional stone hand-mill', 'Clay serving earthen pot'],
      masterTips: 'Allow the cooked ambali to ferment overnight in a clay bowl covered with a porous plate for maximum probiotic bio-culture density.',
      ecologicalImpact: 'Promotes climate-resilient, drought-tolerant millets that require 70% less water than paddy rice and zero synthetic nitrogen fertilizer.'
    }
  },
  {
    id: 'sk-4',
    title: 'Indigenous Seed Preservation & Clay Ball Vaulting',
    category: 'Agriculture',
    skillLevel: 'Intermediate',
    duration: '7:20',
    contributor: 'Govind Bhai',
    location: 'Gujarat',
    thumbnail: cropRotationImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/V1bFr2KGq1g?rel=0&autoplay=1',
    description: 'Technique of encapsulating heirloom non-hybrid seeds inside clay-ash matrix balls to protect germplasm from weevils, mold, and humidity for decades.',
    aiChapters: [
      { time: '00:15', title: '1. Heirloom Seed Selection & Drying', detail: 'Harvest non-hybrid seeds and sun-dry to <9% moisture' },
      { time: '02:00', title: '2. Red Clay & Wood Ash Matrix', detail: 'Mix 2 parts clay, 1 part ash, and 0.5 part neem powder' },
      { time: '04:15', title: '3. Hand-Rolling Seed Marbles', detail: 'Encapsulate 3-5 seeds per marble for physical armor' },
      { time: '06:00', title: '4. Earthen Urn (Kothi) Sealing', detail: 'Store with dried nirgundi leaves in airtight clay pots' }
    ],
    aiCommonQuestions: [
      { q: 'How long can seeds survive inside clay balls?', a: 'Heirloom seeds retain 95%+ germination viability for 3-5 years, protected from atmospheric humidity and seed weevils.' },
      { q: 'How do you plant the clay balls?', a: 'Simply place the clay ball directly into the soil during the first monsoon rain; ambient moisture dissolves the clay, feeding the sprout.' }
    ],
    aiSummary: {
      coreTechnique: 'Mixing heirloom seeds with wood ash, fine dry clay, and neem leaf powder to form sealed protective seed marbles.',
      scientificValidation: 'Alkaline ash desorbs moisture and creates an inhospitable anaerobic micro-environment for coleopteran seed weevil larvae.',
      keyBenefits: 'Ensures 95%+ germination viability over 3-5 years without chemical fumigants, protecting indigenous crop sovereignty.',
      precautions: 'Use thoroughly sieved cold ash from untreated wood fires only; hot or coal-treated ash damages seed embryonic tissue.',
      aiScore: '99.0%'
    },
    aiDeepDive: {
      overview: 'Before modern climate-controlled gene banks, Indian seed keepers (Beej Mata) preserved hundreds of heritage rice, pulse, and vegetable varieties using airtight clay vessels and protective ash encapsulation.',
      stepByStep: [
        'Harvest seeds from the healthiest, non-hybrid parent plants at peak physiological maturity.',
        'Sun-dry seeds until moisture content drops below 9%.',
        'Mix 1 part seeds with 2 parts powdered red clay, 1 part wood ash, and 0.5 part dry neem powder.',
        'Add minimal water to roll into small 1-inch marble balls.',
        'Dry the balls completely in shade for 48 hours.',
        'Store inside sealed terracotta urns lined with dried cow dung ash and dried vitex (Nirgundi) leaves.'
      ],
      toolsRequired: ['Fine mesh brass sieve', 'Earthen storage pots (Kothi)', 'Pure wood ash container'],
      masterTips: 'Conduct a float test in salt water prior to encapsulation; discard seeds that float as they have hollow embryonic cavities.',
      ecologicalImpact: 'Safeguards biodiversity of open-pollinated heirloom seeds resilient to climate extremes and local pest pressures.'
    }
  },
  {
    id: 'sk-5',
    title: 'Authentic Ayurvedic Tulsi & Ginger Kashayam Brew',
    category: 'Health & Ayurveda',
    skillLevel: 'Beginner',
    duration: '5:40',
    contributor: 'Dr. V. Sharma',
    location: 'Kerala',
    thumbnail: ayurvedaImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/O_0_kZ32L1Q?rel=0&autoplay=1',
    description: 'Classical Kashayam preparation method balancing volatile gingerols, eugenol, and piperine to clear respiratory congestion and restore digestive Agni.',
    aiChapters: [
      { time: '00:15', title: '1. Fresh Herb Selection', detail: 'Pluck 12 Krishna Tulsi leaves and fresh unpeeled ginger' },
      { time: '01:45', title: '2. Brass Mortar Crushing', detail: 'Crush with black peppercorns to release piperine' },
      { time: '03:10', title: '3. Volume Reduction Decoction', detail: 'Simmer 400ml water down to 200ml on medium flame' },
      { time: '04:50', title: '4. Straining & Lukewarm Honey Blend', detail: 'Strain into clay cup and add raw honey once cooled' }
    ],
    aiCommonQuestions: [
      { q: 'Why must honey only be added when the drink is lukewarm?', a: 'In classical Ayurveda, heating raw honey above 40°C denatures active enzymes and produces toxic metabolic residues (Ama).' },
      { q: 'What is the role of black pepper in the brew?', a: 'Black pepper contains piperine, which increases the systemic bioavailability of gingerols and curcumin by up to 2000%.' }
    ],
    aiSummary: {
      coreTechnique: 'Decoction reduction of fresh Holy Basil (Tulsi), crushed ginger root, black peppercorns, and licorice bark by boiling until liquid volume halves.',
      scientificValidation: 'Eugenol and gingerols exhibit potent immunomodulatory and bronchodilatory properties, while piperine increases systemic bioavailability.',
      keyBenefits: 'Clears airway mucus without drowsiness, relieves seasonal chills, and strengthens mucosal antibody production.',
      precautions: 'Never boil raw honey; always allow the decoction to cool to lukewarm before sweetening to preserve organic enzymes.',
      aiScore: '98.5%'
    },
    aiDeepDive: {
      overview: 'Kashayam is one of the five classical pharmaceutical forms (Panchavidha Kashaya Kalpana) in Ayurvedic pharmacology designed for maximum bioavailability of active botanical compounds.',
      stepByStep: [
        'Pluck 10-12 fresh dark Krishna Tulsi leaves and wash gently.',
        'Crush 1 inch of fresh unpeeled organic ginger and 4 black peppercorns in a brass mortar.',
        'Add 2 cups (400ml) of pure water in a non-reactive clay or stainless steel pot.',
        'Simmer uncovered on medium-low flame until liquid reduces to exactly 1 cup (200ml).',
        'Strain through a fine tea sieve into an earthen cup.',
        'Add a pinch of organic turmeric and 1 teaspoon of raw unprocessed honey once lukewarm.'
      ],
      toolsRequired: ['Brass or stone mortar', 'Non-reactive boiling pot', 'Fine mesh strainer'],
      masterTips: 'Do not boil on high flame; rapid boiling evaporates volatile monoterpenes and essential oils.',
      ecologicalImpact: 'Zero-packaging, zero-synthetic medication utilizing locally grown backyard medicinal herbs.'
    }
  },
  {
    id: 'sk-6',
    title: 'Traditional Handloom Cotton Weaving on Wooden Fly-Shuttle',
    category: 'Traditional Skills',
    skillLevel: 'Master',
    duration: '11:10',
    contributor: 'Radhabai',
    location: 'Madhya Pradesh',
    thumbnail: handloomImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/sPq9X7d69yM?rel=0&autoplay=1',
    description: 'Master handloom artisan demonstrates warp preparation, natural sizing with rice starch, and rhythmic treadle coordination for breathable organic fabric.',
    aiChapters: [
      { time: '00:30', title: '1. Organic Warp Sizing (Maandi)', detail: 'Dip cotton yarn in fermented rice gruel for sheen' },
      { time: '03:15', title: '2. Heddle Drafting & Reed Denting', detail: 'Thread individual warp ends with uniform tension' },
      { time: '06:40', title: '3. Foot Treadle Shedding Rhythms', detail: 'Coordinate dual pedal action to create shed openings' },
      { time: '09:10', title: '4. Wooden Fly-Shuttle Throw & Beat', detail: 'Cast hardwood boat shuttle with seamless selvedge tension' }
    ],
    aiCommonQuestions: [
      { q: 'Why is handloom cotton more breathable than factory mill cloth?', a: 'Handloom interlacing maintains micro-air pockets within the cellulose fibers, whereas industrial high-speed looms crush fiber elasticity.' },
      { q: 'What is the purpose of rice starch sizing?', a: 'Fermented rice starch coats delicate single-ply cotton fibers, preventing friction fraying during thousands of shuttle throws.' }
    ],
    aiSummary: {
      coreTechnique: 'Aligning warp threads through wooden heddles, applying organic rice-gruel sizing for tensile strength, and throwing the hardwood shuttle with precise tension.',
      scientificValidation: 'Low-tension handloom interlacing preserves micro-air pockets within cellulose fibers, maximizing thermal breathability.',
      keyBenefits: '100% natural breathable clothing, zero grid electricity consumed, and sustains rural artisan weaver livelihoods.',
      precautions: 'Maintain optimal ambient room humidity (60-70%) during warp beam winding to prevent brittle single-thread snapping.',
      aiScore: '97.9%'
    },
    aiDeepDive: {
      overview: 'Traditional Indian handloom weaving represents an exquisite harmony of mechanical ergonomics, natural physics, and artisanal discipline perfected across millennia.',
      stepByStep: [
        'Spin indigenous organic short-staple cotton slivers into uniform thread counts.',
        'Wind warp threads across street warping frames in lengths of 30 meters.',
        'Dip warp yarn in warm fermented rice starch broth (Maandi) to coat individual fibers with protective sheen.',
        'Thread individual yarns through reed dents and wooden heddle shafts.',
        'Tie warp ends to the front cloth beam with uniform tension across the entire width.',
        'Coordinate foot treadles to create shed openings while throwing the shuttle smoothly across the race board.'
      ],
      toolsRequired: ['Pit-loom or Frame-loom', 'Hardwood boat shuttle', 'Bamboo reed', 'Revolving bobbin winder'],
      masterTips: 'Keep a small dish of cold mustard oil nearby; lightly dab the wooden shuttle base every hour to reduce friction against warp yarns.',
      ecologicalImpact: 'Zero electricity manufacturing process with 100% biodegradable natural fiber output.'
    }
  },
  {
    id: 'sk-7',
    title: 'Dry-Stone Rainwater Check-Dam (Bori Bandh) Engineering',
    category: 'Eco-Technology',
    skillLevel: 'Intermediate',
    duration: '9:50',
    contributor: 'Village Collective',
    location: 'Gujarat',
    thumbnail: rainwaterImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/rT9bY8Hq2gU?rel=0&autoplay=1',
    description: 'Community watershed technique using interlocking basalt stones and gravel filters to decelerate monsoon runoff and recharge dry village aquifer wells.',
    aiChapters: [
      { time: '00:25', title: '1. Contour Depression Survey', detail: 'Identify stream drainage path and excavate foundation' },
      { time: '02:40', title: '2. Basalt Keystone Anchor Laying', detail: 'Place heavy anchor boulders with 1:2 downstream batter' },
      { time: '05:30', title: '3. Interlocking Void Dressing', detail: 'Pack inner spaces with crushed basalt and gravel' },
      { time: '07:45', title: '4. Vetiver Grass Flank Anchoring', detail: 'Plant deep-root vetiver to prevent abutment erosion' }
    ],
    aiCommonQuestions: [
      { q: 'Why avoid cement when building check dams in rural streams?', a: 'Dry-stone dams are flexible and self-healing. Rigid cement dams crack under monsoon flash flood pressure and block natural aquifer seepage.' },
      { q: 'How much does a check dam raise the local water table?', a: 'A series of 3-4 dry-stone check dams typically raises surrounding well water levels by 3 to 5 meters within 2 monsoon seasons.' }
    ],
    aiSummary: {
      coreTechnique: 'Constructing trapezoidal interlocking dry-stone barriers across seasonal contours and lining upstream face with sand-gravel filter beds.',
      scientificValidation: 'Reduces surface runoff velocity from 3.2 m/s to 0.4 m/s, increasing vertical soil percolation into shallow unconfined aquifers.',
      keyBenefits: 'Raises village water table by 3-5 meters, prevents soil topsoil erosion, and provides year-round well water.',
      precautions: 'Ensure spillway height does not exceed 1.2 meters to prevent hydrostatic pressure blowout during torrential cloudbursts.',
      aiScore: '99.4%'
    },
    aiDeepDive: {
      overview: 'Dry-stone check dams utilize gravity, interlocking stone physics, and granular filtration rather than rigid Portland cement, allowing seasonal flex and self-healing permeability.',
      stepByStep: [
        'Identify natural drainage depression lines along farmland contour boundaries.',
        'Excavate a 45cm deep foundation trench across the streambed into stable subsoil.',
        'Lay large key stones (anchor boulders) at the base with a 1:2 downstream batter slope.',
        'Interlock medium angular stones without mortar, filling inner voids with crushed basalt chips.',
        'Create a depressed central spillway to safely guide overflow during peak flood surges.',
        'Install a 1-meter upstream reverse filter of coarse sand and gravel to trap silt.'
      ],
      toolsRequired: ['Crowbars and iron picks', 'Sledgehammers for stone dressing', 'Plumb-line and water level meter'],
      masterTips: 'Plant vetiver grass (Khus) along both dam abutment flanks; the deep root systems anchor soil banks and prevent flank bypass erosion.',
      ecologicalImpact: 'Restores subterranean water tables, mitigates seasonal droughts, and reverses regional desertification.'
    }
  },
  {
    id: 'sk-8',
    title: 'Traditional Bamboo Joint Crafting & Smoke Seasoning',
    category: 'Traditional Skills',
    skillLevel: 'Intermediate',
    duration: '8:15',
    contributor: 'Sanjeev Burman',
    location: 'Assam',
    thumbnail: bambooImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/u6iKkL_K8e0?rel=0&autoplay=1',
    description: 'Ancient Northeastern method of smoke-curing mature bamboo culms and carving interlocking friction joints without iron nails or toxic adhesives.',
    aiChapters: [
      { time: '00:20', title: '1. Lunar Harvest & Culm Selection', detail: 'Harvest 3-year-old bamboo during dark lunar phase' },
      { time: '02:15', title: '2. Chimney Hearth Smoke Curing', detail: 'Suspend culms over hearth smoke for 21 days' },
      { time: '04:40', title: '3. Fishmouth Joint Carving', detail: 'Carve interlocking curves using curved dao knife' },
      { time: '06:50', title: '4. Boiled Bamboo Dowel Pinning', detail: 'Lock joints with salt-boiled expanding dowels' }
    ],
    aiCommonQuestions: [
      { q: 'Why harvest bamboo during the dark moon phase?', a: 'Starch and sap levels in bamboo drop to their lowest during the new moon, making culms far less attractive to borer beetles.' },
      { q: 'How does smoke seasoning preserve bamboo?', a: 'Pyroligneous vapors and gentle heat caramelize residual starches into non-edible compounds, immunizing the timber against pests for 30+ years.' }
    ],
    aiSummary: {
      coreTechnique: 'Harvesting mature 3-year-old bamboo in winter, smoke-curing over hearth chimneys to remove starch, and carving mortise-tenon fishmouth joints.',
      scientificValidation: 'Pyroligneous vapors and heat convert fermentable starches into non-edible polymers, immunizing culms against borer beetles (Dinoderus minutus).',
      keyBenefits: 'Creates earthquake-resilient lightweight structures with 30+ year longevity using 100% renewable timber substitutes.',
      precautions: 'Harvest only mature culms with distinct lichen rings; juvenile culms have high water content and warp during curing.',
      aiScore: '98.1%'
    },
    aiDeepDive: {
      overview: 'Bamboo engineering in Assam and the Northeast combines material botanical science with intricate woodworking, utilizing natural flexural tensile strength rivaling structural steel.',
      stepByStep: [
        'Select mature 3-4 year old Dendrocalamus strictus or Bambusa balcooa culms harvested during the dark lunar phase.',
        'Suspend culms horizontally 2 meters above a traditional wood hearth for 21 days for smoke curing.',
        'Wipe surface with natural mustard oil and beeswax mixture.',
        'Mark joinery angles with split cane templates.',
        'Carve fishmouth and tongue joints using razor-sharp curved chisels (Dao).',
        'Pin joints with cured bamboo dowels (dowels expand with ambient moisture, locking joints tight).'
      ],
      toolsRequired: ['Traditional curved dao knife', 'Bamboo split gauge', 'Hand auger drill for dowel holes'],
      masterTips: 'Boil cut bamboo dowels in salt water for 30 minutes before inserting; this prevents split pins from ever rotting or loosening.',
      ecologicalImpact: 'Rapidly renewable building material with negative carbon footprint that reduces demand on old-growth forest timber.'
    }
  },
  {
    id: 'sk-9',
    title: 'Cold-Pressed Sesame & Mustard Oil (Bull-Driven Wood Ghani)',
    category: 'Agriculture',
    skillLevel: 'Intermediate',
    duration: '7:45',
    contributor: 'Keshav Lal',
    location: 'Haryana',
    thumbnail: organicFarmingImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/Mh44X0tK-o8?rel=0&autoplay=1',
    description: 'Slow extraction of virgin culinary oil using heavy acacia wood mortars at room temperature to preserve natural antioxidants, vitamin E, and aromatic terpenes.',
    aiChapters: [
      { time: '00:15', title: '1. Mustard Seed Sun-Drying', detail: 'Sun-dry black mustard seeds to 6-7% moisture' },
      { time: '02:00', title: '2. Acacia Wood Mortar Loading', detail: 'Load 12kg seeds into solid babool wood ghani' },
      { time: '04:10', title: '3. Slow 10 RPM Pestle Rotation', detail: 'Maintain cool friction temp under 38°C' },
      { time: '06:00', title: '4. Cotton Filtration & Glass Aging', detail: 'Collect golden expelled oil and settle for 48 hours' }
    ],
    aiCommonQuestions: [
      { q: 'Why is wood ghani oil healthier than refined oil?', a: 'Refined oil undergoes 200°C hexane extraction, destroying antioxidants. Wood ghani stays below 38°C, preserving 100% natural sesamol, tocopherols, and omegas.' },
      { q: 'What is done with the leftover seed cake?', a: 'The protein-rich oil cake (Khali) is used as an organic cattle feed that enhances dairy yield naturally.' }
    ],
    aiSummary: {
      coreTechnique: 'Crushing sun-dried mustard and sesame seeds in a hardwood pestle revolving at under 14 RPM without artificial heat or chemical solvents.',
      scientificValidation: 'Friction temperature remains below 38°C, preventing thermal oxidation and isomerization of delicate polyunsaturated fatty acids.',
      keyBenefits: 'Retains 100% natural sesamol, tocopherols, and pungent isothiocyanates essential for cardiovascular and skin health.',
      precautions: 'Filter expelled oil naturally through food-grade unbleached cotton; avoid synthetic nylon micro-mesh filters.',
      aiScore: '99.0%'
    },
    aiDeepDive: {
      overview: 'Traditional wood press (Kachi Ghani) oil extraction yields virgin, unrefined oil far superior in nutritional profile and shelf stability compared to industrialized high-heat solvent extraction.',
      stepByStep: [
        'Sun-dry organic black mustard seeds for 2 days to achieve optimal 6-7% moisture balance.',
        'Clean seeds of any dust or broken hulls using a wide bamboo winnowing fan.',
        'Load 12kg of cleaned seeds into the hardwood acacia (Babool) mortar.',
        'Engage the rotating wooden pestle at a slow speed of 8-12 RPM.',
        'Add 200ml of clean warm water gradually to encourage seed cake cohesion and oil release.',
        'Collect the golden expelled oil from the bottom wooden spout and let it settle in glass jars for 48 hours for natural sedimentation.'
      ],
      toolsRequired: ['Solid acacia wood ghani mortar', 'Wooden pestle (Farkha)', 'Clay sedimentation jugs'],
      masterTips: 'Never clean the wooden mortar interior with synthetic detergents; use warm water and dry mustard meal to scour the wooden walls.',
      ecologicalImpact: 'Zero fossil fuel and zero chemical solvent extraction, generating nutritious high-protein animal feed cake as a byproduct.'
    }
  },
  {
    id: 'sk-10',
    title: 'Bell-Metal & Lost-Wax Casting (Dhokra Tribal Artistry)',
    category: 'Traditional Skills',
    skillLevel: 'Master',
    duration: '12:30',
    contributor: 'Mangu Ram',
    location: 'Chhattisgarh',
    thumbnail: woodCarvingImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/bM5J2m0g57s?rel=0&autoplay=1',
    description: '4,000-year-old metallurgical craft of shaping intricate bee-wax wire threads, applying clay moulds, and pouring molten brass into open-hearth kilns.',
    aiChapters: [
      { time: '00:30', title: '1. Ant-Hill Clay Core Modeling', detail: 'Sculpt inner core with silt, sand, and rice husk' },
      { time: '03:45', title: '2. Beeswax & Resin Wire Extrusion', detail: 'Press wax through wooden die into thin threads' },
      { time: '07:15', title: '3. Multi-Layer Clay Jacket Coating', detail: 'Coat wax motifs with river slip and straw clay' },
      { time: '10:00', title: '4. Pit Furnace Melt & Metal Inversion', detail: 'Burn out wax and pour molten bronze alloy at 950°C' }
    ],
    aiCommonQuestions: [
      { q: 'What makes Dhokra casting distinct from industrial casting?', a: 'Every Dhokra piece is non-replicable because the original wax model burns away completely during the single-pour casting.' },
      { q: 'Why is dammar tree resin added to the wax?', a: 'Natural dammar resin increases the wax melting point so delicate wire motifs do not deform under hot ambient tropical temperatures.' }
    ],
    aiSummary: {
      coreTechnique: 'Modeling fine beeswax threads around a core clay armature, encasing in termitary clay, burning out the wax, and pouring molten brass.',
      scientificValidation: 'Thermal burnout of natural beeswax creates an accurate micron-level cavity with optimal venting for molten alloy surface tension.',
      keyBenefits: 'Preserves non-ferrous metallurgical heritage dating to the Harappan civilization with zero industrial machinery.',
      precautions: 'Preheat the outer clay mould to red-hot temperature before pouring molten metal to prevent steam explosion or thermal freeze.',
      aiScore: '98.7%'
    },
    aiDeepDive: {
      overview: 'Dhokra lost-wax casting is among the oldest continuous metallurgical traditions in human history, famously responsible for the iconic Dancing Girl of Mohenjo-daro.',
      stepByStep: [
        'Model the inner core using local ant-hill clay mixed with river sand and rice husk.',
        'Melt pure beeswax with tree dammar resin (Dhuna) and press through wooden extruders into uniform thin wires.',
        'Wind and sculpt wax wires across the core to form intricate motifs and jewelry patterns.',
        'Apply a fine slip of alluvial river silt over the wax pattern, followed by two heavy outer coats of clay and straw.',
        'Affix a funnel-shaped crucible with brass and bronze scrap to the mould top.',
        'Bake in a pit furnace with hardwood charcoal; as wax burns out, invert the crucible to let liquid metal flow into the cavity.',
        'Allow to cool for 4 hours, crack the clay jacket, and polish with brass wire brushes.'
      ],
      toolsRequired: ['Hand-cranked brass wax extruder', 'Open charcoal pit furnace', 'Bellows (Dhonki)', 'Chisels and metal files'],
      masterTips: 'Add 5% natural dammar resin into the beeswax; this raises the softening point so fine wires do not droop in warm weather during modeling.',
      ecologicalImpact: '100% recycled scrap metal utilization combined with natural biomass fuels and organic earth moulds.'
    }
  },
  {
    id: 'sk-11',
    title: 'Fermented Herbal Microbial Bio-Enzyme (Jeevamrutha)',
    category: 'Agriculture',
    skillLevel: 'Beginner',
    duration: '9:10',
    contributor: 'Subhash Chandra',
    location: 'Karnataka',
    thumbnail: compostImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/sF8zP-4xR5U?rel=0&autoplay=1',
    description: 'Masterclass on culturing billions of beneficial soil microbes using native desi cow dung, jaggery, pulse flour, and virgin forest soil inoculant.',
    aiChapters: [
      { time: '00:15', title: '1. Desi Cow Dung & Urine Matrix', detail: 'Blend 10kg fresh dung with 10L aged urine' },
      { time: '02:30', title: '2. Jaggery & Pulse Flour Inoculation', detail: 'Add 2kg unrefined jaggery and 2kg besan flour' },
      { time: '05:00', title: '3. Virgin Forest Soil Addition', detail: 'Add 500g banyan rhizosphere soil containing native mycorrhiza' },
      { time: '07:20', title: '4. Aerobic Barrel Fermentation', detail: 'Stir clockwise 10 mins twice daily for 48 hours in shade' }
    ],
    aiCommonQuestions: [
      { q: 'Why is virgin banyan tree soil added?', a: 'Virgin rhizosphere soil contains unmutated native mycorrhizal fungi and beneficial bacterial strains that act as the seed inoculant.' },
      { q: 'How soon must Jeevamrutha be applied?', a: 'Apply within 7 to 10 days of fermentation while microbial populations are at peak exponential activity.' }
    ],
    aiSummary: {
      coreTechnique: '48-hour aerobic fermentation of fresh desi cow dung, cow urine, organic jaggery, chickpea flour, and undisturbed forest rhizosphere soil.',
      scientificValidation: 'Jaggery and pulse flour provide rapid carbon and nitrogen substrates for exponential bacterial and mycorrhizal fungal multiplication.',
      keyBenefits: 'Multiplies native earthworms, solubilizes locked soil phosphorus, and restores degraded soils without synthetic NPK fertilizers.',
      precautions: 'Stir barrel contents clockwise for 10 minutes twice daily; keep under dense shade away from direct sunlight.',
      aiScore: '99.5%'
    },
    aiDeepDive: {
      overview: 'Jeevamrutha is the cornerstone of Zero Budget Natural Farming (ZBNF), functioning as a catalytic bio-inoculant that reactivates the soil biological food web.',
      stepByStep: [
        'Take 200 liters of non-chlorinated well or rainwater in a 200L food-grade barrel.',
        'Add 10kg of fresh indigenous (Desi) cow dung and 10 liters of aged cow urine.',
        'Mix in 2kg of organic unrefined jaggery and 2kg of chickpea or pulse flour (Besan).',
        'Add a handful (500g) of virgin soil collected beneath ancient Banyan or Neem trees.',
        'Stir vigorously clockwise with a wooden stick for 10 minutes.',
        'Cover with a damp jute gunny bag and ferment in shade for 48-72 hours, stirring twice daily.',
        'Apply 200 liters per acre through irrigation canals or 1:10 diluted foliar spray.'
      ],
      toolsRequired: ['200-liter drum', 'Wooden stirring staff', 'Jute gunny bag covering'],
      masterTips: 'Virgin forest soil is crucial because it contains undisturbed native microbial colonies that seed the entire bio-fermentation.',
      ecologicalImpact: 'Eliminates chemical fertilizers, sequesters carbon in agricultural soils, and prevents nitrate contamination of groundwater.'
    }
  },
  {
    id: 'sk-12',
    title: 'Traditional Sun-Cured Mango & Wild Berry Pickle with Mustard Oil',
    category: 'Recipes',
    skillLevel: 'Beginner',
    duration: '6:50',
    contributor: 'Parvati Bai',
    location: 'Uttar Pradesh',
    thumbnail: pickleImg,
    videoUrl: '/Setu_Video.mp4',
    onlineEmbedUrl: 'https://www.youtube-nocookie.com/embed/7_rNkJ-1V4Q?rel=0&autoplay=1',
    description: 'Ancestral preservation technique utilizing Himalayan rock salt, hand-pounded fenugreek, and cold-pressed mustard oil for 3-year room temperature shelf life.',
    aiChapters: [
      { time: '00:10', title: '1. Sour Raw Mango Cutting', detail: 'Chop unripe mangoes retaining inner hard seed shell' },
      { time: '01:50', title: '2. Rock Salt & Turmeric Curing', detail: 'Toss with 15% rock salt in ceramic urn for 48 hours' },
      { time: '03:30', title: '3. Solar Desiccation on Cotton', detail: 'Spread salted pieces under midday sun for 8 hours' },
      { time: '05:15', title: '4. Cold-Pressed Mustard Oil Submersion', detail: 'Pack into Martaban jars and fully submerge with spiced oil' }
    ],
    aiCommonQuestions: [
      { q: 'Why must the pickle pieces be fully submerged in mustard oil?', a: 'Mustard oil forms an anaerobic lipid seal that prevents airborne mold and aerobic spoilage bacteria from reaching the fruit.' },
      { q: 'How long can sun-cured pickle last without chemicals?', a: 'Properly sun-cured traditional pickles stored in ceramic Martabans last 3 to 5 years at room temperature without any vinegar or preservatives.' }
    ],
    aiSummary: {
      coreTechnique: 'Dry-salting raw mango chunks to extract moisture, sun-drying for 24 hours, and submerging in spiced raw cold-pressed mustard oil.',
      scientificValidation: 'High osmotic pressure from rock salt and antimicrobial isothiocyanates in raw mustard oil inhibit all pathogenic bacterial and fungal spores.',
      keyBenefits: 'Provides live natural probiotics, stimulates digestive bile secretion, and stores without artificial chemical preservatives.',
      precautions: 'Use bone-dry wooden spoons and glass or ceramic jars; any water droplet causes surface mold spoilage.',
      aiScore: '98.3%'
    },
    aiDeepDive: {
      overview: 'Traditional Indian pickling (Achar) is an ancient preservation science combining solar desiccation, osmotic moisture control, and lipid immersion.',
      stepByStep: [
        'Select firm, unripe sour raw country mangoes (Desi Kairi).',
        'Wash, wipe completely dry, and chop into 1-inch cubes retaining the inner hard shell.',
        'Toss with 15% rock salt and pure turmeric powder; let sit in a ceramic urn for 2 days to release water.',
        'Drain and spread salted pieces on clean cotton cloths under midday sun for 8 hours.',
        'Roast and coarsely grind fenugreek seeds (Methi), fennel (Saunf), mustard seeds (Rai), and nigella (Kalonji).',
        'Mix spices with mango pieces, pack tightly into sterilized glass jars, and pour cold-pressed mustard oil until pieces are fully submerged by 1 inch.'
      ],
      toolsRequired: ['Traditional Martaban ceramic jar', 'Iron cleaver for hard shell cutting', 'Cotton drying sheets'],
      masterTips: 'Place the sealed jar in direct sunlight for 7 consecutive days after packing; solar heat slowly matures the spices into the mango flesh.',
      ecologicalImpact: 'Zero electricity food preservation that prevents post-harvest seasonal crop wastage.'
    }
  }
];

export default function SkilledVideosSection({ customVideos = [], onPlayVideo, onAiSummary, onAiDeepDive }) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingCardId, setPlayingCardId] = useState(null);
  const [inCardMode, setInCardMode] = useState({}); // 'online' or 'local'

  const categories = ['All', 'Agriculture', 'Traditional Skills', 'Health & Ayurveda', 'Recipes', 'Eco-Technology'];

  const allVideos = [...customVideos, ...SKILLED_VIDEOS];

  const filteredVideos = allVideos.filter((v) => {
    const matchesCat = selectedCategory === 'All' || v.category === selectedCategory;
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contributor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const visibleVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  return (
    <div className="space-y-8">
      {/* Section Header with Setu Brand Theme */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 text-left space-y-5 shadow-xs relative overflow-hidden">
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-100/40 via-orange-100/30 to-blue-50/20 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-100/30 to-orange-50/20 rounded-full blur-2xl pointer-events-none -z-0"></div>

        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200/80 rounded-full px-3.5 py-1">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
            <span className="text-[11px] font-bold text-amber-900 tracking-wide uppercase">
              🎬 Traditional Skills &amp; Video Library
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-slate-950">
            Learn Traditional Skills <span className="bg-gradient-to-r from-brand-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">From Master Artisans</span>
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed max-w-2xl">
            Watch authentic traditional techniques on organic farming, pottery, Ayurveda, and indigenous crafts with step-by-step guides and helpful AI answers.
          </p>
        </div>

        {/* Video Search & Category Filter */}
        <div className="relative z-10 pt-2 flex flex-col md:flex-row gap-3">
          <div className="flex-grow flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
            <span className="pl-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search by skill, craft, or location (e.g. Pottery, Neem, Farming)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(10);
              }}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none px-3 py-2 font-medium"
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

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(10);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
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

      {/* Videos Grid */}
      {visibleVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {visibleVideos.map((video) => {
            const isCardPlaying = playingCardId === video.id;
            const currentMode = inCardMode[video.id] || 'online';

            return (
              <div
                key={video.id}
                className="bg-white rounded-3xl border border-slate-100/90 shadow-xs hover:shadow-xl hover:border-amber-200 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Video Thumbnail & In-Card Stream Player */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    {isCardPlaying ? (
                      <div className="relative w-full h-full bg-black flex flex-col">
                        {currentMode === 'online' && video.onlineEmbedUrl ? (
                          <iframe
                            src={video.onlineEmbedUrl}
                            title={video.title}
                            onError={() => setInCardMode((prev) => ({ ...prev, [video.id]: 'local' }))}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        ) : (
                          <video
                            src={video.videoUrl}
                            poster={video.thumbnail}
                            controls
                            autoPlay
                            playsInline
                            preload="auto"
                            className="w-full h-full object-contain bg-black"
                          />
                        )}

                        {/* In-Card Stream Mode Switcher */}
                        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 text-[9px] font-bold text-white z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInCardMode((prev) => ({ ...prev, [video.id]: 'online' }));
                            }}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${
                              currentMode === 'online' ? 'bg-brand-primary text-white' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🌐 Online
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInCardMode((prev) => ({ ...prev, [video.id]: 'local' }));
                            }}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${
                              currentMode === 'local' ? 'bg-brand-primary text-white' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            ⚡ Setu Stream
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => onPlayVideo(video)}
                        className="relative w-full h-full cursor-pointer group/thumb"
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover/thumb:scale-105 group-hover/thumb:opacity-80"
                        />

                        {/* Dark Vignette Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none"></div>

                        {/* Category Pill */}
                        <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-md text-amber-800 shadow-md border border-amber-100 pointer-events-none">
                          {video.category}
                        </span>

                        {/* Duration Badge */}
                        <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white border border-white/20 pointer-events-none">
                          ⏱️ {video.duration}
                        </span>

                        {/* Center Play Button with AI Pulse */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-2xl backdrop-blur-xs transform transition-all duration-300 group-hover/thumb:scale-115 border-2 border-white/90 shadow-brand-primary/50">
                            <svg className="w-7 h-7 ml-1 text-white fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* Contributor badge & AI Companion Indicator */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium pointer-events-none">
                          <span className="truncate">👤 {video.contributor}</span>
                          <span className="bg-emerald-500/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold shrink-0">
                            🤖 AI Ready
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Information */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>Level: {video.skillLevel}</span>
                      <span className="text-brand-primary font-bold">✨ AI Verified ({video.aiSummary.aiScore})</span>
                    </div>

                    <h3
                      onClick={() => onPlayVideo(video)}
                      className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors cursor-pointer"
                    >
                      {video.title}
                    </h3>

                    <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2">
                      {video.description}
                    </p>

                    {/* AI Quick Chapter Pills */}
                    {video.aiChapters && video.aiChapters.length > 0 && (
                      <div className="pt-1 flex items-center space-x-1.5 overflow-x-auto text-[10px]">
                        <span className="text-slate-400 font-bold shrink-0">📑 Chapters:</span>
                        {video.aiChapters.slice(0, 2).map((ch, idx) => (
                          <span
                            key={idx}
                            onClick={() => onPlayVideo(video)}
                            className="bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 px-2 py-0.5 rounded font-semibold cursor-pointer truncate max-w-[130px] transition-colors"
                            title={ch.detail}
                          >
                            {ch.time} {ch.title.split('.')[1] || ch.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Simple 2-Action Row */}
                <div className="p-5 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => onPlayVideo(video)}
                      className="py-3 px-4 bg-brand-primary hover:bg-brand-hover text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-brand-primary/20 hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer transform hover:-translate-y-0.5"
                      title="Watch Skill Video in Setu"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Play Video</span>
                    </button>

                    <button
                      onClick={() => onAiDeepDive(video)}
                      className="py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-2xl transition-all border border-amber-200/80 flex items-center justify-center space-x-1.5 cursor-pointer"
                      title="View Step-by-Step Instructions & Summary"
                    >
                      <span>📖</span>
                      <span>Step Guide</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 text-xs space-y-2">
          <p className="text-3xl">🔍</p>
          <p className="font-semibold text-slate-600">No online skill videos found for your search query.</p>
          <p>Try switching category or clearing filters.</p>
        </div>
      )}

      {/* Show More Button (Loads next 10 videos incrementally) */}
      {hasMore && (
        <div className="pt-4 flex flex-col items-center justify-center space-y-2">
          <button
            onClick={handleShowMore}
            className="px-8 py-3.5 bg-gradient-to-r from-brand-primary via-orange-500 to-amber-500 hover:from-brand-hover hover:to-orange-600 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:shadow-brand-primary/40 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center space-x-2.5"
          >
            <span>Show More Videos</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">
              +{Math.min(10, filteredVideos.length - visibleCount)} more
            </span>
            <span>↓</span>
          </button>
          <p className="text-[11px] text-slate-400 font-medium">
            Showing {visibleVideos.length} of {filteredVideos.length} online skill videos
          </p>
        </div>
      )}
    </div>
  );
}

// In-Platform Video Player Modal with AI Companion, Chapters, Live Q&A, Auto-Skip & Fullscreen
export function InPlatformVideoModal({ video, allVideos = SKILLED_VIDEOS, onClose, onOpenAiSummary, onOpenAiDeepDive }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [streamSource, setStreamSource] = useState('online'); // 'online' or 'direct'
  const [userQuestion, setUserQuestion] = useState('');
  const [aiChatResponses, setAiChatResponses] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [autoSkipNotice, setAutoSkipNotice] = useState(null);

  // Active video tracking
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!video) return;
    const foundIdx = allVideos.findIndex((v) => v.id === video.id);
    setCurrentIndex(foundIdx >= 0 ? foundIdx : 0);
    setIsPlaying(false);
    setCurrentTime(0);
    setStreamSource('online');
    setUserQuestion('');
    setAiChatResponses([]);
    setAutoSkipNotice(null);
  }, [video, allVideos]);

  const activeVideo = allVideos[currentIndex] || video;

  if (!activeVideo) return null;

  const handleNextVideo = () => {
    const nextIdx = (currentIndex + 1) % allVideos.length;
    setCurrentIndex(nextIdx);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePrevVideo = () => {
    const prevIdx = (currentIndex - 1 + allVideos.length) % allVideos.length;
    setCurrentIndex(prevIdx);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleOnlineError = () => {
    setAutoSkipNotice(`Online source unavailable for "${activeVideo.title}". Auto-switching to next skill video...`);
    setTimeout(() => {
      handleNextVideo();
      setAutoSkipNotice(null);
    }, 1800);
  };

  const handleTogglePlay = (e) => {
    if (e) e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused || vid.ended) {
      vid.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Play error:', err));
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleToggleMute = (e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSkip = (seconds, e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration || 100, videoRef.current.currentTime + seconds));
    }
  };

  const handleFullscreen = (e) => {
    if (e) e.stopPropagation();
    const target = containerRef.current;
    if (!target) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    }
  };

  const handleAskAi = (customQ) => {
    const q = customQ || userQuestion;
    if (!q.trim()) return;

    setIsAiThinking(true);
    const newEntry = { question: q, answer: null };
    setAiChatResponses((prev) => [...prev, newEntry]);
    setUserQuestion('');

    setTimeout(() => {
      let generatedAnswer = '';
      const lowerQ = q.toLowerCase();

      if (lowerQ.includes('ratio') || lowerQ.includes('how much') || lowerQ.includes('ingredient')) {
        generatedAnswer = `Based on Setu's verified traditional records for ${activeVideo.title}, the exact core ratio is: ${activeVideo.aiSummary.coreTechnique}`;
      } else if (lowerQ.includes('why') || lowerQ.includes('science') || lowerQ.includes('work')) {
        generatedAnswer = `Scientific explanation: ${activeVideo.aiSummary.scientificValidation}`;
      } else if (lowerQ.includes('safe') || lowerQ.includes('precaution') || lowerQ.includes('danger')) {
        generatedAnswer = `Safety Precaution: ${activeVideo.aiSummary.precautions}`;
      } else {
        generatedAnswer = `Setu AI Masterclass Guidance: Follow the step-by-step master technique: ${activeVideo.aiDeepDive.stepByStep[0]} Tip: ${activeVideo.aiDeepDive.masterTips}`;
      }

      setAiChatResponses((prev) =>
        prev.map((item, idx) => (idx === prev.length - 1 ? { ...item, answer: generatedAnswer } : item))
      );
      setIsAiThinking(false);
    }, 600);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col my-auto text-left animate-in zoom-in-95 duration-200"
      >
        {/* Auto-Skip Notice Toast */}
        {autoSkipNotice && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between animate-pulse">
            <span>⚠️ {autoSkipNotice}</span>
            <button onClick={handleNextVideo} className="underline cursor-pointer">
              Skip Now ⏭️
            </button>
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {activeVideo.category}
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
              {activeVideo.title}
            </h3>
            <span className="text-[10px] text-slate-400 shrink-0">
              ({currentIndex + 1}/{allVideos.length})
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Prev / Next Skill Video Controls */}
            <button
              onClick={handlePrevVideo}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
              title="Previous Skill Video"
            >
              <span>⏮️</span>
              <span className="hidden sm:inline">Prev</span>
            </button>

            <button
              onClick={handleNextVideo}
              className="p-1.5 bg-brand-primary hover:bg-brand-hover text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
              title="Skip to Next Skill Video"
            >
              <span>Next</span>
              <span>⏭️</span>
            </button>

            {/* Stream Switcher */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-800 p-1 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setStreamSource('online')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  streamSource === 'online' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🌐 Online
              </button>
              <button
                onClick={() => setStreamSource('direct')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  streamSource === 'direct' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Setu Stream
              </button>
            </div>

            <button
              onClick={handleFullscreen}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer flex items-center space-x-1"
              title="Toggle Fullscreen"
            >
              <span>⛶</span>
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors font-bold text-base cursor-pointer"
              title="Close Player"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Two-Column Player Layout: Video Player on Left / AI Companion on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-slate-950">
          {/* Main Video Viewport */}
          <div className="lg:col-span-8 flex flex-col bg-black">
            <div className="relative aspect-video w-full flex items-center justify-center overflow-hidden">
              {streamSource === 'online' && activeVideo.onlineEmbedUrl ? (
                <iframe
                  src={activeVideo.onlineEmbedUrl}
                  title={activeVideo.title}
                  onError={handleOnlineError}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div
                  onClick={handleTogglePlay}
                  className="relative w-full h-full flex items-center justify-center cursor-pointer group/vid"
                >
                  <video
                    ref={videoRef}
                    src={activeVideo.videoUrl}
                    poster={activeVideo.thumbnail}
                    playsInline
                    preload="auto"
                    onError={handleOnlineError}
                    onTimeUpdate={() => {
                      if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) setDuration(videoRef.current.duration);
                    }}
                    className="w-full h-full object-contain"
                  />

                  {/* Center Play/Pause Overlay Indicator */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-2xs transition-all pointer-events-none">
                      <div className="w-18 h-18 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-2xl transform transition-transform group-hover/vid:scale-110 border-2 border-white">
                        <svg className="w-8 h-8 ml-1 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom On-Screen Interactive Controls */}
            <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />

              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTogglePlay}
                    className="p-1.5 bg-brand-primary hover:bg-brand-hover text-white rounded-lg font-bold transition-all cursor-pointer"
                  >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                  </button>
                  <button
                    onClick={(e) => handleSkip(-10, e)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    -10s
                  </button>
                  <button
                    onClick={(e) => handleSkip(10, e)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    +10s
                  </button>
                  <button
                    onClick={handleToggleMute}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                  </button>

                  <button
                    onClick={handleNextVideo}
                    className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold cursor-pointer flex items-center space-x-1"
                    title="Skip to Next Skill Video"
                  >
                    <span>⏭️ Skip Video</span>
                  </button>
                </div>

                <div className="font-mono text-slate-400 text-[11px]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          </div>

          {/* AI Smart Companion Sidebar */}
          <div className="lg:col-span-4 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 flex flex-col justify-between max-h-[500px] lg:max-h-[600px] overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* AI Badge & Skill Verified Banner */}
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">Setu AI Companion Active</h4>
                    <p className="text-[10px] text-slate-400">Analyzing technique in real-time</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                  {activeVideo.aiSummary.aiScore}
                </span>
              </div>

              {/* Interactive Chapters */}
              {activeVideo.aiChapters && (
                <div className="space-y-1.5">
                  <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>📑 AI Chapter Breakdown</span>
                    <span className="text-[9px] text-slate-500">Jump to point</span>
                  </h5>
                  <div className="space-y-1">
                    {activeVideo.aiChapters.map((ch, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const [m, s] = ch.time.split(':').map(Number);
                          const totalSecs = (m || 0) * 60 + (s || 0);
                          if (videoRef.current) {
                            videoRef.current.currentTime = totalSecs;
                          }
                          setCurrentTime(totalSecs);
                        }}
                        className="w-full text-left p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs flex items-center justify-between cursor-pointer group"
                      >
                        <span className="font-semibold truncate">{ch.title}</span>
                        <span className="font-mono text-[10px] text-brand-primary ml-2 shrink-0">{ch.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested AI Questions */}
              {activeVideo.aiCommonQuestions && (
                <div className="space-y-1.5">
                  <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    💡 Ask AI About This Craft:
                  </h5>
                  <div className="space-y-1">
                    {activeVideo.aiCommonQuestions.map((qObj, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskAi(qObj.q)}
                        className="w-full text-left p-2 rounded-xl bg-slate-800/40 hover:bg-amber-500/15 border border-slate-700/60 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-200 transition-all cursor-pointer"
                      >
                        ❓ {qObj.q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Thread */}
              {aiChatResponses.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {aiChatResponses.map((item, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="text-slate-400 font-bold">You: {item.question}</div>
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-100 font-medium text-[11px] leading-relaxed">
                        {item.answer ? (
                          item.answer
                        ) : (
                          <span className="animate-pulse">Setu AI is analyzing traditional archives...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Ask AI Input Box */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskAi();
                }}
                className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 focus-within:border-brand-primary"
              >
                <input
                  type="text"
                  placeholder="Ask AI about technique, ratio, science..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isAiThinking}
                  className="px-3 py-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  Ask AI
                </button>
              </form>

              {/* Action Modals Launchers */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAiSummary(activeVideo);
                  }}
                  className="py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded-xl transition-all text-center cursor-pointer"
                >
                  🤖 AI Summary
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAiDeepDive(activeVideo);
                  }}
                  className="py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] font-bold rounded-xl transition-all text-center cursor-pointer"
                >
                  📖 Step Protocol
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Video AI Summary Modal
export function VideoAiSummaryModal({ video, onClose, onOpenDeepDive }) {
  if (!video) return null;
  const { aiSummary } = video;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-100 text-left relative space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
            <span>🤖 Setu AI Knowledge Synthesizer</span>
            <span>•</span>
            <span className="text-brand-primary">Verified {aiSummary.aiScore}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {video.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Contributor: <span className="font-bold text-slate-700">{video.contributor}</span> ({video.location})
          </p>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-slate-700">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100/90 space-y-1">
            <h4 className="font-bold text-amber-900 flex items-center space-x-1.5">
              <span>🌾</span>
              <span>Core Technique Formulation:</span>
            </h4>
            <p className="leading-relaxed text-slate-800">{aiSummary.coreTechnique}</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/90 space-y-1">
            <h4 className="font-bold text-blue-900 flex items-center space-x-1.5">
              <span>🔬</span>
              <span>Scientific Validation:</span>
            </h4>
            <p className="leading-relaxed text-slate-800">{aiSummary.scientificValidation}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/90 space-y-1">
            <h4 className="font-bold text-emerald-900 flex items-center space-x-1.5">
              <span>🌱</span>
              <span>Key Practical Benefits:</span>
            </h4>
            <p className="leading-relaxed text-slate-800">{aiSummary.keyBenefits}</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100/90 space-y-1">
            <h4 className="font-bold text-rose-900 flex items-center space-x-1.5">
              <span>⚠️</span>
              <span>Safety &amp; Application Precautions:</span>
            </h4>
            <p className="leading-relaxed text-slate-800">{aiSummary.precautions}</p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              onClose();
              if (onOpenDeepDive) onOpenDeepDive(video);
            }}
            className="flex-1 py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>📖</span>
            <span>Read Step-by-Step Guide by AI</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Video Read More by AI (Deep Dive Masterclass) Modal
export function VideoAiDeepDiveModal({ video, onClose, onOpenAiSummary }) {
  if (!video) return null;
  const { aiDeepDive, aiSummary } = video;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-orange-100 text-left relative space-y-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 bg-orange-50 text-brand-hover text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200">
            <span>📖 Setu AI Masterclass Documentation</span>
            <span>•</span>
            <span>Deep Protocol</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {video.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Category: <span className="font-bold text-slate-700">{video.category}</span> | Level: <span className="font-bold text-amber-700">{video.skillLevel}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/70 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p className="font-medium">{aiDeepDive.overview}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
            <span>📋</span>
            <span>Step-by-Step Traditional Execution Protocol:</span>
          </h4>
          <div className="space-y-2">
            {aiDeepDive.stepByStep.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-3 text-xs sm:text-sm text-slate-800"
              >
                <span className="w-6 h-6 rounded-full bg-brand-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>
                <p className="leading-relaxed font-normal">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <h5 className="text-xs font-bold text-slate-900 flex items-center space-x-1">
              <span>🛠️</span>
              <span>Tools &amp; Equipment Required:</span>
            </h5>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              {aiDeepDive.toolsRequired.map((tool, i) => (
                <li key={i}>{tool}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-100 space-y-1.5">
            <h5 className="text-xs font-bold text-amber-950 flex items-center space-x-1">
              <span>💡</span>
              <span>Master Craft Tips:</span>
            </h5>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {aiDeepDive.masterTips}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 space-y-1">
          <h5 className="text-xs font-bold text-emerald-950 flex items-center space-x-1">
            <span>🌍</span>
            <span>Ecological &amp; Community Impact:</span>
          </h5>
          <p className="text-xs text-emerald-900 leading-relaxed font-medium">
            {aiDeepDive.ecologicalImpact}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              onClose();
              if (onOpenAiSummary) onOpenAiSummary(video);
            }}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>🤖</span>
            <span>View Quick AI Summary</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

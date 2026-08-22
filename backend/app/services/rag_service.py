import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


from app.models.avatar_schemas import KnowledgeItem
from app.services.storage_service import storage_service
from app.services.vector_store_service import vector_store_service

logger = logging.getLogger("rag_service")

# Curated Comprehensive Traditional and Generational Knowledge Seed Dataset
SEED_KNOWLEDGE_ENTRIES = [
    {
        "documentId": "setu_health_003",
        "title": "Ajwain, Hing & Black Salt for Immediate Digestive Relief & Gas",
        "category": "Ayurvedic Health & Food",
        "state": "All India & Punjab",
        "district": "Amritsar",
        "language": "Hindi & Punjabi",
        "sourceType": "Traditional Dadi-Nani Desi Nuskhe",
        "content": "For acute abdominal gas, flatulence, bloating, and stomach pain (pet dard), take half a teaspoon of carom seeds (Ajwain) with a pinch of black salt (Kala Namak) in a glass of warm water. Ajwain contains thymol which stimulates digestive enzyme secretion instantly. Alternatively, prepare a warm paste of asafoetida (Hing) in water and apply it around the navel to relieve trapped colic gas within 15 minutes. Eat light satvik khichdi with roasted cumin."
    },
    {
        "documentId": "setu_health_004",
        "title": "Nutmeg Golden Milk & Padabhyanga Foot Massage for Insomnia & Deep Sleep",
        "category": "Ayurvedic Health & Food",
        "state": "Punjab & Kerala",
        "district": "Jalandhar",
        "language": "Punjabi & Hindi",
        "sourceType": "Ayurvedic Nidra Chikitsa",
        "content": "To cure insomnia and sleeplessness (neend na aana), drink a warm cup of Desi cow milk infused with a pinch of fresh turmeric and 1/4 teaspoon of grated nutmeg (Jaiphal) 30 minutes before bedtime. Nutmeg promotes natural GABA release and calms the nervous system. Before sleeping, massage the soles of your feet for 5 minutes with warm sesame or mustard oil (Padabhyanga) and practice 10 minutes of gentle Bhramari and Anulom-Vilom pranayama."
    },
    {
        "documentId": "setu_health_005",
        "title": "Fenugreek, Dry Ginger & Castor Oil Pack for Joint Pain & Arthritis",
        "category": "Ayurvedic Health & Food",
        "state": "Haryana & Punjab",
        "district": "Kurukshetra",
        "language": "Hindi & Punjabi",
        "sourceType": "Traditional Vaidya Lineage",
        "content": "For chronic knee pain, joint stiffness, and arthritis (jodon ka dard), soak one teaspoon of fenugreek seeds (Methi dana) overnight in water and chew them in the morning along with the water. Fenugreek lubricates joints and suppresses Vata inflammation. For acute pain relief, apply warm castor oil (Arandi ka tel) or Nirgundi oil over the affected joint and cover with a warm cotton cloth."
    },
    {
        "documentId": "setu_health_006",
        "title": "Fennel & Coriander Infusion with Cold Milk for Acidity & Pitta Cooling",
        "category": "Ayurvedic Health & Food",
        "state": "Rajasthan & Gujarat",
        "district": "Udaipur",
        "language": "Hindi",
        "sourceType": "Generational Kitchen Wisdom",
        "content": "For hyperacidity, acid reflux, heartburn (seene me jalan), and stomach heat, boil one tablespoon of fennel seeds (Saunf) and crushed coriander seeds (Dhania) in two cups of water, reduce to one cup, let it cool to room temperature, and drink with a teaspoon of organic rock sugar (Mishri). Fennel gently cools the digestive fire without extinguishing Agni."
    },
    {
        "documentId": "setu_health_007",
        "title": "Brahmi, Shankhpushpi & Pranayama for Mental Stress & Anxiety Relief",
        "category": "Ayurvedic Health & Food",
        "state": "Uttarakhand & Himachal Pradesh",
        "district": "Rishikesh",
        "language": "Hindi & English",
        "sourceType": "Yogic Mental Wellness Lineage",
        "content": "For mental exhaustion, restlessness, sadness, and anxiety (chinta aur tanaav), take half a teaspoon of Brahmi or Shankhpushpi powder with warm water. Practice Anulom-Vilom (alternate nostril breathing) for 10 minutes followed by 5 minutes of Bhramari pranayama at sunrise. Waking up during Brahma Muhurta (around 4:30 to 5:30 AM) aligns cortisol levels and restores natural circadian rhythm."
    },
    {
        "documentId": "setu_health_008",
        "title": "Triphala Churna & Warm Water for Constipation & Colon Cleansing",
        "category": "Ayurvedic Health & Food",
        "state": "All India",
        "district": "Varanasi",
        "language": "Hindi",
        "sourceType": "Classical Ayurveda (Charaka Samhita)",
        "content": "For chronic constipation (kabz) and sluggish bowel movements, take 1 teaspoon of pure Triphala powder (equal mix of Amla, Haritaki, and Bibhitaki) mixed in a cup of lukewarm water before sleeping. Triphala tones the intestinal walls, stimulates peristalsis without causing dependency, and purges accumulated toxins (Ama) from the digestive tract."
    },
    {
        "documentId": "setu_farm_001",
        "title": "Traditional Wheat Farming & Heirloom Seed Preservation",
        "category": "Farming",
        "state": "Punjab & Haryana",
        "district": "Ludhiana",
        "language": "Punjabi & Hindi",
        "sourceType": "Elder Farmer Heritage Interview",
        "content": "Traditional wheat farming relies on indigenous Bansi and Sharbati varieties sown after the first winter chill. Seeds are preserved using clean sun-dried cow dung ash mixed with dried neem leaves in terracotta urns (Kothi), preventing weevils and maintaining 95% seed germination for over two seasons without synthetic chemicals."
    },
    {
        "documentId": "setu_farm_002",
        "title": "Neemastra Organic Pest Control Formulation",
        "category": "Farming",
        "state": "Maharashtra",
        "district": "Amravati",
        "language": "Marathi & Hindi",
        "sourceType": "Traditional Agriculture Practice",
        "content": "Neemastra is prepared by crushing 5 kg of fresh neem leaves and neem seeds into 100 liters of water with 5 liters of indigenous cow urine and 2 kg of fresh cow dung. After fermenting for 48 hours in the shade, this organic decoction repels sucking pests, aphids, and caterpillars without harming beneficial pollinators."
    },
    {
        "documentId": "setu_farm_003",
        "title": "Jeevamrutha Fermented Soil Microbial Bio-Enhancer",
        "category": "Farming",
        "state": "Karnataka & Andhra Pradesh",
        "district": "Dharwad",
        "language": "Kannada & Hindi",
        "sourceType": "Indigenous Soil Science",
        "content": "Jeevamrutha is an organic microbial culture made from 10 kg Desi cow dung, 10 liters cow urine, 2 kg jaggery, 2 kg pulse flour, and a handful of virgin forest soil mixed in 200 liters of water. Fermented for 7 days, it introduces billions of nitrogen-fixing and phosphate-solubilizing microbes into the root zone."
    },
    {
        "documentId": "setu_farm_004",
        "title": "Beejamrit Traditional Organic Seed Inoculation & Treatment",
        "category": "Farming",
        "state": "Maharashtra & Punjab",
        "district": "Akola",
        "language": "Hindi & Marathi",
        "sourceType": "Natural Farming Heritage",
        "content": "Beejamrit protects young seedlings against fungal root rot and seed-borne pathogens. Prepared with 5 kg Desi cow dung, 5 liters cow urine, 50 grams slaked lime (Chuna), and virgin bund soil in 20 liters water. Seeds are gently coated with Beejamrit, dried in shade for 2 hours, and sown immediately to ensure rapid germination and strong taproot formation."
    },
    {
        "documentId": "setu_farm_005",
        "title": "Agniastra Potent Bio-Pesticide for Stem Borers & Caterpillars",
        "category": "Farming",
        "state": "Madhya Pradesh & Punjab",
        "district": "Indore",
        "language": "Hindi",
        "sourceType": "Indigenous Botanical Pest Defense",
        "content": "Agniastra is a powerful organic pesticide for severe borer and caterpillar infestations. It is made by boiling 1 kg crushed tobacco leaves, 500 grams hot green chilies, 500 grams crushed garlic, and 5 kg crushed neem leaves in 10 liters Desi cow urine for 2 hours. After cooling and filtering, 2 liters of this solution is diluted in 100 liters water and sprayed."
    },
    {
        "documentId": "setu_farm_006",
        "title": "Natural Soil Mulching (Achhadan) & Moisture Conservation",
        "category": "Farming",
        "state": "Punjab, Rajasthan & Gujarat",
        "district": "Bathinda",
        "language": "Punjabi & Hindi",
        "sourceType": "Regenerative Farming Wisdom",
        "content": "Achhadan (mulching) involves covering open soil with crop residue, straw, dry leaves (Kashtha Achhadan), or live cover crops like cowpea and clover. Mulching reduces soil evaporation by up to 70%, suppresses weed germination, maintains a cool microclimate for earthworms, and slowly decomposes into humus."
    },
    {
        "documentId": "setu_water_001",
        "title": "Dry-Stone Check Dams (Bori Bandh) & Groundwater Recharge",
        "category": "Water & Soil Conservation",
        "state": "Rajasthan & Gujarat",
        "district": "Alwar",
        "language": "Hindi",
        "sourceType": "Traditional Engineering Guild",
        "content": "Bori Bandh and dry-stone check dams are porous barriers constructed across seasonal gullies using local boulders and sandbags. They reduce water runoff velocity by 80%, arrest fertile silt erosion, and allow rainwater to slowly percolate into shallow aquifers, reviving dry village wells."
    },
    {
        "documentId": "setu_water_002",
        "title": "Johad & Taanka Traditional Rainwater Harvesting Reservoirs",
        "category": "Water & Soil Conservation",
        "state": "Rajasthan & Haryana",
        "district": "Jodhpur",
        "language": "Hindi & Rajasthani",
        "sourceType": "Arid Zone Hydrology Lineage",
        "content": "Johads are crescent-shaped earthen check dams built at natural drainage points to capture monsoon runoff. In desert households, underground paved cisterns called Taankas collect pure rooftop rainwater, storing over 25,000 liters of sweet drinking water naturally cool and free from bacterial growth throughout the summer heat."
    },
    {
        "documentId": "setu_health_001",
        "title": "Sprouted Finger Millet Porridge (Ragi Ambali)",
        "category": "Ayurvedic Health & Food",
        "state": "Karnataka & Tamil Nadu",
        "district": "Mysuru",
        "language": "Kannada & Tamil",
        "sourceType": "Generational Kitchen Wisdom",
        "content": "Ragi Ambali is an ancestral fermented finger millet beverage. Sprouted finger millet flour is cooked in water and allowed to ferment overnight with buttermilk, shallots, and curry leaves. It delivers bioavailable iron, calcium, and gut-friendly lactic acid bacteria, cooling the body during harvest seasons."
    },
    {
        "documentId": "setu_health_002",
        "title": "Ayurvedic Respiratory Decoction (Tulsi & Ginger Kashayam)",
        "category": "Ayurvedic Health & Food",
        "state": "Kerala & Uttarakhand",
        "district": "Wayanad",
        "language": "Malayalam & Hindi",
        "sourceType": "Traditional Vaidya Lineage",
        "content": "Tulsi Ginger Kashayam is an Ayurvedic decoction brewed with fresh holy basil leaves, crushed ginger root, whole black peppercorns, and long pepper (Pippali) boiled down to half volume with palm jaggery. It clears phlegm from the bronchial tract and boosts cellular immunity against seasonal flu."
    },
    {
        "documentId": "setu_craft_001",
        "title": "Natural Indigo Dyeing & Handloom Mordanting",
        "category": "Artisan Craft",
        "state": "Rajasthan",
        "district": "Bagru",
        "language": "Hindi & Marwari",
        "sourceType": "Master Dyer Heritage",
        "content": "Traditional Bagru block printing uses fermented natural indigo vats with lime, jaggery, and dates. Cotton fabrics are pre-mordanted with Harda (myrobalan fruit extract), ensuring vibrant, skin-safe blues and earth pigments that resist fading across decades of washing."
    }
]


class RAGService:
    """
    Retrieval-Augmented Generation service connecting Setu Avatar to preserved human wisdom.
    Provides Hybrid Search combining Vector Semantic Similarity and Lexical Keyword Matching.
    """

    async def initialize(self):
        """Seeds initial traditional knowledge dataset if vector store is missing entries."""
        existing_items = await storage_service.get_all_knowledge_items()
        existing_ids = {item.documentId for item in existing_items}

        for entry in SEED_KNOWLEDGE_ENTRIES:
            if entry["documentId"] not in existing_ids:
                item = KnowledgeItem(
                    id=entry["documentId"],
                    documentId=entry["documentId"],
                    title=entry["title"],
                    category=entry["category"],
                    content=entry["content"],
                    state=entry.get("state", "All India"),
                    district=entry.get("district"),
                    language=entry.get("language", "English"),
                    sourceType=entry["sourceType"],
                    contributorId="setu_foundational_archive",
                    verified=True
                )
                await storage_service.save_knowledge_item(item)
                await vector_store_service.upsert_document(
                    doc_id=item.documentId,
                    text=f"{item.title}. Category: {item.category}. Location: {item.state}. {item.content}",
                    metadata={
                        "documentId": item.documentId,
                        "title": item.title,
                        "category": item.category,
                        "state": item.state,
                        "sourceType": item.sourceType,
                        "verified": item.verified
                    }
                )
        logger.info(f"Setu Knowledge Base seeded successfully ({len(SEED_KNOWLEDGE_ENTRIES)} entries verified).")

    async def retrieve_knowledge(
        self,
        query: str,
        top_k: int = 3,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Hybrid RAG Search: Combines Vector Semantic Similarity + Lexical Keyword Matching.
        Works across Indic and English terms smoothly.
        """
        clean_q = query.lower().strip()
        query_words = set(re.findall(r'\w+', clean_q))

        # 1. Semantic Vector Search
        meta_filter = {"category": category} if category else None
        vector_results = await vector_store_service.search_similar(
            query=query,
            top_k=top_k * 2,
            metadata_filter=meta_filter,
            min_score=0.12
        )

        # 2. Local Keyword / Lexical Scoring
        all_items = await storage_service.get_all_knowledge_items()
        scored_items = []

        # Keywords mapping for cross-lingual synonym matching
        synonym_map = {
            "gas": ["digestive", "flatulence", "ajwain", "hing", "bloating", "pet"],
            "dard": ["pain", "relief", "joint", "headache", "stomach"],
            "pet": ["stomach", "digestive", "gas", "kabz", "constipation", "khichdi"],
            "neend": ["sleep", "insomnia", "nutmeg", "milk", "padabhyanga", "massage"],
            "sleep": ["neend", "insomnia", "nutmeg", "padabhyanga", "rest"],
            "chinta": ["stress", "anxiety", "brahmi", "pranayama", "tanaav"],
            "kheti": ["farming", "wheat", "seed", "jeevamrutha", "soil", "crop"],
            "farming": ["kheti", "wheat", "seed", "jeevamrutha", "soil", "crop", "pest"],
            "mitti": ["soil", "jeevamrutha", "fertility", "mulch", "achhadan"],
            "soil": ["mitti", "jeevamrutha", "fertility", "mulch", "achhadan"],
            "khad": ["compost", "jeevamrutha", "fertilizer", "manure", "dung"],
            "pest": ["neemastra", "agniastra", "keeda", "spray", "leaves"]
        }

        expanded_query_words = set(query_words)
        for qw in query_words:
            if qw in synonym_map:
                expanded_query_words.update(synonym_map[qw])

        for item in all_items:
            item_text = f"{item.title} {item.category} {item.content}".lower()
            item_words = set(re.findall(r'\w+', item_text))
            
            # Compute keyword overlap score
            overlap = len(expanded_query_words.intersection(item_words))
            keyword_score = min(1.0, overlap * 0.18)

            # Check if title has direct match
            for qw in query_words:
                if len(qw) > 2 and qw in item.title.lower():
                    keyword_score += 0.35

            if keyword_score > 0.10:
                scored_items.append({
                    "id": item.documentId,
                    "text": item.content,
                    "score": keyword_score,
                    "metadata": {
                        "documentId": item.documentId,
                        "title": item.title,
                        "category": item.category,
                        "state": item.state,
                        "sourceType": item.sourceType,
                        "verified": item.verified
                    }
                })

        # 3. Fuse and Re-rank Vector & Lexical Results
        combined_dict = {}
        for r in vector_results:
            doc_id = r.get("id") or r.get("metadata", {}).get("documentId")
            combined_dict[doc_id] = {
                "id": doc_id,
                "text": r.get("text", ""),
                "score": r.get("score", 0.0) * 0.55,
                "metadata": r.get("metadata", {})
            }

        for k in scored_items:
            doc_id = k["id"]
            if doc_id in combined_dict:
                combined_dict[doc_id]["score"] += k["score"] * 0.45
            else:
                combined_dict[doc_id] = {
                    "id": doc_id,
                    "text": k["text"],
                    "score": k["score"] * 0.45,
                    "metadata": k["metadata"]
                }

        sorted_results = sorted(combined_dict.values(), key=lambda x: x["score"], reverse=True)
        top_results = sorted_results[:top_k]

        logger.info(f"🔍 [HYBRID RAG] Retrieved {len(top_results)} knowledge items for query: '{query}'")
        return top_results


    async def add_verified_knowledge(
        self,
        title: str,
        category: str,
        content: str,
        state: Optional[str] = "India",
        district: Optional[str] = None,
        language: Optional[str] = "English",
        source_type: str = "User Contributed",
        contributor_id: str = "guest_user"
    ) -> KnowledgeItem:
        """Stores newly validated/verified knowledge into persistent storage and vector index."""
        doc_id = f"setu_usr_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        item = KnowledgeItem(
            id=doc_id,
            documentId=doc_id,
            title=title.strip(),
            category=category.strip(),
            content=content.strip(),
            state=state,
            district=district,
            language=language,
            sourceType=source_type,
            contributorId=contributor_id,
            verified=True,
            createdAt=datetime.now(timezone.utc).isoformat()
        )
        await storage_service.save_knowledge_item(item)
        await vector_store_service.upsert_document(
            doc_id=doc_id,
            text=f"{item.title}. Category: {item.category}. Location: {item.state}. {item.content}",
            metadata={
                "documentId": doc_id,
                "title": item.title,
                "category": item.category,
                "state": item.state,
                "sourceType": item.sourceType,
                "contributorId": contributor_id,
                "verified": True
            }
        )
        return item


rag_service = RAGService()

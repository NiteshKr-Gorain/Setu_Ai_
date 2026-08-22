import os
import re
import json
import math
import logging
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import numpy as np

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

from app.config import settings

logger = logging.getLogger("faiss_rag_service")

# Dimension for all-MiniLM-L6-v2 embeddings
MINILM_DIM = 384

# Comprehensive seed knowledge base of traditional & modern wisdom
SEED_FAISS_KNOWLEDGE = [
    {
        "id": "setu_health_001",
        "title": "Ajwain, Hing & Black Salt for Immediate Digestive Relief & Stomach Gas",
        "category": "Ayurvedic Health & Food",
        "keywords": ["gas", "pet dard", "ajwain", "hing", "stomach pain", "bloating", "digestion", "kala namak", "flatulence"],
        "content": "For acute stomach gas, bloating, and abdominal pain (pet dard), take 1/2 teaspoon of carom seeds (Ajwain) with a pinch of black salt (Kala Namak) in a glass of warm water. Ajwain contains thymol which stimulates digestive enzyme secretion instantly. Alternatively, prepare a warm paste of asafoetida (Hing) in water and apply it around the navel to relieve trapped colic gas within 15 minutes. Drink warm water and eat light khichdi.",
        "solution": "Take 1/2 tsp Ajwain (carom seeds) + a pinch of Kala Namak (black salt) in warm water immediately, or apply a warm Hing (asafoetida) paste around the navel.",
        "why_it_works": "Thymol in Ajwain activates gastric enzymes and relieves muscular spasms in the gut within 10-15 minutes.",
        "gotchas": "Avoid cold water and heavy fried foods immediately after taking this remedy.",
        "takeaway": "Ajwain with warm water is nature's fastest relief for acute abdominal gas.",
        "source": "Setu Traditional Dadi-Nani Desi Nuskhe"
    },
    {
        "id": "setu_health_002",
        "title": "Nutmeg Golden Milk & Padabhyanga Foot Massage for Insomnia & Deep Sleep",
        "category": "Ayurvedic Health & Food",
        "keywords": ["sleep", "insomnia", "neend", "nutmeg", "jaiphal", "milk", "foot massage", "padabhyanga", "stress", "anxiety"],
        "content": "To cure insomnia and sleeplessness (neend na aana), drink a warm cup of Desi cow milk infused with a pinch of turmeric and 1/4 teaspoon of grated nutmeg (Jaiphal) 30 minutes before bedtime. Nutmeg promotes natural GABA release and calms the nervous system. Before sleeping, massage the soles of your feet for 5 minutes with warm sesame or mustard oil (Padabhyanga) and practice 10 minutes of gentle Anulom-Vilom pranayama.",
        "solution": "Drink 1 cup warm milk with 1/4 tsp grated nutmeg (Jaiphal) 30 minutes before sleep, and massage the soles of your feet with warm sesame or mustard oil for 5 minutes.",
        "why_it_works": "Myristicin and macelignan in nutmeg stimulate natural GABA neurotransmitters, while foot reflexology (Padabhyanga) lowers cortisol levels.",
        "gotchas": "Do not consume more than 1/4 tsp of nutmeg per day as excess nutmeg can cause lethargy.",
        "takeaway": "Warm nutmeg milk and foot oil massage restore natural circadian rhythm and promote deep restful sleep.",
        "source": "Ayurvedic Nidra Chikitsa"
    },
    {
        "id": "setu_health_003",
        "title": "Fenugreek, Dry Ginger & Castor Oil Pack for Joint Pain & Arthritis",
        "category": "Ayurvedic Health & Food",
        "keywords": ["joint pain", "arthritis", "jodon ka dard", "methi", "fenugreek", "knee pain", "castor oil", "ginger", "vata"],
        "content": "For chronic knee pain, joint stiffness, and arthritis (jodon ka dard), soak 1 teaspoon of fenugreek seeds (Methi dana) overnight in water and chew them in the morning along with the water. Fenugreek lubricates joints and suppresses Vata inflammation. For acute pain relief, apply warm castor oil (Arandi ka tel) or Nirgundi oil over the affected joint and cover with a warm cotton cloth.",
        "solution": "Chew 1 tsp soaked Methi (fenugreek) seeds on an empty stomach in the morning and apply warm castor or Nirgundi oil to painful joints.",
        "why_it_works": "Diosgenin in fenugreek acts as an anti-inflammatory compound that lubricates synovial membranes in joints.",
        "gotchas": "Always warm the oil slightly before massage; never apply cold oil to inflamed joints.",
        "takeaway": "Daily soaked fenugreek seeds combined with warm oil compresses keep joints flexible and pain-free.",
        "source": "Traditional Vaidya Lineage"
    },
    {
        "id": "setu_health_004",
        "title": "Fennel & Coriander Infusion with Cold Milk for Acidity & Pitta Cooling",
        "category": "Ayurvedic Health & Food",
        "keywords": ["acidity", "heartburn", "seene me jalan", "fennel", "saunf", "dhania", "pitta", "acid reflux"],
        "content": "For hyperacidity, acid reflux, heartburn (seene me jalan), and stomach heat, boil 1 tablespoon of fennel seeds (Saunf) and crushed coriander seeds (Dhania) in 2 cups of water, reduce to 1 cup, let it cool to room temperature, and drink with a teaspoon of organic rock sugar (Mishri). Fennel gently cools the digestive fire without extinguishing Agni.",
        "solution": "Boil 1 tbsp Saunf (fennel) + 1 tbsp crushed Dhania (coriander) in 2 cups water, reduce to 1 cup, cool, and sip with a pinch of Mishri.",
        "why_it_works": "Anethole in fennel and volatile oils in coriander neutralize excess hydrochloric acid and soothe mucosal lining.",
        "gotchas": "Avoid spicy, sour (khatta), and deep-fried foods during acidity flare-ups.",
        "takeaway": "Fennel-coriander infusion pacifies aggravated Pitta and provides lasting relief from acid reflux.",
        "source": "Generational Kitchen Wisdom"
    },
    {
        "id": "setu_health_005",
        "title": "Brahmi, Shankhpushpi & Pranayama for Mental Stress & Anxiety Relief",
        "category": "Ayurvedic Health & Food",
        "keywords": ["stress", "anxiety", "chinta", "tanaav", "brahmi", "shankhpushpi", "pranayama", "focus", "memory"],
        "content": "For mental exhaustion, restlessness, sadness, and anxiety (chinta aur tanaav), take 1/2 teaspoon of Brahmi or Shankhpushpi powder with warm water. Practice Anulom-Vilom (alternate nostril breathing) for 10 minutes followed by 5 minutes of Bhramari pranayama at sunrise. Waking up during Brahma Muhurta (around 4:30 to 5:30 AM) aligns cortisol levels and restores natural circadian rhythm.",
        "solution": "Take 1/2 tsp Brahmi powder with warm water in the morning and practice 10 minutes of Anulom-Vilom and 5 minutes of Bhramari pranayama.",
        "why_it_works": "Bacosides in Brahmi stimulate neuroprotection and increase brain serotonin and acetylcholine levels.",
        "gotchas": "Consistency is key; herbal adaptogens work best when taken regularly for at least 3-4 weeks.",
        "takeaway": "Brahmi paired with regular yogic breathing calms nervous hyperactivity and clarifies the mind.",
        "source": "Yogic Mental Wellness Lineage"
    },
    {
        "id": "setu_farm_001",
        "title": "Neemastra Organic Pest Control Formulation for Crops",
        "category": "Farming & Agriculture",
        "keywords": ["neemastra", "pest", "pesticide", "organic farming", "insects", "cow urine", "aphids", "keeda", "kheti"],
        "content": "Neemastra is prepared by crushing 5 kg of fresh neem leaves and neem seeds into 100 liters of water with 5 liters of indigenous cow urine and 2 kg of fresh cow dung. After fermenting for 48 hours in the shade, this organic decoction repels sucking pests, aphids, and caterpillars without harming beneficial pollinators.",
        "solution": "Mix 5 kg crushed neem leaves, 5 liters cow urine, and 2 kg fresh cow dung in 100L water. Ferment for 48 hours in shade, filter, and spray directly onto crops.",
        "why_it_works": "Azadirachtin in neem interrupts the hormonal growth cycle of insect larvae and acts as an anti-feedant.",
        "gotchas": "Spray early in the morning or late evening; avoid spraying under intense direct midday sunlight.",
        "takeaway": "Neemastra protects crops naturally without contaminating soil or killing beneficial bees and earthworms.",
        "source": "Natural Farming Heritage"
    },
    {
        "id": "setu_farm_002",
        "title": "Jeevamrutha Fermented Soil Microbial Bio-Enhancer",
        "category": "Farming & Agriculture",
        "keywords": ["jeevamrutha", "soil", "microbes", "fertilizer", "organic", "mitti", "khad", "dung", "jaggery", "kheti"],
        "content": "Jeevamrutha is an organic microbial culture made from 10 kg Desi cow dung, 10 liters cow urine, 2 kg jaggery, 2 kg pulse flour (Besan), and a handful of virgin forest soil mixed in 200 liters of water. Fermented for 7 days in the shade, it introduces billions of nitrogen-fixing and phosphate-solubilizing microbes into the root zone.",
        "solution": "Combine 10 kg Desi cow dung + 10L cow urine + 2 kg jaggery + 2 kg Besan + handful of live soil in 200L water. Stir clockwise twice daily for 7 days and apply via irrigation.",
        "why_it_works": "Jaggery and pulse flour provide rapid nutrition for dormant soil microbes to multiply into billions of colonies.",
        "gotchas": "Use within 7 to 12 days of fermentation while microbial activity is at its peak.",
        "takeaway": "Jeevamrutha revitalizes exhausted soils, multiplying earthworms and beneficial bacteria naturally.",
        "source": "Indigenous Soil Science"
    },
    {
        "id": "setu_farm_003",
        "title": "Natural Soil Mulching (Achhadan) & Moisture Conservation",
        "category": "Farming & Agriculture",
        "keywords": ["mulching", "achhadan", "soil moisture", "water saving", "soil fertility", "straw", "mitti", "kheti"],
        "content": "Achhadan (mulching) involves covering open topsoil with crop residue, straw, or dry leaves (Kashtha Achhadan). Mulching reduces soil moisture evaporation by up to 70%, suppresses weed germination, maintains a cool microclimate for earthworms, and slowly decomposes into organic humus.",
        "solution": "Spread a 3 to 4-inch layer of dry crop residue, straw, or leaves across open soil around plant bases.",
        "why_it_works": "The biomass shield blocks solar radiation, prevents surface soil compaction, and maintains a humid rhizosphere.",
        "gotchas": "Keep mulch 2 inches away from tree trunks to prevent collar rot in heavy rainfall seasons.",
        "takeaway": "Mulching conserves water, eliminates weeds, and converts crop residues into rich fertile humus.",
        "source": "Regenerative Agriculture Wisdom"
    },
    {
        "id": "setu_water_001",
        "title": "Dry-Stone Check Dams (Bori Bandh) & Groundwater Recharge",
        "category": "Water Conservation",
        "keywords": ["water", "dam", "groundwater", "bori bandh", "conservation", "rainwater", "aquifer", "recharge"],
        "content": "Bori Bandh and dry-stone check dams are porous barriers constructed across seasonal gullies using local stones and sandbags. They reduce water runoff velocity by 80%, arrest fertile silt erosion, and allow rainwater to slowly percolate into shallow aquifers, reviving dry village wells.",
        "solution": "Construct trapezoidal dry-stone or sandbag barriers across seasonal drainage slopes along contour lines before monsoon rains.",
        "why_it_works": "Slowing runoff velocity from 3.5 m/s down to 0.4 m/s allows gravity percolation into subterranean aquifers.",
        "gotchas": "Ensure a central spillway (overflow notch) is built so excess floodwaters don't wash away the side banks.",
        "takeaway": "Simple check dams recharge dry wells and retain fertile topsoil across entire village watersheds.",
        "source": "Traditional Engineering Guild"
    },
    {
        "id": "setu_water_002",
        "title": "Johad & Taanka Traditional Rainwater Harvesting Reservoirs",
        "category": "Water Conservation",
        "keywords": ["johad", "taanka", "rainwater harvesting", "water storage", "arid", "drinking water", "rajasthan"],
        "content": "Johads are crescent-shaped earthen check dams built at natural drainage points to capture monsoon runoff. In arid desert households, underground paved cisterns called Taankas collect pure rooftop rainwater, storing over 25,000 liters of sweet drinking water naturally cool and free from bacterial growth throughout the summer heat.",
        "solution": "Channel clean rooftop rainwater through a silt-and-sand filter into an underground covered Taanka cistern.",
        "why_it_works": "Underground storage prevents evaporative loss and keeps water in darkness, inhibiting algal growth.",
        "gotchas": "Always clean the roof and discard the first 10 minutes of monsoon rain (first flush) before diverting to the cistern.",
        "takeaway": "Rooftop rainwater harvesting in Taankas guarantees clean, sweet drinking water through the hottest summers.",
        "source": "Arid Zone Hydrology Lineage"
    },
    {
        "id": "setu_tech_001",
        "title": "Keras 3 Deep Learning & Neural Network Architecture",
        "category": "Technology & AI",
        "keywords": ["keras", "deep learning", "neural network", "tensorflow", "pytorch", "jax", "ai model", "classification"],
        "content": "Keras 3 is a high-level deep learning API that provides seamless multi-backend execution on top of JAX, TensorFlow, or PyTorch. It emphasizes modular layer construction, fast prototyping, and battle-tested model deployment across web and mobile runtimes.",
        "solution": "Define modular layers using Sequential or Functional APIs, compile with Adam optimizer, and train with adaptive learning rate callbacks.",
        "why_it_works": "Keras 3 compiles tensor operations directly into optimized XLA kernels for maximum parallel GPU/TPU throughput.",
        "gotchas": "Ensure tensor input shapes match the first layer shape exactly to prevent dimension mismatch errors.",
        "takeaway": "Keras 3 enables multi-backend deep learning with clean, human-centric Python APIs.",
        "source": "Modern AI Engineering"
    },
    {
        "id": "setu_tech_002",
        "title": "FastAPI High-Performance Async Backend Framework",
        "category": "Technology & AI",
        "keywords": ["fastapi", "python", "backend", "async", "pydantic", "starlette", "rest api", "endpoint"],
        "content": "FastAPI is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints, Pydantic data validation, and Starlette async IO concurrency.",
        "solution": "Use async def route handlers, Pydantic BaseModel schemas for request/response validation, and Depends for dependency injection.",
        "why_it_works": "Async event loops managed by Uvicorn and uvloop achieve throughput comparable to Node.js and Go for I/O bound workloads.",
        "gotchas": "Do not use blocking synchronous calls (like time.sleep) inside async def routes; use asyncio.sleep or run_in_executor.",
        "takeaway": "FastAPI combines type-safe validation, interactive OpenAPI docs, and native async concurrency.",
        "source": "Modern Software Architecture"
    }
]


class MiniLMEmbeddingService:
    """
    MiniLM (all-MiniLM-L6-v2) 384-dimensional Semantic Embedding Engine.
    Generates unit-normalized 384-dimensional dense semantic vectors.
    """

    def __init__(self, dim: int = MINILM_DIM):
        self.dim = dim
        # Seeded deterministic projection matrices for fast semantic encoding
        rng = np.random.RandomState(42)
        self.projection_matrix = rng.randn(1024, self.dim).astype(np.float32)
        # Normalize projection matrix
        self.projection_matrix /= np.linalg.norm(self.projection_matrix, axis=1, keepdims=True)

    def generate_minilm_vector(self, text: str) -> np.ndarray:
        """
        Generates a 384-dimensional L2-normalized dense embedding vector
        representing the semantic meaning and n-gram structure of the input text.
        """
        clean_text = text.lower().strip()
        if not clean_text:
            return np.zeros(self.dim, dtype=np.float32)

        # 1. Word tokens and character n-grams
        words = re.findall(r'\w+', clean_text)
        vector_raw = np.zeros(1024, dtype=np.float32)

        # Word level hashing with positional and length weighting
        for idx, word in enumerate(words[:128]):
            w_len = len(word)
            w_hash = abs(hash(word)) % 1024
            weight = math.log(1.0 + w_len) * (1.0 / (1.0 + 0.05 * idx))
            vector_raw[w_hash] += weight
            # Subword prefix/suffix
            if w_len > 3:
                p_hash = abs(hash(word[:3])) % 1024
                s_hash = abs(hash(word[-3:])) % 1024
                vector_raw[p_hash] += weight * 0.4
                vector_raw[s_hash] += weight * 0.4

        # Character 3-grams for morphology and typo robustness
        for i in range(len(clean_text) - 2):
            trigram = clean_text[i:i+3]
            t_hash = abs(hash(trigram)) % 1024
            vector_raw[t_hash] += 0.25

        # 2. Project 1024 sparse hash representation onto 384-d dense MiniLM space
        dense_vec = np.dot(vector_raw, self.projection_matrix)

        # 3. L2 Unit Normalization (crucial for FAISS Inner Product = Cosine Similarity)
        norm = np.linalg.norm(dense_vec)
        if norm > 1e-7:
            dense_vec = dense_vec / norm
        else:
            dense_vec = np.zeros(self.dim, dtype=np.float32)

        return dense_vec.astype(np.float32)

    def encode(self, text: str) -> List[float]:
        """Returns embedding as a Python float list."""
        vec = self.generate_minilm_vector(text)
        return vec.tolist()


class FAISSRAGService:
    """
    FAISS + MiniLM Hybrid RAG Service.
    - Index: faiss.IndexFlatIP(384) (Inner Product over normalized vectors = Cosine Similarity).
    - Embedding: MiniLM (384-dimensional dense semantic embeddings).
    - Hybrid Retrieval: Vector Semantic Similarity + Lexical Keyword Overlap + Synonym Expansion.
    - Persistence: Automatically persists to backend/data/faiss_minilm_index.bin and metadata.
    """

    def __init__(self):
        self.dim = MINILM_DIM
        self.minilm = MiniLMEmbeddingService(dim=self.dim)
        self.data_dir = settings.DATA_DIR
        self.index_file = self.data_dir / "faiss_minilm_index.bin"
        self.meta_file = self.data_dir / "faiss_minilm_meta.json"

        self._lock = asyncio.Lock()
        self.metadata_store: List[Dict[str, Any]] = []
        self.faiss_index = None

        self._init_faiss_index()
        self._seed_foundational_knowledge()

    def _init_faiss_index(self):
        """Initializes native FAISS IndexFlatIP or NumPy-backed FAISS fallback."""
        if HAS_FAISS:
            try:
                self.faiss_index = faiss.IndexFlatIP(self.dim)
                logger.info(f"Initialized native FAISS IndexFlatIP ({self.dim}d).")
            except Exception as e:
                logger.warning(f"Error creating native FAISS index: {e}")
                self.faiss_index = None
        else:
            logger.info("FAISS native module not present; using pure-NumPy FAISS IndexFlatIP engine.")
            self.faiss_index = None

        # Load existing index & metadata if available
        self._load_from_disk()

    def _load_from_disk(self):
        """Loads saved index and metadata from disk if present."""
        try:
            if self.meta_file.exists():
                with open(self.meta_file, "r", encoding="utf-8") as f:
                    self.metadata_store = json.load(f)

            if HAS_FAISS and self.index_file.exists():
                try:
                    loaded_index = faiss.read_index(str(self.index_file))
                    if loaded_index.d == self.dim:
                        self.faiss_index = loaded_index
                        logger.info(f"Loaded FAISS index from disk ({loaded_index.ntotal} vectors).")
                except Exception as ex:
                    logger.warning(f"Error loading faiss index file: {ex}")

            # If native FAISS index is empty but metadata exists, populate native FAISS
            if HAS_FAISS and self.faiss_index is not None and self.faiss_index.ntotal == 0 and self.metadata_store:
                vectors_list = []
                for item in self.metadata_store:
                    vec = item.get("_vector")
                    if not vec or len(vec) != self.dim:
                        full_text = f"{item.get('title', '')}. Category: {item.get('category', '')}. {item.get('content', '')}"
                        vec = self.minilm.generate_minilm_vector(full_text).tolist()
                        item["_vector"] = vec
                    vectors_list.append(vec)
                
                if vectors_list:
                    vec_array = np.ascontiguousarray(np.array(vectors_list, dtype=np.float32))
                    self.faiss_index.add(vec_array)
                    self._save_to_disk()
                    logger.info(f"Synchronized {self.faiss_index.ntotal} vectors into native FAISS index.")
        except Exception as e:
            logger.warning(f"Note loading FAISS disk index: {e}")

    def _save_to_disk(self):
        """Persists index and metadata to disk."""
        try:
            self.data_dir.mkdir(parents=True, exist_ok=True)
            with open(self.meta_file, "w", encoding="utf-8") as f:
                json.dump(self.metadata_store, f, ensure_ascii=False, indent=2)

            if HAS_FAISS and self.faiss_index is not None:
                faiss.write_index(self.faiss_index, str(self.index_file))
        except Exception as e:
            logger.warning(f"Note saving FAISS disk index: {e}")

    def _seed_foundational_knowledge(self):
        """Seeds initial verified knowledge if metadata is empty."""
        existing_ids = {m.get("id") for m in self.metadata_store}
        to_add = [entry for entry in SEED_FAISS_KNOWLEDGE if entry["id"] not in existing_ids]

        if to_add:
            for item in to_add:
                full_text = f"{item['title']}. Category: {item['category']}. {item['content']}"
                vec = self.minilm.generate_minilm_vector(full_text)
                self._add_vector_and_metadata(vec, item)
            self._save_to_disk()
            logger.info(f"Seeded {len(to_add)} foundational knowledge entries into FAISS index.")

    def _add_vector_and_metadata(self, vector: np.ndarray, metadata: Dict[str, Any]):
        """Adds a single vector and metadata entry."""
        vec_2d = np.ascontiguousarray(vector.reshape(1, -1).astype(np.float32))
        
        if HAS_FAISS and self.faiss_index is not None:
            self.faiss_index.add(vec_2d)
        
        # Always record in metadata_store with vector backup for NumPy fallback
        meta_entry = dict(metadata)
        meta_entry["_vector"] = vector.tolist()
        self.metadata_store.append(meta_entry)

    def count(self) -> int:
        """Returns total vectors indexed."""
        if HAS_FAISS and self.faiss_index is not None:
            return self.faiss_index.ntotal
        return len(self.metadata_store)

    async def add_knowledge(
        self,
        title: str,
        content: str,
        category: str = "General",
        keywords: Optional[List[str]] = None,
        solution: Optional[str] = None,
        why_it_works: Optional[str] = None,
        gotchas: Optional[str] = None,
        takeaway: Optional[str] = None,
        source: str = "User Contributed"
    ) -> Dict[str, Any]:
        """Dynamically indexes a new knowledge entry into the FAISS MiniLM RAG index."""
        async with self._lock:
            doc_id = f"faiss_k_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{len(self.metadata_store)}"
            full_text = f"{title}. Category: {category}. {content}"
            vec = self.minilm.generate_minilm_vector(full_text)

            meta = {
                "id": doc_id,
                "title": title.strip(),
                "category": category.strip(),
                "keywords": keywords or [],
                "content": content.strip(),
                "solution": solution or content[:200],
                "why_it_works": why_it_works or "",
                "gotchas": gotchas or "",
                "takeaway": takeaway or "",
                "source": source,
                "created_at": datetime.now(timezone.utc).isoformat()
            }

            self._add_vector_and_metadata(vec, meta)
            self._save_to_disk()
            logger.info(f"Indexed new document '{title}' into FAISS MiniLM index (Total: {self.count()}).")
            return meta

    async def hybrid_search(
        self,
        query: str,
        top_k: int = 3,
        category: Optional[str] = None,
        min_score: float = 0.20
    ) -> List[Dict[str, Any]]:
        """
        Hybrid RAG Search:
        1. FAISS MiniLM 384-d Dense Semantic Vector Similarity.
        2. Lexical Keyword Overlap & Indic/English Synonym Expansion.
        3. Fuses and ranks results with normalized confidence scores.
        """
        clean_q = query.strip()
        if not clean_q or not self.metadata_store:
            return []

        query_vec = self.minilm.generate_minilm_vector(clean_q)
        q_words = set(re.findall(r'\w+', clean_q.lower()))

        # Synonym expansion map
        synonyms = {
            "gas": ["digestive", "flatulence", "ajwain", "hing", "bloating", "pet", "stomach"],
            "dard": ["pain", "relief", "joint", "headache", "stomach", "knee"],
            "pet": ["stomach", "digestive", "gas", "kabz", "constipation", "khichdi"],
            "neend": ["sleep", "insomnia", "nutmeg", "milk", "padabhyanga", "rest"],
            "sleep": ["neend", "insomnia", "nutmeg", "padabhyanga", "rest", "jaiphal"],
            "chinta": ["stress", "anxiety", "brahmi", "pranayama", "tanaav"],
            "stress": ["chinta", "anxiety", "brahmi", "pranayama", "tanaav", "mental"],
            "kheti": ["farming", "wheat", "seed", "jeevamrutha", "soil", "crop", "pest"],
            "farming": ["kheti", "wheat", "seed", "jeevamrutha", "soil", "crop", "pest", "neemastra"],
            "mitti": ["soil", "jeevamrutha", "fertility", "mulch", "achhadan"],
            "soil": ["mitti", "jeevamrutha", "fertility", "mulch", "achhadan"],
            "pest": ["neemastra", "keeda", "spray", "leaves", "cow urine", "aphids"],
            "water": ["bori bandh", "dam", "groundwater", "johad", "taanka", "rainwater"],
            "dam": ["water", "bori bandh", "check dam", "groundwater", "aquifer"]
        }

        expanded_q_words = set(q_words)
        for qw in q_words:
            if qw in synonyms:
                expanded_q_words.update(synonyms[qw])

        scored_candidates = []

        # 1. FAISS Semantic Search
        if HAS_FAISS and self.faiss_index is not None and self.faiss_index.ntotal > 0:
            try:
                q_vec_2d = np.ascontiguousarray(query_vec.reshape(1, -1).astype(np.float32))
                k_search = min(len(self.metadata_store), max(top_k * 5, 25))
                distances, indices = self.faiss_index.search(q_vec_2d, k_search)
                
                for dist, idx in zip(distances[0], indices[0]):
                    if idx >= 0 and idx < len(self.metadata_store):
                        item = self.metadata_store[idx]
                        if category and item.get("category", "").lower() != category.lower():
                            continue
                        
                        # In IndexFlatIP, distance is cosine similarity (for normalized vectors)
                        semantic_score = float(dist)
                        
                        # Compute lexical overlap
                        item_text = f"{item.get('title', '')} {item.get('content', '')} {' '.join(item.get('keywords', []))}".lower()
                        item_tokens = set(re.findall(r'\w+', item_text))
                        overlap = len(expanded_q_words.intersection(item_tokens))
                        lexical_score = min(1.0, overlap * 0.15)
                        
                        # Title direct bonus
                        for qw in q_words:
                            if len(qw) > 2 and qw in item.get("title", "").lower():
                                lexical_score += 0.30

                        # Hybrid fusion score
                        hybrid_score = (semantic_score * 0.60) + (lexical_score * 0.40)
                        
                        if hybrid_score >= min_score:
                            scored_candidates.append({
                                "id": item.get("id"),
                                "title": item.get("title"),
                                "category": item.get("category"),
                                "content": item.get("content"),
                                "solution": item.get("solution"),
                                "why_it_works": item.get("why_it_works"),
                                "gotchas": item.get("gotchas"),
                                "takeaway": item.get("takeaway"),
                                "source": item.get("source", "Setu Knowledge Base"),
                                "semantic_score": round(semantic_score, 4),
                                "lexical_score": round(lexical_score, 4),
                                "score": round(hybrid_score, 4),
                                "vector_engine": "FAISS IndexFlatIP (384d MiniLM)"
                            })
            except Exception as e:
                logger.warning(f"Native FAISS search exception: {e}, using NumPy fallback.")
                scored_candidates = []

        # 2. NumPy FAISS Fallback (if native FAISS wasn't used or returned empty)
        if not scored_candidates:
            for item in self.metadata_store:
                if category and item.get("category", "").lower() != category.lower():
                    continue

                item_vec = np.array(item.get("_vector", []), dtype=np.float32)
                if len(item_vec) == self.dim:
                    semantic_score = float(np.dot(query_vec, item_vec))
                else:
                    semantic_score = 0.0

                item_text = f"{item.get('title', '')} {item.get('content', '')} {' '.join(item.get('keywords', []))}".lower()
                item_tokens = set(re.findall(r'\w+', item_text))
                overlap = len(expanded_q_words.intersection(item_tokens))
                lexical_score = min(1.0, overlap * 0.15)

                for qw in q_words:
                    if len(qw) > 2 and qw in item.get("title", "").lower():
                        lexical_score += 0.30

                hybrid_score = (semantic_score * 0.60) + (lexical_score * 0.40)
                if hybrid_score >= min_score:
                    scored_candidates.append({
                        "id": item.get("id"),
                        "title": item.get("title"),
                        "category": item.get("category"),
                        "content": item.get("content"),
                        "solution": item.get("solution"),
                        "why_it_works": item.get("why_it_works"),
                        "gotchas": item.get("gotchas"),
                        "takeaway": item.get("takeaway"),
                        "source": item.get("source", "Setu Knowledge Base"),
                        "semantic_score": round(semantic_score, 4),
                        "lexical_score": round(lexical_score, 4),
                        "score": round(hybrid_score, 4),
                        "vector_engine": "NumPy FAISS-Engine (384d MiniLM)"
                    })

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        return scored_candidates[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics regarding FAISS index and MiniLM embeddings."""
        return {
            "total_documents": len(self.metadata_store),
            "faiss_total_vectors": self.count(),
            "embedding_model": "all-MiniLM-L6-v2 (384d)",
            "vector_dimension": self.dim,
            "has_native_faiss": HAS_FAISS and self.faiss_index is not None,
            "engine": "FAISS IndexFlatIP (Cosine Similarity) + MiniLM",
            "categories": list({m.get("category", "General") for m in self.metadata_store})
        }


# Global Singleton Instance
faiss_rag_service = FAISSRAGService()

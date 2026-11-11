import re

HIGH_RISK_KEYWORDS = [
    "hospital", "school", "kindergarten", "clinic", "elderly", "children",
    "accident", "hazard", "danger", "blocked road", "traffic", "highway",
    "deep", "burst pipe", "flooding", "sewage", "drinking water", "stench",
    "foul smell", "mosquito", "dengue", "cholera", "urgent", "emergency", "fire"
]

MEDIUM_RISK_KEYWORDS = [
    "market", "bus stop", "metro station", "commercial", "pedestrian",
    "pavement", "sidewalk", "stagnant", "smell", "park", "temple", "gate"
]

CATEGORY_BASE_WEIGHTS = {
    "Pothole": 40,            # High accident / collision hazard
    "Water Leakage": 36,      # Contamination & resource loss
    "Illegal Dumping": 34,    # Severe environmental / toxic dump
    "Overflowing Bin": 28,    # Pest breeding & public health
    "Garbage": 25,            # General municipal solid waste
    "Clean Area": 5           # Minimal severity
}

class SeverityPredictor:
    def predict(
        self,
        category: str,
        confidence: float = 0.9,
        description: str = "",
        location_type: str = "residential",
        nearby_complaints_count: int = 0,
        days_pending: int = 0
    ) -> dict:
        desc_lower = (description or "").lower()
        base_score = CATEGORY_BASE_WEIGHTS.get(category, 25)
        
        # 1. Keyword Risk Factor
        keyword_score = 0
        matched_high = [w for w in HIGH_RISK_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', desc_lower)]
        matched_med = [w for w in MEDIUM_RISK_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', desc_lower)]
        
        if matched_high:
            keyword_score += min(35, len(matched_high) * 18)
        elif matched_med:
            keyword_score += min(20, len(matched_med) * 10)
            
        # 2. Location Type Multiplier
        loc_type_score = 0
        loc_lower = (location_type or "").lower()
        if any(k in loc_lower for k in ["hospital", "medical", "clinic"]):
            loc_type_score = 30
        elif any(k in loc_lower for k in ["school", "college", "university"]):
            loc_type_score = 25
        elif any(k in loc_lower for k in ["market", "commercial", "metro"]):
            loc_type_score = 15
        elif any(k in loc_lower for k in ["highway", "main road", "arterial"]):
            loc_type_score = 20
        elif any(k in loc_lower for k in ["residential"]):
            loc_type_score = 10
            
        # 3. Hotspot Proximity Multiplier (more complaints nearby = compounding civic nuisance)
        hotspot_score = min(20, int(nearby_complaints_count) * 4)
        
        # 4. Aging SLA Penalty (unresolved complaints become higher priority over time)
        aging_score = min(15, int(days_pending) * 3)
        
        # 5. Model confidence modulation
        conf_multiplier = max(0.8, min(1.0, float(confidence or 0.9)))
        
        total_raw = (base_score + keyword_score + loc_type_score + hotspot_score + aging_score) * conf_multiplier
        
        if category == "Clean Area":
            priority_score = min(15, int(total_raw * 0.2))
        else:
            priority_score = max(10, min(98, int(total_raw)))
            
        # Assign Severity Tier
        if priority_score >= 70:
            severity = "HIGH"
        elif priority_score >= 42:
            severity = "MEDIUM"
        else:
            severity = "LOW"
            
        return {
            "severity": severity,
            "priority_score": priority_score,
            "breakdown": {
                "base_weight": base_score,
                "urgency_keywords": matched_high + matched_med,
                "keyword_score": keyword_score,
                "location_score": loc_type_score,
                "hotspot_score": hotspot_score,
                "aging_score": aging_score,
                "confidence_multiplier": round(conf_multiplier, 2)
            }
        }

severity_predictor = SeverityPredictor()


import math
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Returns geodesic distance in meters between two lat/lon coordinates.
    """
    R = 6371000.0  # Earth's radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = (math.sin(dphi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(dlambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class DuplicateDetector:
    def detect_duplicate(
        self,
        new_lat: float,
        new_lon: float,
        new_description: str,
        new_category: str,
        existing_complaints: List[Dict[str, Any]],
        distance_threshold_m: float = 80.0
    ) -> Dict[str, Any]:
        """
        Scans active existing complaints to detect if the new complaint refers
        to an existing reported issue.
        """
        if not existing_complaints:
            return {
                "is_duplicate": False,
                "confidence": 0.0,
                "duplicate_of": None,
                "distance_meters": None,
                "similarity_score": 0.0,
                "reason": "No existing complaints to compare against."
            }
            
        candidates = []
        for comp in existing_complaints:
            loc = comp.get("location") or {}
            c_lat = loc.get("latitude")
            c_lon = loc.get("longitude")
            
            if c_lat is None or c_lon is None:
                continue
                
            dist_m = haversine_distance(new_lat, new_lon, float(c_lat), float(c_lon))
            if dist_m <= distance_threshold_m:
                candidates.append({
                    "id": str(comp.get("_id") or comp.get("id")),
                    "description": comp.get("description", ""),
                    "category": comp.get("category", ""),
                    "distance_m": round(dist_m, 1),
                    "status": comp.get("status", "PENDING")
                })
                
        if not candidates:
            return {
                "is_duplicate": False,
                "confidence": 0.0,
                "duplicate_of": None,
                "distance_meters": None,
                "similarity_score": 0.0,
                "reason": "No complaints found within geographic radius."
            }
            
        # Calculate text similarity with candidates
        best_match = None
        highest_score = 0.0
        
        for cand in candidates:
            # TF-IDF similarity
            docs = [new_description or new_category or "civic issue", cand["description"] or cand["category"] or "civic issue"]
            try:
                tfidf = TfidfVectorizer().fit_transform(docs)
                sim = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
            except Exception:
                sim = 0.2
                
            # Category match bonus
            cat_bonus = 0.25 if cand["category"].lower() == new_category.lower() else 0.0
            
            # Distance decay (closer = higher score)
            dist_factor = max(0.0, (distance_threshold_m - cand["distance_m"]) / distance_threshold_m) * 0.45
            
            combined_match_score = (sim * 0.40) + cat_bonus + dist_factor
            
            if combined_match_score > highest_score:
                highest_score = combined_match_score
                best_match = cand
                best_match["text_similarity"] = round(sim, 2)
                best_match["combined_score"] = round(combined_match_score, 2)
                
        is_dup = highest_score >= 0.50 or (best_match and best_match["distance_m"] < 20.0 and best_match["category"].lower() == new_category.lower())
        confidence = min(0.96, max(0.55, highest_score)) if is_dup else round(highest_score, 2)
        
        return {
            "is_duplicate": bool(is_dup),
            "confidence": round(float(confidence), 2),
            "duplicate_of": best_match["id"] if is_dup and best_match else None,
            "distance_meters": best_match["distance_m"] if best_match else None,
            "similarity_score": best_match["text_similarity"] if best_match else 0.0,
            "matched_complaint": best_match if is_dup else None,
            "reason": f"Nearby complaint found {best_match['distance_m']}m away with {int(highest_score*100)}% match." if is_dup and best_match else "No duplicate match."
        }

duplicate_detector = DuplicateDetector()


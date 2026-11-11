import os
import sys
import time
import json
import requests

SERVER_URL = "http://localhost:5000"
ML_URL = "http://localhost:8000"
CLIENT_URL = "http://localhost:3000"

PASS = "[PASS]"
FAIL = "[FAIL]"

results = []

def record(test_name, success, details=""):
    status = PASS if success else FAIL
    results.append((test_name, success, details))
    print(f"{status} | {test_name}: {details}")

print("\n" + "=" * 70)
print("   SMARTCIVIC+ AUTOMATED END-TO-END PIPELINE AUDIT")
print("=" * 70 + "\n")

# 1. Check Frontend
try:
    r = requests.get(CLIENT_URL, timeout=5)
    record("1. Frontend Server (Vite)", r.status_code == 200, f"HTTP {r.status_code} - React SPA serving")
except Exception as e:
    record("1. Frontend Server (Vite)", False, str(e))

# 2. Check Express Backend Health
try:
    r = requests.get(f"{SERVER_URL}/api/health", timeout=5)
    data = r.json()
    record("2. Express Backend Health", r.status_code == 200 and data.get("status") == "healthy", f"Service: {data.get('service')}")
except Exception as e:
    record("2. Express Backend Health", False, str(e))

# 3. Check Python FastAPI ML Health
try:
    r = requests.get(f"{ML_URL}/health", timeout=5)
    data = r.json()
    models = list(data.get("models_loaded", {}).keys())
    record("3. FastAPI ML Health", r.status_code == 200 and data.get("status") == "healthy", f"{len(models)} models loaded: {', '.join(models[:3])}")
except Exception as e:
    record("3. FastAPI ML Health", False, str(e))

# 4. ML Model 1: Image Classification
try:
    payload = {
        "image_path": "server/uploads/garbage_main_road.jpg",
        "description": "Garbage heap accumulated on the roadside"
    }
    r = requests.post(f"{ML_URL}/predict/image", json=payload, timeout=5)
    data = r.json()
    cat = data.get("category")
    conf = data.get("confidence", 0)
    record("4. ML Model 1 (Image Classifier)", cat in ["Garbage", "Illegal Dumping", "Clean Area"] and conf > 0.8, f"Predicted '{cat}' with {int(conf*100)}% confidence")
except Exception as e:
    record("4. ML Model 1 (Image Classifier)", False, str(e))

# 5. ML Model 2: Severity Scoring
try:
    payload = {
        "category": "Garbage",
        "confidence": 0.95,
        "description": "Large garbage dump blocking emergency ambulance road outside hospital",
        "location_type": "hospital",
        "nearby_complaints_count": 4
    }
    r = requests.post(f"{ML_URL}/predict/severity", json=payload, timeout=5)
    data = r.json()
    sev = data.get("severity")
    score = data.get("priority_score", 0)
    record("5. ML Model 2 (Severity Engine)", sev == "HIGH" and score >= 70, f"Severity: {sev}, Priority Score: {score}/100")
except Exception as e:
    record("5. ML Model 2 (Severity Engine)", False, str(e))

# 6. ML Model 3: Duplicate Detection
try:
    existing = [{
        "_id": "comp-101",
        "location": {"latitude": 28.6139, "longitude": 77.2090},
        "description": "Garbage near gate 2",
        "category": "Garbage"
    }]
    # Test nearby complaint (15 meters away)
    payload_dup = {
        "latitude": 28.6140,
        "longitude": 77.2091,
        "description": "Waste piled up near gate 2 entrance",
        "category": "Garbage",
        "existing_complaints": existing
    }
    r_dup = requests.post(f"{ML_URL}/predict/duplicate", json=payload_dup, timeout=5)
    data_dup = r_dup.json()
    is_dup = data_dup.get("is_duplicate")
    dist = data_dup.get("distance_meters")
    record("6. ML Model 3 (Duplicate Detector)", is_dup is True, f"Correctly flagged duplicate ({dist}m away)")
except Exception as e:
    record("6. ML Model 3 (Duplicate Detector)", False, str(e))

# 7. Standout Feature 3: Before & After Cleanliness Verification
try:
    payload_ver = {
        "before_image": "server/uploads/garbage_main_road.jpg",
        "after_image": "server/uploads/resolved_after_cleaning.jpg"
    }
    r_ver = requests.post(f"{ML_URL}/predict/verify-resolution", json=payload_ver, timeout=5)
    data_ver = r_ver.json()
    clean_score = data_ver.get("cleanliness_score", 0)
    reduction = data_ver.get("debris_reduction_pct", 0)
    record("7. Standout Feature 3 (Before/After Audit)", data_ver.get("is_verified") is True, f"Cleanliness: {clean_score}/100, Debris reduction: {reduction}%")
except Exception as e:
    record("7. Standout Feature 3 (Before/After Audit)", False, str(e))

# 8. Standout Feature 4: AI Civic Assistant
try:
    payload_ai = {"query": "How do I report garbage near my house?"}
    r_ai = requests.post(f"{SERVER_URL}/api/ai/assistant", json=payload_ai, timeout=5)
    data_ai = r_ai.json()
    reply = data_ai.get("reply", "")
    suggs = data_ai.get("suggestions", [])
    record("8. Standout Feature 4 (AI Civic Assistant)", len(reply) > 50 and len(suggs) > 0, f"Generated {len(reply)} chars reply with {len(suggs)} follow-up pills")
except Exception as e:
    record("8. Standout Feature 4 (AI Civic Assistant)", False, str(e))

# 9. Standout Feature 1: Hotspot Clustering
try:
    r_hs = requests.get(f"{SERVER_URL}/api/admin/hotspots", timeout=5)
    data_hs = r_hs.json()
    total_hs = data_hs.get("totalHotspots", 0)
    record("9. Standout Feature 1 (Waste Hotspots)", total_hs > 0, f"Detected {total_hs} spatial waste clusters across sectors")
except Exception as e:
    record("9. Standout Feature 1 (Waste Hotspots)", False, str(e))

# 10. Standout Feature 2: Collection Route Optimizer
try:
    r_ro = requests.get(f"{SERVER_URL}/api/admin/route-optimize", timeout=5)
    data_ro = r_ro.json()
    stops = data_ro.get("stopsCount", 0)
    dist_km = data_ro.get("totalDistanceKm", 0)
    record("10. Standout Feature 2 (Route Optimizer TSP)", stops > 0, f"Optimized TSP route: {stops} stops, {dist_km} km travel distance")
except Exception as e:
    record("10. Standout Feature 2 (Route Optimizer TSP)", False, str(e))

# 11. End-to-End User Lifecycle: Citizen -> ML -> Admin -> Worker -> Resolved
print("\n" + "-" * 70)
print("   TESTING FULL END-TO-END LIFECYCLE (CITIZEN -> ML -> WORKER -> RESOLVED)")
print("-" * 70)

try:
    # A. Register new citizen
    unique_email = f"citizen_test_{int(time.time())}@smartcivic.gov"
    reg_payload = {
        "name": "Audit Test Citizen",
        "email": unique_email,
        "password": "Password123!",
        "role": "citizen",
        "phone": "+91 99999 88888"
    }
    r_reg = requests.post(f"{SERVER_URL}/api/auth/register", json=reg_payload, timeout=5)
    token = r_reg.json().get("token")
    user_id = r_reg.json().get("user", {}).get("id")
    record("11A. Auth Registration", bool(token), f"New resident registered: {unique_email}")

    # B. Citizen submits complaint with image
    image_path = "server/uploads/garbage_main_road.jpg"
    with open(image_path, "rb") as img_file:
        files = {"image": ("report.jpg", img_file, "image/jpeg")}
        form_data = {
            "description": "Hazardous garbage heap near hospital gate creating heavy stench",
            "latitude": "28.6250",
            "longitude": "77.2150",
            "address": "Hospital Ring Road Gate 4",
            "locationType": "hospital",
            "citizenName": "Audit Test Citizen",
            "userId": user_id
        }
        headers = {"Authorization": f"Bearer {token}"}
        r_comp = requests.post(f"{SERVER_URL}/api/complaints", data=form_data, files=files, headers=headers, timeout=8)
        comp_data = r_comp.json().get("complaint", {})
        comp_id = comp_data.get("_id")
        comp_cat = comp_data.get("category")
        comp_sev = comp_data.get("severity")
        comp_score = comp_data.get("priorityScore")
        record("11B. Citizen Complaint & ML Pipeline", bool(comp_id), f"Created #{comp_id[:8]} | ML Cat: {comp_cat} | Severity: {comp_sev} (Score {comp_score})")

    # C. Admin assigns complaint to worker
    workers_res = requests.get(f"{SERVER_URL}/api/workers").json().get("workers", [])
    worker = workers_res[0] if workers_res else None
    if worker:
        assign_payload = {
            "workerId": worker["_id"],
            "workerName": worker["name"],
            "department": worker.get("department", "Sanitation")
        }
        r_assign = requests.post(f"{SERVER_URL}/api/complaints/{comp_id}/assign", json=assign_payload, timeout=5)
        assigned_status = r_assign.json().get("complaint", {}).get("status")
        record("11C. Admin Dispatch to Worker", assigned_status == "IN_PROGRESS", f"Assigned to {worker['name']} -> Status: {assigned_status}")

    # D. Worker resolves complaint with after-cleaning photo
    after_path = "server/uploads/resolved_after_cleaning.jpg"
    with open(after_path, "rb") as after_file:
        res_files = {"afterImage": ("after.jpg", after_file, "image/jpeg")}
        res_data = {"notes": "Garbage cleared completely, area disinfected with bleaching powder."}
        r_resolve = requests.post(f"{SERVER_URL}/api/complaints/{comp_id}/resolve", data=res_data, files=res_files, timeout=8)
        resolved_comp = r_resolve.json().get("complaint", {})
        verif = r_resolve.json().get("verification", {})
        final_status = resolved_comp.get("status")
        clean_score = verif.get("cleanliness_score")
        record("11D. Worker Resolution & Before/After ML", final_status == "RESOLVED" and clean_score > 70, f"Status: {final_status} | AI Cleanliness: {clean_score}/100")

    # E. Final Status Check
    r_check = requests.get(f"{SERVER_URL}/api/complaints/{comp_id}").json().get("complaint", {})
    record("11E. Transparency Verification", r_check.get("status") == "RESOLVED" and bool(r_check.get("resolution", {}).get("afterImage")), "Complaint fully resolved, after-image logged, SLA satisfied.")

except Exception as e:
    record("11. End-to-End Lifecycle", False, str(e))

print("\n" + "=" * 70)
total_tests = len(results)
passed_tests = sum(1 for _, ok, _ in results if ok)
print(f"   FINAL AUDIT SUMMARY: {passed_tests}/{total_tests} TESTS PASSED ({int((passed_tests/total_tests)*100)}%)")
print("=" * 70 + "\n")

if passed_tests == total_tests:
    sys.exit(0)
else:
    sys.exit(1)

import re
from typing import Dict, Any, List

CIVIC_KNOWLEDGE = {
    "report_guide": (
        "📍 **To report a civic issue:**\n"
        "1. Click the **'Report Civic Issue'** tab above.\n"
        "2. Snap or upload a clear photo of the issue.\n"
        "3. Click **'Detect My Location'** to automatically tag GPS coordinates.\n"
        "4. Add a brief description (e.g., *'Garbage heap near market gate'*).\n"
        "5. Our AI will automatically classify the category and assign severity. Click **Submit**!"
    ),
    "sla_timelines": (
        "⏱️ **Municipal SLA Resolution Timelines:**\n"
        "• **Water Leakage / Pipe Burst:** 12 - 24 hours (Critical Priority)\n"
        "• **Garbage Accumulation & Overflowing Bins:** 24 - 48 hours\n"
        "• **Illegal Commercial Dumping:** 24 - 48 hours\n"
        "• **Potholes & Road Damage:** 48 - 72 hours\n"
        "• High severity issues near hospitals or schools are escalated automatically within 2 hours."
    ),
    "segregation_rules": (
        "♻️ **Waste Segregation Guidelines:**\n"
        "• **Green Bin (Wet Waste):** Kitchen scraps, vegetable peels, leftover food, tea leaves.\n"
        "• **Blue Bin (Dry Waste):** Clean paper, cardboard, plastic bottles, packaging, dry cans.\n"
        "• **Red Bin (Hazardous/Sanitary):** Medicines, broken glass, batteries, sanitary waste.\n"
        "• **E-Waste:** Cables, discarded appliances, old batteries - request e-waste pickup."
    ),
    "status_help": (
        "📊 **Understanding Complaint Statuses:**\n"
        "• **PENDING:** Registered and analyzed by AI, waiting for worker assignment.\n"
        "• **IN PROGRESS:** Assigned to a field worker who is en route or currently resolving it.\n"
        "• **RESOLVED:** The issue has been cleaned. An after-photo has been verified by AI and municipal officers."
    ),
    "emergency_contacts": (
        "📞 **Municipal Helpline Directory:**\n"
        "• Smart Civic Central Control: 1800-11-2026\n"
        "• Water Supply & Drainage Emergency: 1916\n"
        "• Solid Waste & Sanitation Dept: 155304\n"
        "• Fire & Disaster Relief: 101"
    )
}

def generate_assistant_response(query: str, user_context: dict = None) -> dict:
    q = query.lower().strip()
    
    if any(k in q for k in ["how to report", "how do i report", "submit complaint", "file complaint", "report garbage", "new issue"]):
        reply = CIVIC_KNOWLEDGE["report_guide"]
        suggestions = ["What are the SLA resolution times?", "How does AI analyze images?", "Where can I see my complaints?"]
    elif any(k in q for k in ["status", "track", "pending", "in progress", "resolved"]):
        reply = CIVIC_KNOWLEDGE["status_help"]
        suggestions = ["How long does resolution take?", "How to report a new issue?", "Helpline numbers"]
    elif any(k in q for k in ["sla", "how long", "time", "timeline", "duration", "hours", "delay"]):
        reply = CIVIC_KNOWLEDGE["sla_timelines"]
        suggestions = ["How do I report an issue?", "What are emergency numbers?", "What is high severity?"]
    elif any(k in q for k in ["segregat", "waste", "dustbin", "green bin", "blue bin", "recycle"]):
        reply = CIVIC_KNOWLEDGE["segregation_rules"]
        suggestions = ["How to report overflowing bin?", "What happens to collected waste?", "Helpline directory"]
    elif any(k in q for k in ["contact", "helpline", "phone", "number", "emergency", "call"]):
        reply = CIVIC_KNOWLEDGE["emergency_contacts"]
        suggestions = ["Report issue now", "Track status", "SLA timelines"]
    elif any(k in q for k in ["ai", "model", "algorithm", "detect", "ml", "how it works"]):
        reply = (
            "🤖 **How SmartCivic AI Works:**\n"
            "Our integrated Computer Vision model inspects uploaded photos in real-time, detecting classes like *Garbage*, *Overflowing Bins*, *Potholes*, and *Water Leaks*. "
            "Our Severity Engine calculates an urgency score (0-100) based on location sensitivity (e.g. proximity to hospitals) and complaint clustering to prioritize rapid cleanup!"
        )
        suggestions = ["How to report an issue?", "What are the SLA resolution times?", "Waste segregation rules"]
    else:
        reply = (
            f"Hello! I am your **SmartCivic AI Assistant**. 🌟\n\n"
            f"I can assist you with:\n"
            f"• Reporting civic issues (garbage, potholes, water leakages)\n"
            f"• Tracking complaint statuses & SLA timelines\n"
            f"• Waste segregation & smart city best practices\n"
            f"• Reaching municipal sanitation authorities\n\n"
            f"*How can I assist your neighborhood today?*"
        )
        suggestions = ["How do I report garbage?", "What are the SLA timelines?", "Waste segregation rules", "Emergency helplines"]
        
    return {
        "reply": reply,
        "suggestions": suggestions
    }


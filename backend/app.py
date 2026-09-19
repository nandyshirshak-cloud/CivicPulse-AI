from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import re

app = Flask(__name__)
CORS(app)

DB_NAME = "civicpulse.db"


# =========================================================
# DATABASE
# =========================================================

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            location TEXT,
            language TEXT,
            category TEXT,
            description TEXT,
            ai_category TEXT,
            urgency TEXT,
            priority TEXT
        )
    """)

    conn.commit()
    conn.close()


# =========================================================
# MULTILINGUAL KEYWORDS
# =========================================================

KEYWORDS = {

    "Road Infrastructure": [

        # English
        "road", "roads", "pothole", "potholes",
        "highway", "street", "bridge",

        # Bengali
        "রাস্তা", "সড়ক", "সড়ক", "গর্ত", "ব্রিজ",
        "সেতু", "হাইওয়ে", "হাইওয়ে",

        # Hindi
        "सड़क", "सड़क", "रास्ता", "गड्ढा",
        "पुल", "हाईवे"
    ],

    "Healthcare": [

        # English
        "hospital", "health", "healthcare", "doctor",
        "medicine", "clinic", "ambulance",

        # Bengali
        "হাসপাতাল", "স্বাস্থ্য", "ডাক্তার",
        "ওষুধ", "ক্লিনিক", "অ্যাম্বুলেন্স",

        # Hindi
        "अस्पताल", "स्वास्थ्य", "डॉक्टर",
        "दवा", "क्लिनिक", "एम्बुलेंस"
    ],

    "Education": [

        # English
        "school", "college", "education", "teacher",
        "student", "classroom", "university",

        # Bengali
        "স্কুল", "বিদ্যালয়", "কলেজ", "শিক্ষা",
        "শিক্ষক", "ছাত্র", "বিশ্ববিদ্যালয়",

        # Hindi
        "स्कूल", "विद्यालय", "कॉलेज", "शिक्षा",
        "शिक्षक", "छात्र", "विश्वविद्यालय"
    ],

    "Water": [

        # English
        "water", "drinking water", "pipeline",
        "tap", "water supply",

        # Bengali
        "জল", "পানি", "পানীয় জল", "পাইপ",
        "কল", "জল সরবরাহ",

        # Hindi
        "पानी", "जल", "पीने का पानी",
        "पाइप", "नल", "जल आपूर्ति"
    ],

    "Electricity": [

        # English
        "electricity", "power", "electric",
        "transformer", "current", "electric pole",

        # Bengali
        "বিদ্যুৎ", "কারেন্ট", "ট্রান্সফরমার",
        "বিদ্যুতের খুঁটি",

        # Hindi
        "बिजली", "करंट", "ट्रांसफार्मर",
        "बिजली का खंभा"
    ],

    "Internet": [

        # English
        "internet", "wifi", "wi-fi", "network",
        "mobile network", "broadband",

        # Bengali
        "ইন্টারনেট", "ওয়াইফাই", "ওয়াইফাই",
        "নেটওয়ার্ক", "ব্রডব্যান্ড",

        # Hindi
        "इंटरनेट", "वाईफाई", "नेटवर्क",
        "ब्रॉडबैंड"
    ],

    "Sanitation": [

        # English
        "sanitation", "toilet", "sewage",
        "drain", "garbage", "waste", "sewer",

        # Bengali
        "স্যানিটেশন", "শৌচাগার", "পয়ঃনিষ্কাশন",
        "নর্দমা", "আবর্জনা", "বর্জ্য",

        # Hindi
        "स्वच्छता", "शौचालय", "सीवेज",
        "नाली", "कचरा", "अपशिष्ट"
    ],

    "Transport": [

        # English
        "bus", "transport", "train", "railway",
        "public transport", "vehicle",

        # Bengali
        "বাস", "পরিবহন", "ট্রেন", "রেল",
        "গণপরিবহন", "গাড়ি",

        # Hindi
        "बस", "परिवहन", "ट्रेन", "रेलवे",
        "सार्वजनिक परिवहन", "वाहन"
    ]
}


# =========================================================
# URGENCY KEYWORDS
# =========================================================

HIGH_URGENCY = [

    # English
    "emergency", "urgent", "critical", "immediately",
    "danger", "dangerous", "accident",
    "life threatening", "life-threatening",

    # Bengali
    "জরুরি", "বিপজ্জনক", "বিপদ",
    "দুর্ঘটনা", "তাৎক্ষণিক",

    # Hindi
    "आपातकाल", "आपातकालीन", "जरूरी",
    "खतरनाक", "खतरा", "दुर्घटना",
    "तुरंत"
]

MEDIUM_URGENCY = [

    # English
    "soon", "important", "problem",
    "bad", "difficult", "need",

    # Bengali
    "সমস্যা", "খারাপ", "গুরুত্বপূর্ণ",
    "প্রয়োজন", "প্রয়োজন",

    # Hindi
    "समस्या", "खराब", "महत्वपूर्ण",
    "जरूरत", "आवश्यकता"
]


# =========================================================
# AI ANALYSIS
# =========================================================

def analyze_request(description, category=""):

    text = (description or "").lower()
    selected_category = (category or "").lower()

    detected_category = "General Development"

    # Check every category
    for category_name, keywords in KEYWORDS.items():

        for keyword in keywords:

            if keyword.lower() in text:
                detected_category = category_name
                break

        if detected_category != "General Development":
            break

    # If AI could not detect category, use user's selected category
    if detected_category == "General Development":

        category_mapping = {
            "road": "Road Infrastructure",
            "healthcare": "Healthcare",
            "education": "Education",
            "water": "Water",
            "electricity": "Electricity",
            "internet": "Internet",
            "sanitation": "Sanitation",
            "transport": "Transport"
        }

        detected_category = category_mapping.get(
            selected_category,
            "General Development"
        )

    # Urgency
    urgency = "LOW"

    for keyword in HIGH_URGENCY:

        if keyword.lower() in text:
            urgency = "HIGH"
            break

    if urgency != "HIGH":

        for keyword in MEDIUM_URGENCY:

            if keyword.lower() in text:
                urgency = "MEDIUM"
                break

    return detected_category, urgency


# =========================================================
# RECOMMENDATION ENGINE
# =========================================================

def generate_recommendation(
    category,
    request_count,
    priority
):

    recommendations = {

        "Road Infrastructure":
            (
                "Road repair and infrastructure improvement",
                "Citizen demand indicates a need for better road infrastructure."
            ),

        "Healthcare":
            (
                "Healthcare facility and medical service improvement",
                "Citizen feedback indicates healthcare service gaps."
            ),

        "Education":
            (
                "School and education infrastructure improvement",
                "Citizen requests indicate education infrastructure needs."
            ),

        "Water":
            (
                "Drinking water supply improvement",
                "Citizen feedback indicates water supply requirements."
            ),

        "Electricity":
            (
                "Electricity infrastructure improvement",
                "Citizen requests indicate electricity service problems."
            ),

        "Internet":
            (
                "Internet and digital connectivity expansion",
                "Citizen feedback indicates digital connectivity gaps."
            ),

        "Sanitation":
            (
                "Sanitation and waste management improvement",
                "Citizen requests indicate sanitation requirements."
            ),

        "Transport":
            (
                "Public transport improvement",
                "Citizen feedback indicates transportation needs."
            ),

        "General Development":
            (
                "Local development assessment",
                "Citizen feedback requires further assessment."
            )
    }

    recommendation, reason = recommendations.get(
        category,
        recommendations["General Development"]
    )

    reason = (
        f"{request_count} citizen request(s) indicate "
        f"a development need related to {category.lower()} "
        f"in this location."
    )

    return recommendation, reason


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return "CivicPulse AI Backend Running"


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health")
def health():

    return jsonify({
        "status": "healthy",
        "service": "CivicPulse AI"
    })


# =========================================================
# CREATE CITIZEN REQUEST
# =========================================================

@app.route("/api/requests", methods=["POST"])
def create_request():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data received"
        }), 400

    name = data.get(
        "name",
        "Anonymous Citizen"
    )

    location = data.get(
        "location",
        ""
    )

    language = data.get(
        "language",
        "English"
    )

    category = data.get(
        "category",
        "General"
    )

    description = data.get(
        "description",
        ""
    )

    if not location or not description:

        return jsonify({
            "error": "Location and description are required"
        }), 400

    # AI analysis
    ai_category, urgency = analyze_request(
        description,
        category
    )

    priority = urgency

    conn = get_db()

    cursor = conn.execute(
        """
        INSERT INTO requests
        (
            name,
            location,
            language,
            category,
            description,
            ai_category,
            urgency,
            priority
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            location,
            language,
            category,
            description,
            ai_category,
            urgency,
            priority
        )
    )

    conn.commit()

    request_id = cursor.lastrowid

    conn.close()

    return jsonify({

        "message": "Citizen request submitted successfully",

        "id": request_id,

        "ai_category": ai_category,

        "urgency": urgency,

        "priority": priority,

        "language": language

    }), 201


# =========================================================
# GET ALL REQUESTS
# =========================================================

@app.route("/api/requests", methods=["GET"])
def get_requests():

    conn = get_db()

    rows = conn.execute(
        """
        SELECT *
        FROM requests
        ORDER BY id DESC
        """
    ).fetchall()

    conn.close()

    return jsonify([
        dict(row)
        for row in rows
    ])


# =========================================================
# HOTSPOTS
# =========================================================

@app.route("/api/hotspots", methods=["GET"])
def get_hotspots():

    conn = get_db()

    rows = conn.execute(
        """
        SELECT
            location,
            COUNT(*) AS request_count,
            MAX(
                CASE
                    WHEN priority = 'HIGH' THEN 3
                    WHEN priority = 'MEDIUM' THEN 2
                    ELSE 1
                END
            ) AS priority_score
        FROM requests
        GROUP BY location
        ORDER BY request_count DESC
        """
    ).fetchall()

    conn.close()

    hotspots = []

    for row in rows:

        count = row["request_count"]

        if count >= 5:
            level = "HIGH"

        elif count >= 3:
            level = "MEDIUM"

        else:
            level = "LOW"

        hotspots.append({

            "location": row["location"],

            "request_count": count,

            "hotspot_level": level

        })

    return jsonify(hotspots)


# =========================================================
# AI RECOMMENDATIONS
# =========================================================

@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():

    conn = get_db()

    rows = conn.execute(
        """
        SELECT
            location,
            ai_category,
            COUNT(*) AS request_count,

            SUM(
                CASE
                    WHEN priority = 'HIGH'
                    THEN 1
                    ELSE 0
                END
            ) AS high_priority_requests,

            SUM(
                CASE
                    WHEN priority = 'MEDIUM'
                    THEN 1
                    ELSE 0
                END
            ) AS medium_priority_requests

        FROM requests

        GROUP BY location, ai_category

        ORDER BY request_count DESC
        """
    ).fetchall()

    conn.close()

    recommendations = []

    for row in rows:

        request_count = row["request_count"]

        high_priority = row["high_priority_requests"] or 0

        medium_priority = row["medium_priority_requests"] or 0

        if high_priority > 0:
            priority = "HIGH"

        elif medium_priority > 0:
            priority = "MEDIUM"

        else:
            priority = "LOW"

        recommendation, reason = generate_recommendation(
            row["ai_category"],
            request_count,
            priority
        )

        recommendations.append({

            "location": row["location"],

            "category": row["ai_category"],

            "request_count": request_count,

            "high_priority_requests": high_priority,

            "medium_priority_requests": medium_priority,

            "priority": priority,

            "recommendation": recommendation,

            "reason": reason

        })

    return jsonify(recommendations)


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    init_db()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
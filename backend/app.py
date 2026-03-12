import math
import random
import uuid

import numpy as np
from faker import Faker
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier

fake = Faker()

# --- Constants ---
INDUSTRIES = [
    "SaaS", "Fintech", "HealthTech", "EdTech", "E-Commerce",
    "AI/ML", "CleanTech", "Cybersecurity", "FoodTech", "PropTech",
    "DeepTech", "Logistics", "Social Media", "Gaming", "BioTech",
]

COUNTRIES = [
    "USA", "India", "UK", "Germany", "Canada",
    "Israel", "France", "China", "Brazil", "Singapore", "Other",
]

FUNDING_TYPES = [
    "Pre-Seed", "Seed", "Series A", "Series B", "Series C",
    "Series D+", "Grant", "Convertible Note", "Crowdfunding",
]

REVENUE_STAGES = [
    "Pre-Revenue", "Early Revenue", "$1M-$10M ARR",
    "$10M-$50M ARR", "$50M+ ARR",
]

COMPETITION_LEVELS = ["Low", "Medium", "High", "Saturated"]

TECH_SECTORS = ["AI/ML", "DeepTech", "BioTech", "Cybersecurity", "HealthTech"]

COUNTRY_WEIGHTS = [
    ("USA", 40), ("India", 10), ("UK", 8), ("Germany", 6),
    ("Canada", 5), ("Israel", 5), ("France", 3), ("China", 3),
    ("Brazil", 3), ("Singapore", 2), ("Other", 15),
]


# --- Startup Engine ---
class StartupEngine:
    def __init__(self):
        self.dataset = []
        self.model = None
        self.is_ready = False
        self.stats = None
        self._init()

    def _init(self):
        self._generate_dataset(1000)
        self._train_model()
        self._calculate_stats()
        self.is_ready = True
        print("StartupEngine: Ready with 1000 samples")

    def _weighted_choice(self, items_weights):
        items = [i[0] for i in items_weights]
        weights = [i[1] for i in items_weights]
        return random.choices(items, weights=weights, k=1)[0]

    def _generate_dataset(self, count):
        from datetime import datetime
        current_year = datetime.now().year

        for _ in range(count):
            founded_year = random.randint(2005, 2023)
            age = current_year - founded_year
            industry = random.choice(INDUSTRIES)
            country = self._weighted_choice(COUNTRY_WEIGHTS)

            total_funding_usd = math.exp(random.uniform(9, 20))
            funding_rounds = min(10, int(math.log10(max(total_funding_usd / 10000, 1)) * 2))
            last_funding_type = random.choice(FUNDING_TYPES)
            team_size = int((total_funding_usd / 100000) * random.uniform(0.5, 2))
            founder_count = random.randint(1, 5)
            has_technical_cofounder = random.choice([True, False])
            years_since_last_funding = random.uniform(0, min(age, 8))
            revenue_stage = random.choice(REVENUE_STAGES)
            has_pivot = random.choice([True, False])
            market_competition_level = random.choice(COMPETITION_LEVELS)

            # Failure logic (matching TypeScript version)
            failure_score = 0.45

            if total_funding_usd < 300000:
                failure_score += 0.25
            elif total_funding_usd > 5000000:
                failure_score -= 0.15

            if revenue_stage == "Pre-Revenue" and age > 2:
                failure_score += 0.15
            if revenue_stage in ("$10M-$50M ARR", "$50M+ ARR"):
                failure_score -= 0.35

            if market_competition_level == "Saturated":
                failure_score += 0.12
            if market_competition_level == "Low":
                failure_score -= 0.08

            if not has_technical_cofounder and industry in TECH_SECTORS:
                failure_score += 0.18
            if has_technical_cofounder and industry in TECH_SECTORS:
                failure_score -= 0.1

            if years_since_last_funding > 2.5:
                failure_score += 0.22
            if founder_count == 1:
                failure_score += 0.08
            if founder_count >= 3:
                failure_score -= 0.05

            burn_risk = team_size > 30 and total_funding_usd < 1000000
            if burn_risk:
                failure_score += 0.25

            if has_pivot and age > 2:
                failure_score -= 0.07

            failed = random.random() < max(0.02, min(0.98, failure_score))

            self.dataset.append({
                "id": str(uuid.uuid4()),
                "company_name": fake.company(),
                "industry": industry,
                "founded_year": founded_year,
                "country": country,
                "total_funding_usd": total_funding_usd,
                "funding_rounds": funding_rounds,
                "last_funding_type": last_funding_type,
                "team_size": team_size,
                "founder_count": founder_count,
                "has_technical_cofounder": has_technical_cofounder,
                "years_since_last_funding": years_since_last_funding,
                "revenue_stage": revenue_stage,
                "has_pivot": has_pivot,
                "market_competition_level": market_competition_level,
                "failed": failed,
                "age": age,
            })

    def _calculate_stats(self):
        by_industry = []
        for ind in INDUSTRIES:
            industry_startups = [s for s in self.dataset if s["industry"] == ind]
            failed_count = sum(1 for s in industry_startups if s["failed"])
            failure_rate = (
                round((failed_count / len(industry_startups)) * 100)
                if industry_startups else 0
            )
            by_industry.append({"industry": ind, "failure_rate": failure_rate})

        failed_startups = [s for s in self.dataset if s["failed"]]
        survived_startups = [s for s in self.dataset if not s["failed"]]

        avg_funding_failed = (
            round(sum(s["total_funding_usd"] for s in failed_startups) / len(failed_startups))
            if failed_startups else 0
        )
        avg_funding_survived = (
            round(sum(s["total_funding_usd"] for s in survived_startups) / len(survived_startups))
            if survived_startups else 0
        )

        self.stats = {
            "by_industry": by_industry,
            "avg_funding": {
                "failed": avg_funding_failed,
                "survived": avg_funding_survived,
            },
        }

    def _prepare_features(self, s):
        return [
            INDUSTRIES.index(s.get("industry", "")) if s.get("industry", "") in INDUSTRIES else -1,
            s.get("founded_year", 2020),
            COUNTRIES.index(s.get("country", "")) if s.get("country", "") in COUNTRIES else -1,
            s.get("total_funding_usd", 0),
            s.get("funding_rounds", 0),
            FUNDING_TYPES.index(s.get("last_funding_type", "")) if s.get("last_funding_type", "") in FUNDING_TYPES else -1,
            s.get("team_size", 0),
            s.get("founder_count", 1),
            1 if s.get("has_technical_cofounder") else 0,
            s.get("years_since_last_funding", 0),
            REVENUE_STAGES.index(s.get("revenue_stage", "")) if s.get("revenue_stage", "") in REVENUE_STAGES else -1,
            1 if s.get("has_pivot") else 0,
            COMPETITION_LEVELS.index(s.get("market_competition_level", "")) if s.get("market_competition_level", "") in COMPETITION_LEVELS else -1,
        ]

    def _train_model(self):
        X = np.array([self._prepare_features(s) for s in self.dataset])
        y = np.array([1 if s["failed"] else 0 for s in self.dataset])

        self.model = RandomForestClassifier(n_estimators=20, random_state=42)
        self.model.fit(X, y)

    def predict(self, input_data):
        if self.model is None:
            return 0.5
        features = np.array([self._prepare_features(input_data)])
        prob = self.model.predict_proba(features)
        # prob[0][1] = probability of failure (class 1)
        return float(prob[0][1])

    def get_survival_curve(self, input_data):
        base_prob = 1 - self.predict(input_data)
        curve = []
        for month in range(0, 121, 6):
            decay = 0.98 ** (month / 12)
            survival_prob = max(0, base_prob * decay)
            curve.append({
                "month": month,
                "survival_prob": round(survival_prob * 100) / 100,
            })
        return curve


# --- Flask App ---
def create_app():
    app = Flask(__name__)
    CORS(
        app,
        origins=[
            "https://survival-ai.vercel.app",
            "http://localhost:5173",
            "http://localhost:4173",
        ],
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=False,
    )

    engine = StartupEngine()

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "alive",
            "dataset_size": len(engine.dataset),
            "industries": INDUSTRIES,
            "countries": COUNTRIES,
        })

    @app.route("/api/predict", methods=["POST"])
    def predict():
        if not engine.is_ready:
            return jsonify({"error": "Engine is still warming up. Please try again in a few seconds."}), 503

        input_data = request.get_json()
        failure_prob = engine.predict(input_data) * 100
        survival_curve = engine.get_survival_curve(input_data)

        # Risk Grade
        if failure_prob < 20:
            grade = "A"
        elif failure_prob < 40:
            grade = "B"
        elif failure_prob < 60:
            grade = "C"
        elif failure_prob < 80:
            grade = "D"
        else:
            grade = "F"

        # Risk Factors
        risk_factors = []
        if input_data.get("total_funding_usd", 0) < 500000:
            risk_factors.append({
                "factor": "Low Capitalization",
                "impact": "High risk of running out of runway before product-market fit.",
                "severity": "high",
            })
        if input_data.get("years_since_last_funding", 0) > 2:
            risk_factors.append({
                "factor": "Funding Stagnation",
                "impact": "Long gap since last round suggests difficulty in hitting milestones.",
                "severity": "medium",
            })
        if not input_data.get("has_technical_cofounder"):
            risk_factors.append({
                "factor": "Technical Gap",
                "impact": "Lack of in-house technical leadership can slow development.",
                "severity": "medium",
            })
        if input_data.get("market_competition_level") == "Saturated":
            risk_factors.append({
                "factor": "Market Saturation",
                "impact": "Intense competition makes customer acquisition expensive.",
                "severity": "high",
            })

        # Similar Startups
        similar = [
            {
                "name": s["company_name"],
                "industry": s["industry"],
                "funding": s["total_funding_usd"],
                "status": "Failed" if s["failed"] else "Survived",
            }
            for s in engine.dataset
            if s["industry"] == input_data.get("industry")
        ][:3]

        survival_1yr_entry = next((c for c in survival_curve if c["month"] == 12), None)
        survival_3yr_entry = next((c for c in survival_curve if c["month"] == 36), None)
        survival_5yr_entry = next((c for c in survival_curve if c["month"] == 60), None)

        return jsonify({
            "success_probability": round(100 - failure_prob),
            "risk_grade": grade,
            "risk_factors": risk_factors,
            "survival_curve": survival_curve,
            "median_survival_months": round(60 * (1 - failure_prob / 100)),
            "survival_1yr": round(survival_1yr_entry["survival_prob"] * 100) if survival_1yr_entry else 0,
            "survival_3yr": round(survival_3yr_entry["survival_prob"] * 100) if survival_3yr_entry else 0,
            "survival_5yr": round(survival_5yr_entry["survival_prob"] * 100) if survival_5yr_entry else 0,
            "similar_startups": similar,
            "recommendation": (
                "Focus on extending runway and validating unit economics to strengthen your foundation."
                if failure_prob > 60
                else "Excellent fundamentals! You're on a great trajectory for scaling and market leadership."
            ),
        })

    @app.route("/api/dataset/stats", methods=["GET"])
    def dataset_stats():
        if not engine.is_ready or engine.stats is None:
            return jsonify({"error": "Engine is still warming up."}), 503
        return jsonify(engine.stats)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)

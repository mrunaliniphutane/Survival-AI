import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from 'url';
import { faker } from "@faker-js/faker";
import { RandomForestClassifier } from "ml-random-forest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Types & Constants ---
const INDUSTRIES = ["SaaS", "Fintech", "HealthTech", "EdTech", "E-Commerce", "AI/ML", "CleanTech", "Cybersecurity", "FoodTech", "PropTech", "DeepTech", "Logistics", "Social Media", "Gaming", "BioTech"];
const COUNTRIES = ["USA", "India", "UK", "Germany", "Canada", "Israel", "France", "China", "Brazil", "Singapore", "Other"];
const FUNDING_TYPES = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "Grant", "Convertible Note", "Crowdfunding"];
const REVENUE_STAGES = ["Pre-Revenue", "Early Revenue", "$1M-$10M ARR", "$10M-$50M ARR", "$50M+ ARR"];
const COMPETITION_LEVELS = ["Low", "Medium", "High", "Saturated"];

interface Startup {
  id: string;
  company_name: string;
  industry: string;
  founded_year: number;
  country: string;
  total_funding_usd: number;
  funding_rounds: number;
  last_funding_type: string;
  team_size: number;
  founder_count: number;
  has_technical_cofounder: boolean;
  years_since_last_funding: number;
  revenue_stage: string;
  has_pivot: boolean;
  market_competition_level: string;
  failed: boolean;
  age: number; // years since founding
}

// --- Data Generation & ML Engine ---
class StartupEngine {
  dataset: Startup[] = [];
  model: RandomForestClassifier | null = null;
  isReady = false;
  stats: any = null;
  
  constructor() {
    // Start initialization in background
    this.init();
  }

  async init() {
    console.time("StartupEngine:Init");
    this.generateDataset(1000); // Further reduced for instant startup
    this.trainModel();
    this.calculateStats();
    this.isReady = true;
    console.timeEnd("StartupEngine:Init");
    console.log("StartupEngine: Ready with 1000 samples");
  }

  calculateStats() {
    this.stats = {
      by_industry: INDUSTRIES.map(ind => {
        const industryStartups = this.dataset.filter(s => s.industry === ind);
        const failedCount = industryStartups.filter(s => s.failed).length;
        return {
          industry: ind,
          failure_rate: industryStartups.length > 0 ? Math.round((failedCount / industryStartups.length) * 100) : 0
        };
      }),
      avg_funding: {
        failed: Math.round(this.dataset.filter(s => s.failed).reduce((acc, s) => acc + s.total_funding_usd, 0) / (this.dataset.filter(s => s.failed).length || 1)),
        survived: Math.round(this.dataset.filter(s => !s.failed).reduce((acc, s) => acc + s.total_funding_usd, 0) / (this.dataset.filter(s => !s.failed).length || 1))
      }
    };
  }

  generateDataset(count: number) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < count; i++) {
      const founded_year = faker.number.int({ min: 2005, max: 2023 });
      const age = currentYear - founded_year;
      const industry = faker.helpers.arrayElement(INDUSTRIES);
      const country = faker.helpers.weightedArrayElement([
        { weight: 40, value: "USA" },
        { weight: 10, value: "India" },
        { weight: 8, value: "UK" },
        { weight: 6, value: "Germany" },
        { weight: 5, value: "Canada" },
        { weight: 5, value: "Israel" },
        { weight: 3, value: "France" },
        { weight: 3, value: "China" },
        { weight: 3, value: "Brazil" },
        { weight: 2, value: "Singapore" },
        { weight: 15, value: "Other" }
      ]);

      const total_funding_usd = Math.exp(faker.number.float({ min: 9, max: 20 })); // Log-normal-ish
      const funding_rounds = Math.min(10, Math.floor(Math.log10(total_funding_usd / 10000) * 2));
      const last_funding_type = faker.helpers.arrayElement(FUNDING_TYPES);
      const team_size = Math.floor((total_funding_usd / 100000) * faker.number.float({ min: 0.5, max: 2 }));
      const founder_count = faker.number.int({ min: 1, max: 5 });
      const has_technical_cofounder = faker.datatype.boolean();
      const years_since_last_funding = faker.number.float({ min: 0, max: Math.min(age, 8) });
      const revenue_stage = faker.helpers.arrayElement(REVENUE_STAGES);
      const has_pivot = faker.datatype.boolean();
      const market_competition_level = faker.helpers.arrayElement(COMPETITION_LEVELS);

      // Refined Failure Logic (Fine-tuned)
      let failureScore = 0.45; // Base 45%
      
      // Funding impact
      if (total_funding_usd < 300000) failureScore += 0.25;
      else if (total_funding_usd > 5000000) failureScore -= 0.15;

      // Product-Market Fit indicators
      if (revenue_stage === "Pre-Revenue" && age > 2) failureScore += 0.15;
      if (revenue_stage === "$10M-$50M ARR" || revenue_stage === "$50M+ ARR") failureScore -= 0.35;

      // Market context
      if (market_competition_level === "Saturated") failureScore += 0.12;
      if (market_competition_level === "Low") failureScore -= 0.08;

      // Team & Sector synergy
      const techSectors = ["AI/ML", "DeepTech", "BioTech", "Cybersecurity", "HealthTech"];
      if (!has_technical_cofounder && techSectors.includes(industry)) failureScore += 0.18;
      if (has_technical_cofounder && techSectors.includes(industry)) failureScore -= 0.1;

      // Operational risks
      if (years_since_last_funding > 2.5) failureScore += 0.22;
      if (founder_count === 1) failureScore += 0.08;
      if (founder_count >= 3) failureScore -= 0.05; // Co-founder stability

      // Burn rate heuristic
      const burnRisk = team_size > 30 && total_funding_usd < 1000000;
      if (burnRisk) failureScore += 0.25;

      // Pivot resilience
      if (has_pivot && age > 2) failureScore -= 0.07; // Successful pivot indicator

      const failed = Math.random() < Math.max(0.02, Math.min(0.98, failureScore));

      this.dataset.push({
        id: faker.string.uuid(),
        company_name: faker.company.name(),
        industry,
        founded_year,
        country,
        total_funding_usd,
        funding_rounds,
        last_funding_type,
        team_size,
        founder_count,
        has_technical_cofounder,
        years_since_last_funding,
        revenue_stage,
        has_pivot,
        market_competition_level,
        failed,
        age
      });
    }
  }

  prepareFeatures(s: Partial<Startup>) {
    return [
      INDUSTRIES.indexOf(s.industry || ""),
      s.founded_year || 2020,
      COUNTRIES.indexOf(s.country || ""),
      s.total_funding_usd || 0,
      s.funding_rounds || 0,
      FUNDING_TYPES.indexOf(s.last_funding_type || ""),
      s.team_size || 0,
      s.founder_count || 1,
      s.has_technical_cofounder ? 1 : 0,
      s.years_since_last_funding || 0,
      REVENUE_STAGES.indexOf(s.revenue_stage || ""),
      s.has_pivot ? 1 : 0,
      COMPETITION_LEVELS.indexOf(s.market_competition_level || "")
    ];
  }

  trainModel() {
    const X = this.dataset.map(s => this.prepareFeatures(s));
    const y = this.dataset.map(s => s.failed ? 1 : 0);
    
    this.model = new RandomForestClassifier({
      nEstimators: 20, // Reduced for faster prediction
      seed: 42
    });
    this.model.train(X, y);
  }

  predict(input: Partial<Startup>): number {
    if (!this.model) return 0.5;
    const features = this.prepareFeatures(input);
    const prob = (this.model as any).predictProbability([features]); // Returns [[prob_0, prob_1]]
    return prob[0][1];
  }

  getSurvivalCurve(input: Partial<Startup>) {
    // Simple Cox-inspired heuristic for survival curve
    // In a real app, we'd use a proper Kaplan-Meier or Cox PH model
    const baseProb = 1 - this.predict(input);
    const curve = [];
    for (let month = 0; month <= 120; month += 6) {
      // Decay over time
      const decay = Math.pow(0.98, month / 12); // 2% annual organic decay
      const survival_prob = Math.max(0, baseProb * decay);
      curve.push({ month, survival_prob: Math.round(survival_prob * 100) / 100 });
    }
    return curve;
  }
}

const engine = new StartupEngine();

// --- Server ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "alive", 
      dataset_size: engine.dataset.length,
      industries: INDUSTRIES,
      countries: COUNTRIES
    });
  });

  app.post("/api/predict", (req, res) => {
    if (!engine.isReady) {
      return res.status(503).json({ error: "Engine is still warming up. Please try again in a few seconds." });
    }
    const input = req.body;
    const failureProb = engine.predict(input) * 100;
    const survivalCurve = engine.getSurvivalCurve(input);
    
    // Risk Grade
    let grade = "C";
    if (failureProb < 20) grade = "A";
    else if (failureProb < 40) grade = "B";
    else if (failureProb < 60) grade = "C";
    else if (failureProb < 80) grade = "D";
    else grade = "F";

    // Risk Factors
    const risk_factors = [];
    if (input.total_funding_usd < 500000) risk_factors.push({ factor: "Low Capitalization", impact: "High risk of running out of runway before product-market fit.", severity: "high" });
    if (input.years_since_last_funding > 2) risk_factors.push({ factor: "Funding Stagnation", impact: "Long gap since last round suggests difficulty in hitting milestones.", severity: "medium" });
    if (!input.has_technical_cofounder) risk_factors.push({ factor: "Technical Gap", impact: "Lack of in-house technical leadership can slow development.", severity: "medium" });
    if (input.market_competition_level === "Saturated") risk_factors.push({ factor: "Market Saturation", impact: "Intense competition makes customer acquisition expensive.", severity: "high" });

    // Similar Startups
    const similar = engine.dataset
      .filter(s => s.industry === input.industry)
      .slice(0, 3)
      .map(s => ({ name: s.company_name, industry: s.industry, funding: s.total_funding_usd, status: s.failed ? "Failed" : "Survived" }));

    res.json({
      success_probability: Math.round(100 - failureProb),
      risk_grade: grade,
      risk_factors,
      survival_curve: survivalCurve,
      median_survival_months: Math.round(60 * (1 - failureProb/100)), // Crude estimate
      survival_1yr: Math.round(survivalCurve.find(c => c.month === 12)?.survival_prob * 100 || 0),
      survival_3yr: Math.round(survivalCurve.find(c => c.month === 36)?.survival_prob * 100 || 0),
      survival_5yr: Math.round(survivalCurve.find(c => c.month === 60)?.survival_prob * 100 || 0),
      similar_startups: similar,
      recommendation: failureProb > 60 ? "Focus on extending runway and validating unit economics to strengthen your foundation." : "Excellent fundamentals! You're on a great trajectory for scaling and market leadership."
    });
  });

  app.get("/api/dataset/stats", (req, res) => {
    if (!engine.isReady || !engine.stats) {
      return res.status(503).json({ error: "Engine is still warming up." });
    }
    res.json(engine.stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

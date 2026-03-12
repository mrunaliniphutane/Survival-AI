import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, TrendingUp, ChevronRight, RefreshCcw, Share2, Info, CheckCircle2, XCircle } from 'lucide-react';
import { cn, formatCurrency } from './lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- API Client ---
const API_BASE = "/api";

async function predictStartup(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (res.status === 503) {
    const error = await res.json();
    throw new Error(error.error);
  }
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}

async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

// --- Types ---
interface RiskFactor {
  factor: string;
  impact: string;
  severity: string;
}

interface SimilarStartup {
  name: string;
  industry: string;
  funding: number;
  status: string;
}

interface SurvivalCurvePoint {
  month: number;
  survival_prob: number;
}

interface PredictionResults {
  success_probability: number;
  risk_grade: string;
  risk_factors: RiskFactor[];
  survival_curve: SurvivalCurvePoint[];
  median_survival_months: number;
  survival_1yr: number;
  survival_3yr: number;
  survival_5yr: number;
  similar_startups: SimilarStartup[];
  recommendation: string;
}

// --- Components ---
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border-subtle">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-accent rounded-lg flex items-center justify-center">
          <TrendingUp className="text-background w-5 h-5" />
        </div>
        <span className="font-mono font-bold text-xl tracking-tighter">SURVIVAL<span className="text-primary-accent">.AI</span></span>
      </div>
      <div className="flex gap-8 text-sm font-medium text-muted-foreground">
        <a href="#hero" className="hover:text-primary-accent transition-colors">Home</a>
        <a href="#predict" className="hover:text-primary-accent transition-colors">Predict</a>
      </div>
    </div>
  </nav>
);

const Hero = ({ onStart }: { onStart: () => void }) => (
  <section id="hero" className="pt-32 pb-20 px-6">
    <div className="max-w-7xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          Chart Your Path to <br /> <span className="text-primary-accent">Success</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          AI-powered insights to help you build a resilient and thriving business. 
          Analyze your growth potential with data-driven machine learning.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <button onClick={onStart} className="btn-primary flex items-center gap-2">
            Start Your Success Journey <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
        {[
          { label: "Startups Thrive", value: "40%", icon: CheckCircle2, color: "text-primary-accent" },
          { label: "Avg Longevity", value: "3.2 Years", icon: BarChart3, color: "text-primary-accent" },
          { label: "Data-Backed Insights", value: "5,000+", icon: TrendingUp, color: "text-blue-400" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="glass-card p-8 text-center"
          >
            <stat.icon className={cn("w-8 h-8 mx-auto mb-4", stat.color)} />
            <div className="text-4xl font-mono font-bold mb-1">{stat.value}</div>
            <div className="text-gray-500 text-sm uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const PitchForm = ({ onSubmit, isLoading }: { onSubmit: (data: Record<string, unknown>) => void, isLoading: boolean }) => {
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "SaaS",
    country: "USA",
    founded_year: 2023,
    total_funding_usd: 1000000,
    funding_rounds: 1,
    last_funding_type: "Seed",
    years_since_last_funding: 0.5,
    team_size: 5,
    founder_count: 2,
    has_technical_cofounder: true,
    revenue_stage: "Early Revenue",
    has_pivot: false,
    market_competition_level: "Medium"
  });

  const [industries, setIndustries] = useState<string[]>(["SaaS", "Fintech", "HealthTech", "EdTech", "E-Commerce", "AI/ML", "CleanTech", "Cybersecurity", "FoodTech", "PropTech", "DeepTech", "Logistics", "Social Media", "Gaming", "BioTech"]);
  const [countries, setCountries] = useState<string[]>(["USA", "India", "UK", "Germany", "Canada", "Israel", "France", "China", "Brazil", "Singapore", "Other"]);

  useEffect(() => {
    getHealth().then(data => {
      if (data.industries) setIndustries(data.industries);
      if (data.countries) setCountries(data.countries);
    }).catch(err => {
      console.error("Failed to fetch health data, using fallbacks", err);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const randomize = () => {
    setFormData({
      ...formData,
      company_name: "Random Startup " + Math.floor(Math.random() * 1000),
      industry: industries[Math.floor(Math.random() * industries.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      total_funding_usd: Math.floor(Math.random() * 10000000),
      team_size: Math.floor(Math.random() * 50) + 1,
      founder_count: Math.floor(Math.random() * 4) + 1,
      has_technical_cofounder: Math.random() > 0.3,
      market_competition_level: ["Low", "Medium", "High", "Saturated"][Math.floor(Math.random() * 4)]
    });
  };

  return (
    <section id="predict" className="py-20 px-6 bg-surface/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Pitch Your Startup</h2>
          <p className="text-gray-400">Fill in your details to get a survival analysis report.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section 1: Basics */}
            <div className="space-y-6">
              <h3 className="text-sm font-mono text-primary-accent uppercase tracking-widest">01. Basics</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full bg-background border border-border-subtle rounded-lg px-4 py-2 focus:border-primary-accent outline-none transition-all"
                    placeholder="e.g. Acme AI"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={e => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full bg-background border border-border-subtle rounded-lg px-4 py-2 outline-none"
                    >
                      {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                    <select
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-background border border-border-subtle rounded-lg px-4 py-2 outline-none"
                    >
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Funding */}
            <div className="space-y-6">
              <h3 className="text-sm font-mono text-primary-accent uppercase tracking-widest">02. Funding</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Total Funding (INR)</label>
                  <input
                    type="number"
                    value={formData.total_funding_usd}
                    onChange={e => setFormData({ ...formData, total_funding_usd: parseInt(e.target.value) })}
                    className="w-full bg-background border border-border-subtle rounded-lg px-4 py-2 outline-none"
                  />
                  <div className="text-xs text-primary-accent mt-1">{formatCurrency(formData.total_funding_usd)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Rounds</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.funding_rounds}
                      onChange={e => setFormData({ ...formData, funding_rounds: parseInt(e.target.value) })}
                      className="w-full bg-background border border-border-subtle rounded-lg px-4 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Years Since Last</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.years_since_last_funding}
                      onChange={e => setFormData({ ...formData, years_since_last_funding: parseFloat(e.target.value) })}
                      className="w-full bg-background border border-border-subtle rounded-lg px-4 py-2 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Team */}
            <div className="space-y-6">
              <h3 className="text-sm font-mono text-primary-accent uppercase tracking-widest">03. Team</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Team Size</label>
                    <input
                      type="number"
                      value={formData.team_size}
                      onChange={e => setFormData({ ...formData, team_size: parseInt(e.target.value) })}
                      className="w-full bg-background border border-border-subtle rounded-lg px-4 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Founders</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.founder_count}
                      onChange={e => setFormData({ ...formData, founder_count: parseInt(e.target.value) })}
                      className="w-full bg-background border border-border-subtle rounded-lg px-4 py-2 outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border-subtle">
                  <span className="text-sm font-medium text-gray-400">Technical Co-founder?</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, has_technical_cofounder: !formData.has_technical_cofounder })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      formData.has_technical_cofounder ? "bg-primary-accent" : "bg-gray-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      formData.has_technical_cofounder ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Market */}
            <div className="space-y-6">
              <h3 className="text-sm font-mono text-primary-accent uppercase tracking-widest">04. Market</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Competition Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Low", "Medium", "High", "Saturated"].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, market_competition_level: level })}
                        className={cn(
                          "px-3 py-2 text-xs rounded-lg border transition-all",
                          formData.market_competition_level === level 
                            ? "bg-primary-accent/10 border-primary-accent text-primary-accent" 
                            : "border-border-subtle text-gray-500 hover:border-gray-400"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border-subtle">
                  <span className="text-sm font-medium text-gray-400">Has Pivoted?</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, has_pivot: !formData.has_pivot })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      formData.has_pivot ? "bg-primary-accent" : "bg-gray-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      formData.has_pivot ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "Analyzing..." : "Analyze Survival Odds 🚀"}
            </button>
            <button
              type="button"
              onClick={randomize}
              className="px-6 py-3 rounded-full border border-border-subtle hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Randomize
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

const ResultsDashboard = ({ results, onReset }: { results: PredictionResults, onReset: () => void }) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-primary-accent';
      case 'B': return 'text-teal-400';
      case 'C': return 'text-warning-accent';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-danger-accent';
      default: return 'text-white';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-20 px-6 max-w-7xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Survival Analysis Report</h2>
        <div className="flex gap-4">
          <button onClick={() => {
            const text = `My startup success analysis: ${results.risk_grade} Rating, ${results.success_probability}% success probability. Analyzed by Survival.ai`;
            navigator.clipboard.writeText(text);
            alert("Copied to clipboard!");
          }} className="p-2 rounded-lg border border-border-subtle hover:bg-white/5">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={onReset} className="btn-primary py-2 px-6 text-sm">Try Another Pitch</button>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
          <div className={cn("text-8xl font-bold mb-2", getGradeColor(results.risk_grade))}>
            {results.risk_grade}
          </div>
          <div className="text-xl font-mono mb-4">{results.success_probability}% Success Probability</div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${results.success_probability}%` }}
              className={cn("h-full", results.success_probability < 40 ? "bg-danger-accent" : "bg-primary-accent")}
            />
          </div>
        </div>

        <div className="glass-card p-8 grid grid-cols-2 gap-4">
          {[
            { label: "Median Survival", value: `${(results.median_survival_months / 12).toFixed(1)}y` },
            { label: "1-Year Survival", value: `${results.survival_1yr}%` },
            { label: "3-Year Survival", value: `${results.survival_3yr}%` },
            { label: "5-Year Survival", value: `${results.survival_5yr}%` }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col justify-center p-4 bg-background/50 rounded-xl border border-border-subtle">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          <h3 className="text-sm font-mono text-primary-accent uppercase tracking-widest mb-4">Recommendation</h3>
          <p className="text-gray-300 leading-relaxed italic">
            "{results.recommendation}"
          </p>
          <div className="mt-6 p-4 bg-primary-accent/5 border border-primary-accent/20 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-primary-accent shrink-0" />
            <p className="text-xs text-gray-400">This prediction is based on historical patterns. Every startup journey is unique.</p>
          </div>
        </div>
      </div>

      {/* Row 2: Survival Chart */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-bold mb-8">Survival Probability Curve</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results.survival_curve}>
              <defs>
                <linearGradient id="colorSurvival" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFB2" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00FFB2" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280" 
                fontSize={12} 
                tickFormatter={(v) => `${v}m`}
              />
              <YAxis 
                stroke="#6B7280" 
                fontSize={12} 
                tickFormatter={(v) => `${v * 100}%`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px' }}
                itemStyle={{ color: '#00FFB2' }}
                formatter={(v) => [`${((Number(v) || 0) * 100).toFixed(1)}%`, 'Survival Probability']}
                labelFormatter={(v) => `Month ${v}`}
              />
              <Area 
                type="monotone" 
                dataKey="survival_prob" 
                stroke="#00FFB2" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSurvival)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-6">Strategic Insights for Growth</h3>
          <div className="space-y-4">
            {results.risk_factors.length > 0 ? results.risk_factors.map((risk, i) => (
              <div key={i} className="p-4 bg-background/50 rounded-xl border border-border-subtle flex gap-4">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2 shrink-0",
                  risk.severity === 'high' ? "bg-danger-accent" : "bg-warning-accent"
                )} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{risk.factor}</span>
                    <span className={cn(
                      "text-[10px] uppercase px-2 py-0.5 rounded-full font-bold",
                      risk.severity === 'high' ? "bg-danger-accent/20 text-danger-accent" : "bg-warning-accent/20 text-warning-accent"
                    )}>{risk.severity}</span>
                  </div>
                  <p className="text-xs text-gray-500">{risk.impact}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-gray-500">No major risk factors identified.</div>
            )}
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-6">Comparable Startups</h3>
          <div className="space-y-4">
            {results.similar_startups.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border-subtle">
                <div>
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.industry} • {formatCurrency(s.funding)}</div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold",
                  s.status === 'Survived' ? "text-primary-accent" : "text-danger-accent"
                )}>
                  {s.status === 'Survived' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {s.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default function App() {
  const [view, setView] = useState<'home' | 'results'>('home');
  const [results, setResults] = useState<PredictionResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const res = await predictStartup(data);
      setResults(res);
      setView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert("Prediction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary-accent selection:text-background">
      <Navbar />
      
      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Hero onStart={() => document.getElementById('predict')?.scrollIntoView({ behavior: 'smooth' })} />
            <PitchForm onSubmit={handlePredict} isLoading={isLoading} />
          </motion.div>
        ) : (
          results && <ResultsDashboard results={results} onReset={() => setView('home')} />
        )}
      </AnimatePresence>

      <footer className="py-12 px-6 border-top border-border-subtle text-center text-gray-600 text-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" />
            <span className="font-mono font-bold tracking-tighter">SURVIVAL.AI</span>
          </div>
          <p>© 2026 Survival.ai — Built for Startup Success Prediction. Data is synthetic for demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
}

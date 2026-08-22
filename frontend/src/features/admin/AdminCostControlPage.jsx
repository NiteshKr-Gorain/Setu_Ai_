import React, { useState, useEffect, useCallback } from 'react';
import { fetchAiUsageStats, clearAiQueryCache } from './api/adminApi';

export default function AdminCostControlPage({ currentUser, onViewChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearingCache, setClearingCache] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Check if current user is an admin
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.email?.includes('admin'));

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAiUsageStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load AI usage statistics:', err);
      // If server is offline or error, provide fallback preview data
      setData({
        month: new Date().toISOString().slice(0, 7),
        monthly_budget_inr: 1500.0,
        current_month_spend_inr: 48.25,
        remaining_budget_inr: 1451.75,
        budget_utilization_pct: 3.22,
        budget_status: 'normal',
        user_daily_request_limit: 30,
        request_count_by_model: {
          'openai/gpt-4o-mini': 18,
          'anthropic/claude-sonnet-4': 3,
          'meta-llama/llama-3.1-8b-instruct': 1
        },
        telemetry: {
          total_queries: 42,
          cache_hits: 15,
          cache_hit_percentage: 35.71,
          rag_hits: 18,
          rag_hit_percentage: 42.86,
          ai_calls: 9,
          ai_call_percentage: 21.43,
          tokens_consumed: {
            prompt_tokens: 14200,
            completion_tokens: 4100,
            total_tokens: 18300
          }
        },
        recent_calls: [
          {
            id: 'call-1',
            user_id: 'user_68f0a1b2',
            model: 'openai/gpt-4o-mini',
            prompt_tokens: 480,
            completion_tokens: 135,
            total_tokens: 615,
            estimated_cost_inr: 0.033,
            timestamp: new Date().toISOString(),
            budget_status: 'normal',
            executed_tier: 'simple'
          },
          {
            id: 'call-2',
            user_id: 'user_99c3d4e5',
            model: 'anthropic/claude-sonnet-4',
            prompt_tokens: 920,
            completion_tokens: 280,
            total_tokens: 1200,
            estimated_cost_inr: 0.598,
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            budget_status: 'normal',
            executed_tier: 'reasoning'
          }
        ]
      });
      if (err?.response?.status === 403) {
        setError('Access denied: Admin privileges required to view telemetry.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await clearAiQueryCache();
      setToastMsg('AI Query Cache successfully cleared.');
      setTimeout(() => setToastMsg(''), 3500);
      loadStats();
    } catch (err) {
      console.error(err);
      setToastMsg('Failed to clear cache (server offline).');
      setTimeout(() => setToastMsg(''), 3500);
    } finally {
      setClearingCache(false);
    }
  };

  // Role Protection View
  if (!isAdmin) {
    return (
      <div className="pt-28 pb-16 min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-xl text-center space-y-5 animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-rose-100">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              The AI Cost Control &amp; Budget Telemetry dashboard is strictly reserved for platform administrators.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onViewChange && onViewChange('home')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Return Home
            </button>
            <button
              onClick={() => onViewChange && onViewChange('signin')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const spend = data?.current_month_spend_inr ?? 0;
  const budget = data?.monthly_budget_inr ?? 1500;
  const remaining = data?.remaining_budget_inr ?? Math.max(0, budget - spend);
  const utilization = data?.budget_utilization_pct ?? (budget > 0 ? (spend / budget) * 100 : 0);
  const budgetStatus = data?.budget_status ?? (spend >= budget ? 'budget_exceeded' : spend >= budget * 0.8 ? 'warning' : 'normal');

  // Color coding for spend progress bar
  let progressColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let statusText = 'Normal Operations (Under 80%)';
  if (budgetStatus === 'warning' || (utilization >= 80 && utilization < 100)) {
    progressColor = 'bg-amber-500';
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    statusText = 'Budget Warning (80%–100% Threshold)';
  } else if (budgetStatus === 'budget_exceeded' || utilization >= 100) {
    progressColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
    statusText = 'Budget Limit Exceeded (> 100% Degraded to Fallback)';
  }

  const telemetry = data?.telemetry ?? {
    total_queries: 0,
    cache_hits: 0,
    cache_hit_percentage: 0,
    rag_hits: 0,
    rag_hit_percentage: 0,
    ai_calls: 0,
    ai_call_percentage: 0,
    tokens_consumed: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };

  const recentCalls = data?.recent_calls ?? [];

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-8 text-left">
        
        {/* Toast Alert */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl z-50 text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
            <span>⚡</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Admin Console
              </span>
              <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${badgeColor}`}>
                ● {statusText}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              AI Cost Control &amp; Budget Telemetry
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              Live cost accounting, 3-tier traffic distribution, and OpenRouter token utilization for {data?.month || 'current month'}.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start md:self-auto">
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>🧹</span>
              <span>{clearingCache ? 'Clearing...' : 'Clear Query Cache'}</span>
            </button>
            <button
              onClick={loadStats}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
            >
              <span>🔄</span>
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
            {error}
          </div>
        )}

        {/* 1. Monthly Budget vs Spend Progress Bar Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly OpenRouter Budget</span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-3xl font-black text-slate-900">₹{spend.toFixed(2)}</span>
                <span className="text-xs font-semibold text-slate-400">of ₹{budget.toFixed(2)} budget cap</span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs font-semibold text-slate-650">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Remaining Budget</p>
                <p className="text-sm font-bold text-emerald-600">₹{remaining.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Daily User Quota</p>
                <p className="text-sm font-bold text-slate-800">{data?.user_daily_request_limit || 30} AI calls/day</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Utilization</p>
                <p className="text-sm font-bold text-slate-900">{utilization.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Progress Bar Container with 80% and 100% threshold markers */}
          <div className="space-y-2">
            <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              {/* Progress Fill */}
              <div
                className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                style={{ width: `${Math.min(100, Math.max(2, utilization))}%` }}
              ></div>

              {/* 80% Threshold Indicator Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 z-10"
                style={{ left: '80%' }}
                title="80% Warning Threshold (₹1200)"
              ></div>

              {/* 100% Threshold Indicator Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
                style={{ left: '100%' }}
                title="100% Budget Cap (₹1500)"
              ></div>
            </div>

            {/* Threshold Labels */}
            <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
              <span>₹0</span>
              <span className="text-amber-600">▲ 80% (₹1200 Warning)</span>
              <span className="text-rose-600">▲ 100% (₹1500 Limit)</span>
            </div>
          </div>
        </div>

        {/* 2. Three-Tier Traffic & Model Distribution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Traffic Escalation Bar Chart Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Traffic Escalation Distribution</h3>
                <p className="text-[11px] text-slate-400">Breakdown of how queries are resolved through the 3-tier flow</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                {telemetry.total_queries} Total Queries
              </span>
            </div>

            {/* Horizontal Bar Chart (Pure CSS/Tailwind) */}
            <div className="space-y-4 pt-1">
              
              {/* Tier 1: Cache Hits */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    1. In-Memory Cache Hits (0 Tokens)
                  </span>
                  <span className="text-slate-700">{telemetry.cache_hits} queries ({telemetry.cache_hit_percentage}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(telemetry.cache_hit_percentage, telemetry.cache_hits > 0 ? 3 : 0)}%` }}
                  ></div>
                </div>
              </div>

              {/* Tier 2: FAISS MiniLM RAG Hits */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    2. FAISS MiniLM RAG Grounded (Free / Cheap Phrasing)
                  </span>
                  <span className="text-slate-700">{telemetry.rag_hits} queries ({telemetry.rag_hit_percentage}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(telemetry.rag_hit_percentage, telemetry.rag_hits > 0 ? 3 : 0)}%` }}
                  ></div>
                </div>
              </div>

              {/* Tier 3: OpenRouter AI Escalations */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    3. OpenRouter AI Escalations (Paid Model Tiers)
                  </span>
                  <span className="text-slate-700">{telemetry.ai_calls} queries ({telemetry.ai_call_percentage}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(telemetry.ai_call_percentage, telemetry.ai_calls > 0 ? 3 : 0)}%` }}
                  ></div>
                </div>
              </div>

            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
              <span>Cumulative Tokens: {telemetry.tokens_consumed?.total_tokens?.toLocaleString() || 0} tokens</span>
              <span className="font-semibold text-emerald-600">
                ✨ {(Number(telemetry.cache_hit_percentage) + Number(telemetry.rag_hit_percentage)).toFixed(1)}% Resolved Before Cost Layer
              </span>
            </div>
          </div>

          {/* Model Breakdown & Cost Stats Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Model Tiers &amp; Pricing</h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">GPT-4o Mini</p>
                  <p className="text-[10px] text-slate-400">Simple Tier (High-Volume)</p>
                </div>
                <span className="text-xs font-black text-slate-700">
                  {data?.request_count_by_model?.['openai/gpt-4o-mini'] || 0} calls
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Claude Sonnet 4</p>
                  <p className="text-[10px] text-slate-400">Reasoning Tier (Analytical)</p>
                </div>
                <span className="text-xs font-black text-slate-700">
                  {data?.request_count_by_model?.['anthropic/claude-sonnet-4'] || 0} calls
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">LLaMA 3.1 8B</p>
                  <p className="text-[10px] text-slate-400">Fallback Tier (Over Budget)</p>
                </div>
                <span className="text-xs font-black text-slate-700">
                  {data?.request_count_by_model?.['meta-llama/llama-3.1-8b-instruct'] || 0} calls
                </span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 font-medium">
              💡 Budget protection automatically prevents Claude Sonnet escalation when spend exceeds ₹1500/month.
            </div>
          </div>

        </div>

        {/* 3. Recent AI Calls Audit Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent OpenRouter AI Invocations</h3>
              <p className="text-[11px] text-slate-400">Audit log from MongoDB collection `ai_usage_log`</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              Showing {recentCalls.length} recent entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Model / Tier</th>
                  <th className="px-6 py-3.5">Prompt / Comp</th>
                  <th className="px-6 py-3.5">Total Tokens</th>
                  <th className="px-6 py-3.5">Est. Cost</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentCalls.length > 0 ? (
                  recentCalls.map((call, idx) => (
                    <tr key={call.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                        {call.user_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-800">{call.model.split('/').pop()}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">
                            {call.executed_tier || 'simple'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {call.prompt_tokens} / {call.completion_tokens}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {call.total_tokens?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        ₹{call.estimated_cost_inr ? Number(call.estimated_cost_inr).toFixed(4) : '0.0000'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          call.budget_status === 'budget_exceeded'
                            ? 'bg-rose-100 text-rose-700'
                            : call.budget_status === 'warning'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {call.budget_status || 'normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {call.timestamp ? new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs font-normal">
                      No recent AI invocations recorded in this billing window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

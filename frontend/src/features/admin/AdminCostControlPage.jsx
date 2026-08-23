import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAdminOverview,
  fetchAdminKnowledge,
  updateKnowledgeStatus,
  fastVerifyKnowledge,
  deleteAdminKnowledge,
  fetchAdminUsers,
  updateUserPermissions,
  fetchAdminCommunities,
  toggleFeatureCommunity,
  fetchAiUsageStats,
  clearAiQueryCache
} from './api/adminApi';

export default function AdminCostControlPage({ currentUser, onViewChange }) {
  // Tab State: 'moderation' | 'users' | 'communities' | 'telemetry'
  const [activeTab, setActiveTab] = useState('moderation');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Overview Stats
  const [overview, setOverview] = useState({
    total_knowledge_entries: 0,
    pending_review_entries: 0,
    published_entries: 0,
    rejected_entries: 0,
    total_users: 0,
    active_contributors: 0,
    verified_mentors: 0,
    total_communities: 0,
    total_rfid_tags: 0,
    recent_activity: []
  });

  // Moderation Tab State
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [knowledgeFilterStatus, setKnowledgeFilterStatus] = useState('all');
  const [knowledgeCategory, setKnowledgeCategory] = useState('All');
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [modNoteInput, setModNoteInput] = useState('');
  const [selectedEntryForNote, setSelectedEntryForNote] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // User Permissions Tab State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userActionLoadingId, setUserActionLoadingId] = useState(null);

  // Communities Tab State
  const [communitiesList, setCommunitiesList] = useState([]);

  // Telemetry Tab State
  const [telemetryData, setTelemetryData] = useState(null);
  const [clearingCache, setClearingCache] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 1. Load Overview Metrics
  const loadOverview = useCallback(async () => {
    try {
      const res = await fetchAdminOverview();
      setOverview(res);
    } catch (err) {
      console.warn('Overview fetch warning:', err);
    }
  }, []);

  // 2. Load Knowledge Submissions
  const loadKnowledge = useCallback(async () => {
    try {
      const res = await fetchAdminKnowledge({
        status: knowledgeFilterStatus,
        category: knowledgeCategory,
        search: knowledgeSearch
      });
      setKnowledgeList(res || []);
    } catch (err) {
      console.error('Failed to load knowledge for moderation:', err);
    }
  }, [knowledgeFilterStatus, knowledgeCategory, knowledgeSearch]);

  // 3. Load Users
  const loadUsers = useCallback(async () => {
    try {
      const res = await fetchAdminUsers({
        search: userSearch,
        role: userRoleFilter
      });
      setUsersList(res || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [userSearch, userRoleFilter]);

  // 4. Load Communities
  const loadCommunities = useCallback(async () => {
    try {
      const res = await fetchAdminCommunities();
      setCommunitiesList(res || []);
    } catch (err) {
      console.error('Failed to load communities:', err);
    }
  }, []);

  // 5. Load Telemetry
  const loadTelemetry = useCallback(async () => {
    try {
      const res = await fetchAiUsageStats();
      setTelemetryData(res);
    } catch (err) {
      console.warn('Telemetry fetch fallback:', err);
      setTelemetryData({
        monthly_budget_inr: 1500.0,
        current_month_spend_inr: 48.25,
        remaining_budget_inr: 1451.75,
        budget_utilization_pct: 3.22,
        budget_status: 'normal',
        request_count_by_model: {
          'openai/gpt-4o-mini': 18,
          'anthropic/claude-sonnet-4': 3
        },
        telemetry: {
          total_queries: 42,
          cache_hits: 15,
          cache_hit_percentage: 35.71,
          ai_calls: 9
        }
      });
    }
  }, []);

  // Initial Data Load
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([
        loadOverview(),
        loadKnowledge(),
        loadUsers(),
        loadCommunities(),
        loadTelemetry()
      ]);
    } catch (err) {
      console.error('Error refreshing admin dashboard:', err);
      setErrorMsg('Failed to fetch some admin telemetry data.');
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadKnowledge, loadUsers, loadCommunities, loadTelemetry]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handle Moderation Status Change (Approve / Reject / Draft)
  const handleStatusChange = async (id, newStatus, note = null) => {
    setActionLoadingId(id);
    try {
      await updateKnowledgeStatus(id, newStatus, note);
      showToast(`Knowledge entry successfully marked as "${newStatus}".`);
      await Promise.all([loadKnowledge(), loadOverview()]);
      setSelectedEntryForNote(null);
      setModNoteInput('');
    } catch (err) {
      console.error(err);
      showToast('Failed to update knowledge status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Fast-Track 100% Verification
  const handleFastVerify = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await fastVerifyKnowledge(id);
      showToast(`✨ ${res.message || '100% Fast-Track Verified with Passport Seal!'}`);
      await Promise.all([loadKnowledge(), loadOverview()]);
    } catch (err) {
      console.error(err);
      showToast('Failed to fast-track verify knowledge entry.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Knowledge
  const handleDeleteKnowledge = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${title}"?`)) return;
    setActionLoadingId(id);
    try {
      await deleteAdminKnowledge(id);
      showToast(`Entry "${title}" removed from platform.`);
      await Promise.all([loadKnowledge(), loadOverview()]);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete knowledge entry.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle User Permission Toggles (can_post, can_create_community, is_active, role)
  const handleToggleUserPermission = async (userId, field, currentValue) => {
    setUserActionLoadingId(userId);
    try {
      const payload = { [field]: !currentValue };
      await updateUserPermissions(userId, payload);
      showToast(`User ${field.replace('_', ' ')} permission updated.`);
      await loadUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to update user permission.');
    } finally {
      setUserActionLoadingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUserActionLoadingId(userId);
    try {
      await updateUserPermissions(userId, { role: newRole });
      showToast(`User role updated to ${newRole.toUpperCase()}.`);
      await Promise.all([loadUsers(), loadOverview()]);
    } catch (err) {
      console.error(err);
      showToast('Failed to update user role.');
    } finally {
      setUserActionLoadingId(null);
    }
  };

  // Handle Community Feature Toggle
  const handleToggleFeatureCommunity = async (id, currentFeatured) => {
    try {
      await toggleFeatureCommunity(id, !currentFeatured);
      showToast(`Community featured status updated.`);
      await loadCommunities();
    } catch (err) {
      console.error(err);
      showToast('Failed to update community feature status.');
    }
  };

  // Clear AI Cache
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await clearAiQueryCache();
      showToast('AI Query & Vector Cache successfully cleared.');
      await loadTelemetry();
    } catch (err) {
      console.error(err);
      showToast('Failed to clear cache.');
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div id="admin-governance-panel" className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-10">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-primary text-white font-bold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-400/40 animate-bounce">
          <span>🔔</span>
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Header Section */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider rounded-full flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Setu Admin Command Center</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentUser?.email || 'nitesh@gmail.com'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
              Community Wisdom Moderation & Access Governance
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Authorize knowledge submissions, manage contributor sharing rights, fast-track verify heirloom wisdom passports, and govern rural learning circles.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={refreshAllData}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center space-x-2 border border-slate-600 active:scale-95"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Refresh Data</span>
            </button>
            {onViewChange && (
              <button
                onClick={() => onViewChange('home')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-md active:scale-95"
              >
                ← Back to App
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-3xl shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🛡️</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Queue</span>
            </div>
            <p className="text-2xl font-black text-white mt-3">{overview.pending_review_entries}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">Pending Moderation</p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-3xl shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📚</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Verified</span>
            </div>
            <p className="text-2xl font-black text-white mt-3">{overview.published_entries}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">Published Stories</p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-3xl shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-2xl">👥</span>
              <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">Users</span>
            </div>
            <p className="text-2xl font-black text-white mt-3">{overview.total_users}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">Total Community</p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-3xl shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🏡</span>
              <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">Hubs</span>
            </div>
            <p className="text-2xl font-black text-white mt-3">{overview.total_communities}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">Village Circles</p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-3xl shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📡</span>
              <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">Kiosks</span>
            </div>
            <p className="text-2xl font-black text-white mt-3">{overview.total_rfid_tags}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">RFID Badges & Tags</p>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'moderation'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>🛡️</span>
            <span>Knowledge Moderation Queue</span>
            {overview.pending_review_entries > 0 && (
              <span className="ml-1.5 px-2 py-0.5 bg-slate-950/40 text-amber-200 text-xs rounded-full font-black">
                {overview.pending_review_entries}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>👥</span>
            <span>User Access & Posting Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('communities')}
            className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'communities'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>🏡</span>
            <span>Community Circles</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'telemetry'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span>AI Engine & System Health</span>
          </button>
        </div>

        {/* 4. Tab 1: Knowledge Moderation Queue */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={knowledgeFilterStatus}
                  onChange={(e) => setKnowledgeFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Moderation States</option>
                  <option value="draft">Drafts / In Review</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Approved & Published</option>
                  <option value="rejected">Rejected / Taken Down</option>
                </select>

                <select
                  value={knowledgeCategory}
                  onChange={(e) => setKnowledgeCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-amber-400"
                >
                  <option value="All">All Categories</option>
                  <option value="Traditional Knowledge">Traditional Knowledge</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Education">Education</option>
                  <option value="Business">Business</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>

              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={knowledgeSearch}
                  onChange={(e) => setKnowledgeSearch(e.target.value)}
                  placeholder="Search submissions by title or contributor..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-400"
                />
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            {/* Knowledge Submissions List */}
            {knowledgeList.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center space-y-3">
                <span className="text-4xl">✨</span>
                <h3 className="text-lg font-bold text-white">No Knowledge Submissions Found</h3>
                <p className="text-xs text-slate-400">All submissions have been reviewed or match the selected filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {knowledgeList.map((entry) => {
                  const isActionLoading = actionLoadingId === entry._id;
                  const isVerified = entry.status === 'completed';
                  const isRejected = entry.status === 'rejected';

                  return (
                    <div
                      key={entry._id}
                      className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-md hover:border-slate-600 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 bg-slate-900 border border-slate-700 text-amber-400 text-[11px] font-extrabold rounded-full">
                            🏷️ {entry.category}
                          </span>

                          <span
                            className={`px-3 py-1 text-[11px] font-extrabold rounded-full border ${
                              isVerified
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isRejected
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {isVerified ? '✅ Approved & Published' : isRejected ? '❌ Rejected' : '⏳ Pending Review'}
                          </span>

                          {entry.passport_id && (
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-bold rounded-full">
                              📜 {entry.passport_id}
                            </span>
                          )}

                          {entry.trust_score > 0 && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold rounded-full">
                              Trust: {Math.round(entry.trust_score * 100)}%
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white tracking-tight">{entry.title}</h3>
                        <p className="text-xs text-slate-300 line-clamp-2">{entry.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                          <span>👤 <strong>{entry.contributor_name}</strong> {entry.contributor_email && `(${entry.contributor_email})`}</span>
                          <span>📅 {new Date(entry.created_at).toLocaleDateString()}</span>
                          {entry.moderation_note && (
                            <span className="text-amber-300 font-medium">💬 Note: "{entry.moderation_note}"</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
                        <button
                          disabled={isActionLoading}
                          onClick={() => handleFastVerify(entry._id)}
                          title="Instantly stamp 100% Trust Score, Passport ID and publish"
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                        >
                          <span>⚡</span>
                          <span>Fast-Track Verify</span>
                        </button>

                        {!isVerified && (
                          <button
                            disabled={isActionLoading}
                            onClick={() => handleStatusChange(entry._id, 'completed', 'Approved by Setu Admin Curator')}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                          >
                            <span>✅</span>
                            <span>Approve</span>
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            disabled={isActionLoading}
                            onClick={() => setSelectedEntryForNote(entry)}
                            className="px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                          >
                            <span>❌</span>
                            <span>Reject / Note</span>
                          </button>
                        )}

                        <button
                          disabled={isActionLoading}
                          onClick={() => handleDeleteKnowledge(entry._id, entry.title)}
                          className="p-2.5 bg-slate-700/80 hover:bg-rose-900 text-slate-300 hover:text-rose-200 text-xs font-bold rounded-2xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Permanently Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Tab 2: User Access & Posting Permissions */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filter and Search */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Roles</option>
                  <option value="contributor">Contributor (Elders/Makers)</option>
                  <option value="learner">Learner (Youth/Students)</option>
                  <option value="both">Both</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-400"
                />
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            {/* Users Permissions Table */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-700/80 text-xs font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">User / Contributor</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6 text-center">Allow Knowledge Posting</th>
                      <th className="py-4 px-6 text-center">Allow Communities</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6">RFID Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-xs">
                    {usersList.map((user) => {
                      const isUserLoading = userActionLoadingId === user._id;

                      return (
                        <tr key={user._id} className="hover:bg-slate-700/30 transition-colors">
                          {/* User Info */}
                          <td className="py-4 px-6">
                            <div className="font-bold text-white text-sm">{user.name}</div>
                            <div className="text-slate-400 font-mono text-xs">{user.email}</div>
                            <div className="text-[11px] text-amber-400/90 mt-0.5">
                              {user.knowledge_count} knowledge contributions
                            </div>
                          </td>

                          {/* Role Selector */}
                          <td className="py-4 px-6">
                            <select
                              disabled={isUserLoading}
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400 cursor-pointer"
                            >
                              <option value="contributor">Contributor</option>
                              <option value="learner">Learner</option>
                              <option value="both">Both</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>

                          {/* Allow Knowledge Posting Toggle */}
                          <td className="py-4 px-6 text-center">
                            <button
                              disabled={isUserLoading}
                              onClick={() => handleToggleUserPermission(user._id, 'can_post', user.can_post)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-3xs ${
                                user.can_post
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                              }`}
                            >
                              {user.can_post ? '✍️ Allowed to Post' : '🚫 Restricted'}
                            </button>
                          </td>

                          {/* Allow Communities Toggle */}
                          <td className="py-4 px-6 text-center">
                            <button
                              disabled={isUserLoading}
                              onClick={() => handleToggleUserPermission(user._id, 'can_create_community', user.can_create_community)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-3xs ${
                                user.can_create_community
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                                  : 'bg-slate-700 text-slate-400 border border-slate-600'
                              }`}
                            >
                              {user.can_create_community ? '🏡 Allowed' : '🔒 Blocked'}
                            </button>
                          </td>

                          {/* Active / Suspended Toggle */}
                          <td className="py-4 px-6 text-center">
                            <button
                              disabled={isUserLoading}
                              onClick={() => handleToggleUserPermission(user._id, 'is_active', user.is_active)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                user.is_active
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  : 'bg-rose-900 text-rose-200 border border-rose-700'
                              }`}
                            >
                              {user.is_active ? '🟢 Active' : '🔴 Suspended'}
                            </button>
                          </td>

                          {/* RFID Tag UID */}
                          <td className="py-4 px-6">
                            {user.rfid_card_uid ? (
                              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-mono text-[11px] font-bold">
                                📡 {user.rfid_card_uid}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs italic">No Badge Linked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. Tab 3: Communities & Groups */}
        {activeTab === 'communities' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communitiesList.map((comm) => (
                <div
                  key={comm._id}
                  className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-600 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-[11px] font-bold">
                        🏷️ {comm.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        👥 {comm.members_count} Members
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{comm.name}</h3>
                    <p className="text-xs text-slate-300 line-clamp-3">{comm.description}</p>
                    <p className="text-xs text-slate-400 pt-2">Created by: <strong>{comm.admin_name}</strong></p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
                    <span className="text-xs text-slate-400 font-mono">Visibility: {comm.visibility}</span>
                    <button
                      onClick={() => handleToggleFeatureCommunity(comm._id, comm.is_featured)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        comm.is_featured
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {comm.is_featured ? '⭐ Featured' : '☆ Feature'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Tab 4: AI Engine & System Health Sub-Tab */}
        {activeTab === 'telemetry' && telemetryData && (
          <div className="space-y-6">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">OpenRouter AI Cost Guard & Telemetry</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Multi-tier AI orchestration monitor with local vector cache and strict ₹1500 monthly budget limits.
                  </p>
                </div>

                <button
                  disabled={clearingCache}
                  onClick={handleClearCache}
                  className="px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  <span className={clearingCache ? 'animate-spin' : ''}>🧹</span>
                  <span>Clear AI Query Cache</span>
                </button>
              </div>

              {/* Budget Progress Bar */}
              <div className="space-y-2 bg-slate-900/80 p-5 rounded-2xl border border-slate-700/60">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Monthly Budget Spend (₹{telemetryData.current_month_spend_inr || 0} / ₹{telemetryData.monthly_budget_inr || 1500})</span>
                  <span className="text-emerald-400">{telemetryData.budget_utilization_pct || 0}% Utilized</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-amber-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(telemetryData.budget_utilization_pct || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Telemetry Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/40">
                  <p className="text-xs text-slate-400">Total AI Queries</p>
                  <p className="text-xl font-black text-white mt-1">{telemetryData.telemetry?.total_queries || 0}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/40">
                  <p className="text-xs text-slate-400">Cache Hits</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{telemetryData.telemetry?.cache_hits || 0}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/40">
                  <p className="text-xs text-slate-400">Cache Hit Rate</p>
                  <p className="text-xl font-black text-amber-400 mt-1">{telemetryData.telemetry?.cache_hit_percentage || 0}%</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/40">
                  <p className="text-xs text-slate-400">Direct LLM Calls</p>
                  <p className="text-xl font-black text-purple-400 mt-1">{telemetryData.telemetry?.ai_calls || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject / Moderation Note Modal */}
      {selectedEntryForNote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Moderate Knowledge Submission</h3>
            <p className="text-xs text-slate-300">
              Provide feedback for <strong>"{selectedEntryForNote.title}"</strong> by <em>{selectedEntryForNote.contributor_name}</em>.
            </p>

            <textarea
              rows={4}
              value={modNoteInput}
              onChange={(e) => setModNoteInput(e.target.value)}
              placeholder="e.g. Please clarify seed soaking ratios or add photo of the preparation..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-2xl p-4 focus:outline-none focus:border-rose-400"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setSelectedEntryForNote(null);
                  setModNoteInput('');
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(selectedEntryForNote._id, 'draft', modNoteInput || 'Revision requested')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                📝 Request Revision
              </button>
              <button
                onClick={() => handleStatusChange(selectedEntryForNote._id, 'rejected', modNoteInput || 'Submission rejected')}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                ❌ Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

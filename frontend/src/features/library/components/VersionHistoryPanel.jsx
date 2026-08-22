import React, { useState, useEffect, useCallback } from 'react';
import { fetchVersionHistory, fetchVersionDetails, verifyVersionIntegrity } from '../api/knowledgeApi';
import UserStatusBadge from '../../presence/components/UserStatusBadge';

/**
 * Status Badge Component with Tailored Color Schemes
 */
function VerificationBadge({ status }) {
  const normalized = (status || 'unverified').toLowerCase();

  if (normalized === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Verified</span>
      </span>
    );
  }

  if (normalized === 'flagged') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        <span>Flagged</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
      <span>Unverified</span>
    </span>
  );
}

/**
 * VersionHistoryPanel
 * 
 * Displays a vertical timeline of version snapshots for an article.
 * Supports clicking into a version to view full content, SHA-256 hash, and running integrity checks.
 *
 * @param {string} articleId - The knowledge article's ID
 * @param {string} [initialContributor] - Optional fallback author name
 * @param {Function} [onClose] - Optional close callback
 */
export default function VersionHistoryPanel({ articleId, initialContributor = 'Heritage Contributor', onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail View State
  const [selectedVersionNum, setSelectedVersionNum] = useState(null);
  const [versionDetail, setVersionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Verification State
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Load version list
  const loadVersions = useCallback(async () => {
    if (!articleId) {
      setError('Article ID is required to fetch version history.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchVersionHistory(articleId);
      const items = Array.isArray(data) ? data : data?.items || [];
      // Ensure sorted newest-first
      const sorted = [...items].sort((a, b) => (b.version_number || 0) - (a.version_number || 0));
      setVersions(sorted);
    } catch (err) {
      console.error('Failed to load version history:', err);
      setError(err.message || 'Unable to retrieve version history from knowledge ledger.');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Load single version detail
  const handleSelectVersion = async (vNum) => {
    setSelectedVersionNum(vNum);
    setVersionDetail(null);
    setDetailError(null);
    setVerificationResult(null);
    setVerifyError(null);
    setLoadingDetail(true);

    try {
      const detail = await fetchVersionDetails(articleId, vNum);
      setVersionDetail(detail);
    } catch (err) {
      console.error(`Failed to fetch version ${vNum} details:`, err);
      setDetailError(err.message || `Failed to fetch content for Version ${vNum}.`);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Run integrity verification on the selected version
  const handleVerifyIntegrity = async () => {
    if (!articleId || !selectedVersionNum) return;
    setVerifying(true);
    setVerifyError(null);
    setVerificationResult(null);

    try {
      const result = await verifyVersionIntegrity(articleId, selectedVersionNum);
      setVerificationResult(result);
    } catch (err) {
      console.error('Integrity verification failed:', err);
      setVerifyError(err.message || 'Cryptographic verification check failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  // Helper to format author from version document
  const getAuthorDisplay = (v) => {
    if (v.provenance?.activity_log?.length > 0) {
      const latestAct = v.provenance.activity_log[v.provenance.activity_log.length - 1];
      if (latestAct?.actor) return latestAct.actor;
    }
    if (v.modified_by) return `Agent ${String(v.modified_by).substring(0, 8)}`;
    if (v.created_by) return `Agent ${String(v.created_by).substring(0, 8)}`;
    return initialContributor;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full text-left transition-all duration-300">
      {/* Header Bar */}
      <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold text-sm shadow-inner">
            📜
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
              <span>Version History & Ledger</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                W3C PROV
              </span>
            </h3>
            <p className="text-[11px] text-slate-300 font-normal">
              Immutable cryptographic snapshot timeline and audit provenance
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        {/* Loading State for List */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Fetching Version Ledger…
            </p>
          </div>
        )}

        {/* Error State for List */}
        {!loading && error && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <h4 className="font-bold text-rose-900">Failed to Retrieve Version History</h4>
                <p className="text-rose-700 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={loadVersions}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              🔄 Retry Ledger Query
            </button>
          </div>
        )}

        {/* DETAIL VIEW: Single Version Selected */}
        {!loading && !error && selectedVersionNum !== null && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Back Button & Title Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => {
                  setSelectedVersionNum(null);
                  setVersionDetail(null);
                  setVerificationResult(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group"
              >
                <span className="transform transition-transform group-hover:-translate-x-1">←</span>
                <span>Back to Version Timeline</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Version {selectedVersionNum}
                </span>
                {versionDetail && <VerificationBadge status={versionDetail.verification_status} />}
              </div>
            </div>

            {/* Loading Detail */}
            {loadingDetail && (
              <div className="py-10 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Loading Version {selectedVersionNum} Snapshot…
                </p>
              </div>
            )}

            {/* Error Detail */}
            {!loadingDetail && detailError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <span>⚠️</span> {detailError}
                </p>
                <button
                  onClick={() => handleSelectVersion(selectedVersionNum)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  Retry Loading Content
                </button>
              </div>
            )}

            {/* Detailed Content & SHA-256 Card */}
            {!loadingDetail && !detailError && versionDetail && (
              <div className="space-y-4 text-xs">
                {/* Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Author / Agent
                    </span>
                    <div className="flex items-center space-x-1.5 pt-0.5">
                      <p className="font-semibold text-slate-800 truncate">
                        {getAuthorDisplay(versionDetail)}
                      </p>
                      <UserStatusBadge userId={versionDetail.created_by || versionDetail.modified_by} compact={true} size="sm" />
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Timestamp
                    </span>
                    <p className="font-semibold text-slate-800">
                      {formatDate(versionDetail.created_at || versionDetail.modified_at)}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Source
                    </span>
                    <p className="font-semibold text-slate-800 capitalize">
                      {versionDetail.source || 'Knowledge Contributor'}
                    </p>
                  </div>
                </div>

                {/* Change Summary */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    Change Summary
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {versionDetail.change_summary || 'Baseline version creation'}
                  </p>
                </div>

                {/* Full Content */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📄</span> Full Version Content
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {(versionDetail.content || '').length} characters
                    </span>
                  </div>
                  <div className="p-4 bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap select-all">
                    {versionDetail.content || '(No content stored for this snapshot)'}
                  </div>
                </div>

                {/* SHA-256 Hash Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <span>🔒</span> Recorded SHA-256 Hash
                    </span>
                    <button
                      onClick={() => handleCopyHash(versionDetail.sha256_hash)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedHash ? <span>✓ Copied!</span> : <span>📋 Copy Hash</span>}
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 break-all select-all shadow-inner">
                    {versionDetail.sha256_hash || 'No hash recorded'}
                  </p>
                </div>

                {/* Citations (if any) */}
                {versionDetail.citations && versionDetail.citations.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Citations & References
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                      {versionDetail.citations.map((cite, i) => (
                        <li key={i}>{cite}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cryptographic Integrity Verification Action */}
                <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 border border-blue-200/60 rounded-2xl p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>🛡️</span> Cryptographic Integrity Check
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Recomputes the SHA-256 hash server-side from stored content and compares it against the recorded ledger signature.
                      </p>
                    </div>

                    <button
                      onClick={handleVerifyIntegrity}
                      disabled={verifying}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      {verifying ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                          <span>Verifying…</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Verify Integrity</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Verification Error */}
                  {verifyError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      <p className="font-bold">⚠️ {verifyError}</p>
                    </div>
                  )}

                  {/* Verification Result Banner (Green / Red) */}
                  {verificationResult && (
                    <div
                      className={`p-4 rounded-2xl border text-xs space-y-2 transition-all animate-in zoom-in-95 duration-200 ${
                        verificationResult.verified
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-sm'
                          : 'bg-rose-50/90 border-rose-300 text-rose-900 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-black text-xs flex items-center gap-2">
                          <span className="text-base">{verificationResult.verified ? '✅' : '❌'}</span>
                          <span>
                            {verificationResult.verified
                              ? 'Integrity Verified — Signature Matches Recorded Hash'
                              : 'Integrity Check Failed — Content Tampering or Signature Mismatch Detected'}
                          </span>
                        </p>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            verificationResult.verified
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-rose-200 text-rose-900'
                          }`}
                        >
                          {verificationResult.verified ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>

                      <p className="text-[11px] leading-relaxed opacity-90">
                        {verificationResult.message ||
                          (verificationResult.verified
                            ? 'Server successfully computed SHA-256 on stored content string and found exact match.'
                            : 'The recomputed hash does not match the signature recorded on ledger.')}
                      </p>

                      <div className="pt-2 border-t border-slate-200/40 font-mono text-[10px] space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-slate-500">Computed Hash:</span>
                          <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-200 break-all select-all font-semibold">
                            {verificationResult.computed_hash || 'None'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-slate-500">Recorded Hash:</span>
                          <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-200 break-all select-all font-semibold">
                            {verificationResult.recorded_hash || 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TIMELINE LIST VIEW: Vertical timeline */}
        {!loading && !error && selectedVersionNum === null && (
          <div className="space-y-6">
            {versions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                <span className="text-2xl">📜</span>
                <h4 className="text-xs font-bold text-slate-700">No Historical Revisions Found</h4>
                <p className="text-[11px] text-slate-400">
                  This article currently only has its baseline creation record.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6">
                {versions.map((v, index) => {
                  const isLatest = index === 0;
                  return (
                    <div
                      key={v._id || v.id || v.version_number}
                      className="relative group cursor-pointer"
                      onClick={() => handleSelectVersion(v.version_number)}
                    >
                      {/* Timeline Marker Node */}
                      <span
                        className={`absolute -left-[31px] top-3.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-black transition-transform group-hover:scale-125 duration-200 ${
                          isLatest
                            ? 'bg-blue-600 border-blue-200 text-white ring-4 ring-blue-50'
                            : 'bg-white border-slate-300 text-slate-400 group-hover:border-blue-500 group-hover:text-blue-500'
                        }`}
                      >
                        {isLatest ? '★' : '•'}
                      </span>

                      {/* Card Container */}
                      <div className="bg-white border border-slate-100 hover:border-blue-200 rounded-2xl p-4.5 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                              v{v.version_number}
                            </span>
                            {isLatest && (
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                                Current Active
                              </span>
                            )}
                            <VerificationBadge status={v.verification_status} />
                          </div>

                          <span className="text-[10px] text-slate-400 font-medium">
                            ⏱️ {formatDate(v.created_at || v.modified_at)}
                          </span>
                        </div>

                        {/* Author & Change Summary */}
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {v.change_summary || (v.version_number === 1 ? 'Initial version release' : `Revision ${v.version_number}`)}
                          </p>
                          <p className="text-[11px] text-slate-500 font-normal">
                            Author: <span className="font-semibold text-slate-700">{getAuthorDisplay(v)}</span>
                          </p>
                        </div>

                        {/* Signature snippet */}
                        <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="truncate max-w-[200px] sm:max-w-xs">
                            SHA: {v.sha256_hash ? `${v.sha256_hash.substring(0, 16)}…` : 'Genesis'}
                          </span>
                          <span className="font-sans font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Inspect Details <span>→</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

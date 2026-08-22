import React, { useState } from 'react';
import {
  CATEGORIES,
  CONTENT_TYPES,
  createKnowledgeEntry,
  uploadKnowledgeFile,
  pollKnowledgeStatus,
  normalizeEntry,
} from '../library/api/knowledgeApi';

const CONTENT_TYPE_LABELS = {
  text: { label: 'Text / Article', emoji: '📝', accept: null },
  voice: { label: 'Voice Recording', emoji: '🎙️', accept: 'audio/mpeg,audio/wav,audio/mp4,.mp3,.wav,.m4a' },
  video: { label: 'Video', emoji: '🎥', accept: 'video/mp4,video/quicktime,.mp4,.mov' },
  document: { label: 'Document', emoji: '📄', accept: '.pdf,.docx,.txt' },
};

const STAGE = {
  FORM: 'form',
  SUBMITTING: 'submitting',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
};

export default function ContributePage({ onViewChange }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contentType, setContentType] = useState('text');
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState(STAGE.FORM);
  const [statusLabel, setStatusLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resultEntry, setResultEntry] = useState(null);

  const needsFile = contentType !== 'text';

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setContentType('text');
    setFile(null);
    setStage(STAGE.FORM);
    setStatusLabel('');
    setErrorMsg('');
    setResultEntry(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please give your knowledge entry a title and description.');
      return;
    }
    if (needsFile && !file) {
      setErrorMsg(`Please attach a ${CONTENT_TYPE_LABELS[contentType].label.toLowerCase()} file.`);
      return;
    }

    try {
      setStage(STAGE.SUBMITTING);
      setStatusLabel('Creating your knowledge entry…');
      const entry = await createKnowledgeEntry({ title: title.trim(), description: description.trim(), category });

      if (needsFile) {
        setStage(STAGE.UPLOADING);
        setStatusLabel('Uploading your file…');
        await uploadKnowledgeFile(entry.id, file, contentType);

        setStage(STAGE.PROCESSING);
        const finalStatus = await pollKnowledgeStatus(entry.id, {
          onTick: (s) => {
            if (s.status === 'processing') setStatusLabel('AI is transcribing and summarizing your contribution…');
            else if (s.status === 'uploaded') setStatusLabel('File received, starting processing…');
          },
        });

        if (finalStatus.status === 'failed') {
          setStage(STAGE.ERROR);
          setErrorMsg(finalStatus.error_message || 'Processing failed. You can try again from your profile.');
          return;
        }
      }

      setStage(STAGE.DONE);
      setResultEntry(normalizeEntry({ ...entry, status: 'completed' }));
    } catch (err) {
      setStage(STAGE.ERROR);
      setErrorMsg(err.message || 'Something went wrong while submitting your contribution.');
    }
  };

  const isBusy = [STAGE.SUBMITTING, STAGE.UPLOADING, STAGE.PROCESSING].includes(stage);

  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 bg-gradient-to-b from-blue-50/40 via-white to-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <div className="mb-10 text-left space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Share Your Knowledge</h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Contribute a practice, remedy, technique, or lesson learned. Setu's AI will transcribe and
            summarize it automatically, so future generations can find and learn from it.
          </p>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-10">
          {stage === STAGE.DONE && resultEntry ? (
            <div className="text-center space-y-5 py-6">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-black text-slate-900">Thank you for contributing!</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                "{resultEntry.title}" has been saved{needsFile ? ' and processed by our AI pipeline' : ''}.
                It's now discoverable in the Library.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onViewChange('library')}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-full transition-all cursor-pointer"
                >
                  View in Library
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-full transition-all cursor-pointer"
                >
                  Contribute Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Content type selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">How are you sharing this?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CONTENT_TYPES.map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setContentType(ct);
                        setFile(null);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        contentType === ct
                          ? 'border-brand-primary bg-brand-light text-brand-hover'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">{CONTENT_TYPE_LABELS[ct].emoji}</span>
                      <span>{CONTENT_TYPE_LABELS[ct].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  disabled={isBusy}
                  placeholder="E.g., Managing crop drought with mulching"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-b border-slate-200 focus:border-brand-primary py-2 text-sm focus:outline-none font-semibold text-slate-850"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  disabled={isBusy}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand-primary bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {needsFile ? 'Short Description' : 'Your Knowledge (this is what will be shared)'}
                </label>
                <textarea
                  required
                  disabled={isBusy}
                  rows={needsFile ? 3 : 8}
                  placeholder={
                    needsFile
                      ? 'A sentence or two describing what this recording/document covers.'
                      : 'Write out the practice, lesson, or story in your own words…'
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              {/* File upload */}
              {needsFile && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Upload {CONTENT_TYPE_LABELS[contentType].label}
                  </label>
                  <input
                    type="file"
                    required
                    disabled={isBusy}
                    accept={CONTENT_TYPE_LABELS[contentType].accept}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs font-semibold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-light file:text-brand-hover hover:file:bg-brand-primary/20 cursor-pointer"
                  />
                  {file && <p className="text-[11px] text-slate-400 font-semibold">{file.name} ({Math.round(file.size / 1024)} KB)</p>}
                </div>
              )}

              {/* Progress indicator while busy */}
              {isBusy && (
                <div className="flex items-center gap-3 bg-blue-50/60 border border-blue-100 rounded-2xl px-4 py-3">
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-blue-700">{statusLabel}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-full transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isBusy ? 'Submitting…' : 'Submit Knowledge'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import AiModalContainer from './components/AiModalContainer';

export default function AiAssistantPage({ userProfile, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <AiModalContainer userProfile={userProfile} onClose={onClose} />
    </div>
  );
}

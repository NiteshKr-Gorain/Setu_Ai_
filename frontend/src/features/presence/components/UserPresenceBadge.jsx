import React from 'react';
import { useUserPresence } from '../hooks/useUserPresence';

/**
 * Real-time User Presence Badge with live WebSocket updates, status dot, and activity freshness.
 * @param {Object} props
 * @param {string} props.userId - Target user ID to display presence for
 * @param {string} [props.userName] - Display name
 * @param {boolean} [props.showActivity=true] - Whether to show activity subtitle
 * @param {string} [props.size='sm'] - 'sm' | 'md' | 'lg'
 */
export default function UserPresenceBadge({
  userId,
  userName = '',
  showActivity = true,
  size = 'sm'
}) {
  const { presence, isOnline, isIdle, freshness } = useUserPresence(userId);

  const status = presence?.status || 'offline';
  const activity = presence?.current_activity;

  let dotColor = 'bg-slate-300';
  let badgeText = 'Offline';
  let badgeClasses = 'text-slate-500 bg-slate-100';

  if (isOnline) {
    dotColor = 'bg-emerald-500';
    badgeText = 'Active';
    badgeClasses = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
  } else if (isIdle) {
    dotColor = 'bg-amber-500';
    badgeText = 'Idle';
    badgeClasses = 'text-amber-700 bg-amber-50 border border-amber-200';
  }

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return (
    <div className="inline-flex items-center space-x-2 text-left" title={`Status: ${badgeText} (${freshness})`}>
      <span className="relative flex items-center justify-center">
        {isOnline && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full ${dotSizes[size] || 'w-2 h-2'} ${dotColor}`}></span>
      </span>

      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5">
          {userName && <span className="font-semibold text-xs text-slate-800">{userName}</span>}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeClasses}`}>
            {badgeText}
          </span>
        </div>

        {showActivity && (activity || freshness) && (
          <span className="text-[10px] text-slate-400 font-normal truncate max-w-[180px]">
            {activity ? `${activity.replace(/_/g, ' ')} • ` : ''}{freshness}
          </span>
        )}
      </div>
    </div>
  );
}

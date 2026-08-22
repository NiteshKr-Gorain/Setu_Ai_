import React, { useEffect, useState } from 'react';
import { useUserPresence } from '../hooks/useUserPresence';

/**
 * UserStatusBadge: Live presence status indicator with real-time WebSocket updates.
 * Displays:
 *   - Colored dot: 🟢 Green (active), 🔘 Grey (idle), 🔴 Red (offline/stale)
 *   - Live text: "Active — last confirmed 8s ago", "Idle — last confirmed 50s ago", "Offline — last confirmed 2m ago"
 *
 * @param {Object} props
 * @param {string} props.userId - Unique user ID to track
 * @param {string} [props.userName] - Optional display name
 * @param {boolean} [props.showText=true] - Whether to show the text label
 * @param {boolean} [props.compact=false] - Whether to show compact mode (just status name vs full freshness sentence)
 * @param {string} [props.size='sm'] - 'sm' | 'md' | 'lg'
 */
export default function UserStatusBadge({
  userId,
  userName = '',
  showText = true,
  compact = false,
  size = 'sm'
}) {
  const { presence, isOnline, isIdle, freshness, loading } = useUserPresence(userId);
  const [localSeconds, setLocalSeconds] = useState(presence?.seconds_since_confirmed ?? null);

  // Increment local seconds ticker between WebSocket/heartbeat updates
  useEffect(() => {
    if (presence?.seconds_since_confirmed !== undefined && presence?.seconds_since_confirmed !== null) {
      setLocalSeconds(Math.round(presence.seconds_since_confirmed));
    }
  }, [presence?.seconds_since_confirmed, presence?.last_confirmed_at]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalSeconds((prev) => (prev !== null ? prev + 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const status = presence?.status || 'offline';

  // Compute live freshness text
  let liveFreshness = presence?.freshness || 'never confirmed';
  if (localSeconds !== null && localSeconds !== undefined) {
    if (localSeconds < 10) {
      liveFreshness = 'just now';
    } else if (localSeconds < 60) {
      liveFreshness = `${localSeconds}s ago`;
    } else if (localSeconds < 3600) {
      const mins = Math.floor(localSeconds / 60);
      liveFreshness = `${mins}m ago`;
    } else if (localSeconds < 86400) {
      const hrs = Math.floor(localSeconds / 3600);
      liveFreshness = `${hrs}h ago`;
    } else {
      const days = Math.floor(localSeconds / 86400);
      liveFreshness = `${days}d ago`;
    }
  }

  // 1. Color Dot & Label Configuration
  // Active = Green (🟢), Idle = Grey (🔘), Offline/Stale = Red (🔴)
  let dotColor = 'bg-red-500';
  let dotRing = 'ring-red-200/60';
  let textColor = 'text-red-700';
  let badgeBg = 'bg-red-50 border-red-200/60';
  let statusLabel = 'Offline';

  if (isOnline) {
    dotColor = 'bg-emerald-500';
    dotRing = 'ring-emerald-200/60';
    textColor = 'text-emerald-700';
    badgeBg = 'bg-emerald-50 border-emerald-200/60';
    statusLabel = 'Active';
  } else if (isIdle) {
    dotColor = 'bg-slate-400';
    dotRing = 'ring-slate-200/60';
    textColor = 'text-slate-600';
    badgeBg = 'bg-slate-100 border-slate-200/60';
    statusLabel = 'Idle';
  }

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  const displayText = compact
    ? statusLabel
    : `${statusLabel} — last confirmed ${liveFreshness}`;

  if (!userId) return null;

  return (
    <div
      className="inline-flex items-center space-x-1.5 text-left select-none"
      title={`User ${userId}: ${statusLabel} (${liveFreshness})`}
    >
      {/* Colored Status Dot */}
      <span className="relative flex items-center justify-center shrink-0">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSizes[size] || 'w-2 h-2'} ${dotColor} ring-2 ${dotRing}`}
        ></span>
      </span>

      {/* User Name & Status Text */}
      {showText && (
        <span className={`text-[11px] font-semibold tracking-tight ${textColor}`}>
          {userName && <span className="font-bold text-slate-800 mr-1">{userName}</span>}
          {displayText}
        </span>
      )}
    </div>
  );
}

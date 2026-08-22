import React from 'react';
import { 
  SquarePen, 
  MessageSquare, 
  Trash2,
  Home
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose, 
  onNewChat, 
  chats = [], 
  onSelectChat, 
  activeChatTitle, 
  onDeleteChat,
  userProfile
}) {
  const getUserProfile = () => {
    if (userProfile && typeof userProfile === 'object') return userProfile;
    if (typeof window !== 'undefined' && window.SETU_USER) return window.SETU_USER;
    try {
      const stored = localStorage.getItem('setu_user_profile');
      if (stored) return JSON.parse(stored);
    } catch (_e) {}
    return {
      name: 'User',
      plan: 'AI Setu Member'
    };
  };

  const user = getUserProfile();
  const userName = user.name || 'User';
  const userPlan = user.plan || user.role || user.email || 'AI Setu Member';
  
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = user.initials || getInitials(userName);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#ffffff] text-slate-800 border-r border-[#e2e8f0] flex flex-col justify-between p-3 shrink-0 transition-transform duration-200 ease-in-out shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand Header */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-2">
            <div 
              onClick={() => { onNewChat(); if (onClose) onClose(); }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-500/30">
                S
              </div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">Setu AI</span>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors mb-3 group shadow-md shadow-orange-500/20"
          >
            <div className="flex items-center gap-2.5">
              <SquarePen className="w-4 h-4 text-white" />
              <span>New chat</span>
            </div>
          </button>

          {/* View Nav Tabs */}
          <div className="space-y-1 mb-3">
            <button
              onClick={() => { setActiveTab('home'); if (onClose) onClose(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'home' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Explore Home</span>
            </button>
            <button
              onClick={() => { setActiveTab('chats'); if (onClose) onClose(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'chats' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Conversations ({chats.length})</span>
            </button>
          </div>

          {/* Scrollable Recents Section */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Recents
              </div>
              <div className="space-y-1 mt-1">
                {chats.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400 italic">No recent chats</p>
                ) : (
                  chats.map((chat) => {
                    const isCurrent = activeChatTitle === chat.title;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          onSelectChat(chat);
                          if (onClose) onClose();
                        }}
                        className={`group w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-orange-50 text-orange-600 border border-orange-200 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title={chat.title}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          <span className="truncate">{chat.title}</span>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteChat) {
                              onDeleteChat(chat);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Delete this chat from recent conversations"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* User Profile & Footer Area */}
          <div className="pt-3 mt-auto border-t border-[#e2e8f0]">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={userName} 
                    loading="lazy"
                    className="w-8 h-8 rounded-full object-cover shrink-0 shadow-xs border border-orange-300" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    {userInitials}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{userName}</p>
                  <p className="text-xs text-orange-600 font-medium leading-tight">{userPlan}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

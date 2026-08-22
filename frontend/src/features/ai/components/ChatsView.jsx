import React, { useState } from 'react';
import { MessageSquare, Code2, FileText, Plus, Trash2, Search, ArrowRight } from 'lucide-react';
import { deleteChatById, clearRecentChats } from '../../../shared/services/localStorageService';

export default function ChatsView({ chats, setChatsList, onSelectChat, onNewChat }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.category && chat.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (e, id) => {
    e.stopPropagation();
    const updated = deleteChatById(id);
    setChatsList(updated);
  };

  const handleClearAll = () => {
    const updated = clearRecentChats();
    setChatsList(updated);
  };

  const getIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'code':
      case 'coding':
        return <Code2 className="w-4 h-4 text-orange-600" />;
      case 'document':
      case 'planning':
        return <FileText className="w-4 h-4 text-amber-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full text-slate-800 bg-[#f5f5f7]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Your Conversations</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access and manage all saved chat threads
          </p>
        </div>

        <div className="flex items-center gap-3">
          {chats.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <button
            onClick={onNewChat}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search chat title or category..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-xs"
        />
      </div>

      {/* Chat List */}
      {filteredChats.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 bg-white border border-[#e2e8f0] rounded-2xl text-center shadow-xs">
          <MessageSquare className="w-10 h-10 text-slate-400 mb-3" />
          <h3 className="font-semibold text-slate-700 text-sm">No chats found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm ? 'Try a different keyword' : 'Start a new conversation'}
          </p>
          <button
            onClick={onNewChat}
            className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-orange-500/20 transition-colors"
          >
            Start New Chat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className="group p-4 bg-white hover:bg-orange-50/50 border border-[#e2e8f0] hover:border-orange-300 rounded-xl transition-all cursor-pointer flex flex-col justify-between shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                    {getIcon(chat.category)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-xs truncate group-hover:text-orange-600 transition-colors">
                      {chat.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {chat.category || 'General'} • {chat.timestamp}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-orange-600 font-medium">
                <span>Open Thread</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

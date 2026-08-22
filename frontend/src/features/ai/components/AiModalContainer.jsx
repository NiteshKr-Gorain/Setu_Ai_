import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import HomeView from './HomeView';
import ChatInput from './ChatInput';
import ChatMessagesView from './ChatMessagesView';
import VoiceAvatarModal from './VoiceAvatarModal';
import ChatsView from './ChatsView';
import { 
  checkBackendHealth, 
  sendChatMessage 
} from '../../../shared/services/apiService';
import { 
  searchLocalStorage, 
  saveToLocalStorageCache, 
  getRecentChats, 
  getSavedChatSessions,
  getChatSessionById,
  saveChatSession,
  deleteHistoryAndChat
} from '../../../shared/services/localStorageService';

export default function AiModalContainer({ userProfile, onClose }) {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatsList, setChatsList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState(null);
  const [activeChatTitle, setActiveChatTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Instant');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Poll backend health status
  const checkHealth = async () => {
    const health = await checkBackendHealth();
    setIsBackendConnected(health.connected);
    return health;
  };

  useEffect(() => {
    setChatsList(getSavedChatSessions());
    checkHealth();

    const timer = setInterval(() => {
      checkHealth();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const handleStartNewChat = () => {
    setActiveChatId(null);
    setActiveChatMessages(null);
    setActiveChatTitle('');
    setActiveTab('home');
  };

  const handleCloseModal = () => {
    handleStartNewChat();
    if (onClose) onClose();
  };

  // Main Handle Send Message Pipeline
  const handleSendMessage = async (promptText, category = 'General') => {
    if (!promptText.trim()) return;

    const currentSessionId = activeChatId || `chat_${Date.now()}`;
    const currentTitle = activeChatTitle || (promptText.length > 32 ? promptText.substring(0, 32) + '...' : promptText);

    if (!activeChatId) {
      setActiveChatId(currentSessionId);
    }
    if (!activeChatTitle) {
      setActiveChatTitle(currentTitle);
    }

    const userMsg = {
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentMessages = activeChatMessages ? [...activeChatMessages, userMsg] : [userMsg];
    setActiveChatMessages(currentMessages);
    setIsLoading(true);

    let aiMsg;
    const localCheck = searchLocalStorage(promptText);
    const apiResult = await sendChatMessage(promptText, category, localCheck);

    if (apiResult.success && apiResult.data) {
      const data = apiResult.data;
      aiMsg = {
        sender: 'ai',
        text: data.response || 'No response content returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: data.category || category,
        source: data.source || 'Dual Search (Setu Database + Google Web)',
        sources: data.sources || ['Setu FAISS Knowledge Base', 'Google Search'],
        databaseMatches: data.database_matches || data.faiss_matches || [],
        faissMatches: data.faiss_matches || data.database_matches || [],
        googleMatches: data.google_matches || [],
        databaseMatch: data.database_match || null,
        googleMatch: data.google_match || null,
        localMatch: data.local_match || (localCheck.found ? localCheck : null),
        points: data.points || null,
        kerasMetadata: data.keras_metadata || null,
        persona: data.persona || 'Sardar Genji (Senior Knowledge Master)',
        faissEngine: data.faiss_engine || 'FAISS IndexFlatIP (384d MiniLM)'
      };
      saveToLocalStorageCache(promptText, aiMsg.text, aiMsg.category, data);
      setIsBackendConnected(true);
    } else {
      setIsBackendConnected(false);
      const localResult = searchLocalStorage(promptText);

      if (localResult.found) {
        const cached = localResult.data;
        aiMsg = {
          sender: 'ai',
          text: cached.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: cached.category || category,
          source: cached.source || 'Local Storage Cache (Offline)',
          points: cached.points || null,
          kerasMetadata: cached.kerasMetadata || null,
          persona: cached.persona || 'Cached Knowledge'
        };
      } else {
        const fallbackText = `Here is the response for "${promptText}".`;
        aiMsg = {
          sender: 'ai',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category,
          source: 'Browser Local Synthesizer (Offline)'
        };
        saveToLocalStorageCache(promptText, fallbackText, category);
      }
    }

    const finalMessages = [...currentMessages, aiMsg];
    setActiveChatMessages(finalMessages);

    const updatedChats = saveChatSession({
      id: currentSessionId,
      title: currentTitle,
      category,
      messages: finalMessages
    });
    setChatsList(updatedChats);

    setIsLoading(false);
  };

  const handleSelectRecentChat = (chat) => {
    const fullSession = getChatSessionById(chat.id) || chat;
    setActiveChatId(fullSession.id || chat.id);
    setActiveChatTitle(fullSession.title || chat.title);

    if (fullSession.messages && Array.isArray(fullSession.messages) && fullSession.messages.length > 0) {
      setActiveChatMessages(fullSession.messages);
    } else {
      const initialMsgs = [
        {
          sender: 'user',
          text: chat.title,
          timestamp: chat.timestamp || 'Previous'
        },
        {
          sender: 'ai',
          text: `Loaded stored conversation thread for "${chat.title}".`,
          source: 'Local Storage Cache',
          timestamp: chat.timestamp || 'Previous'
        }
      ];
      setActiveChatMessages(initialMsgs);
      saveChatSession({
        id: chat.id,
        title: chat.title,
        category: chat.category || 'General',
        messages: initialMsgs
      });
      setChatsList(getSavedChatSessions());
    }
  };

  const handleResetChatView = () => {
    setActiveChatId(null);
    setActiveChatMessages(null);
    setActiveChatTitle('');
  };

  const handleDeleteRecentChat = (chatToDelete) => {
    const result = deleteHistoryAndChat(chatToDelete.id, chatToDelete.title);
    setChatsList(result.recentChats);
    if (activeChatId === chatToDelete.id || activeChatTitle === chatToDelete.title) {
      handleResetChatView();
    }
  };

  const renderMainContent = () => {
    if (activeChatMessages) {
      return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f5f5f7]">
          <ChatMessagesView
            messages={activeChatMessages}
            title={activeChatTitle}
            onBack={handleResetChatView}
            isLoading={isLoading}
            userProfile={userProfile}
          />
          <div className="pb-6 pt-2 bg-[#f5f5f7]">
            <ChatInput
              onSendMessage={(txt) => handleSendMessage(txt)}
              onOpenVoiceMode={() => setIsVoiceModalOpen(true)}
              isLoading={isLoading}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'chats':
        return (
          <ChatsView
            chats={chatsList}
            setChatsList={setChatsList}
            onSelectChat={handleSelectRecentChat}
            onNewChat={handleStartNewChat}
          />
        );
      case 'home':
      default:
        return (
          <HomeView
            onSendMessage={(prompt, cat) => handleSendMessage(prompt, cat)}
            onOpenVoiceMode={() => setIsVoiceModalOpen(true)}
            isLoading={isLoading}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        );
    }
  };

  return (
    <div className={`flex overflow-hidden font-sans text-slate-800 selection:bg-orange-500 selection:text-white transition-all duration-300 ${
      isFullscreen
        ? 'fixed inset-0 z-50 w-screen h-screen max-w-none rounded-none shadow-none border-none'
        : 'w-full max-w-6xl h-[90vh] bg-[#f5f5f7] rounded-[32px] shadow-2xl border border-slate-200/80 relative'
    }`}>
      {/* Side Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveChatId(null);
          setActiveChatMessages(null);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleStartNewChat}
        chats={chatsList}
        onSelectChat={handleSelectRecentChat}
        activeChatTitle={activeChatTitle}
        onDeleteChat={handleDeleteRecentChat}
        userProfile={userProfile}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f5f5f7]">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeChatTitle={activeChatTitle}
          isBackendConnected={isBackendConnected}
          onClose={handleCloseModal}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />

        {/* Dynamic Views */}
        {renderMainContent()}
      </main>

      {/* Voice Avatar Modal */}
      <VoiceAvatarModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAskBackend={async (queryText) => {
          const res = await sendChatMessage(queryText, 'Voice');
          if (res.success) {
            return res.data;
          }
          return { response: `Processed query: "${queryText}". Backend server is currently offline.` };
        }}
      />
    </div>
  );
}

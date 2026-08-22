import React from 'react';
import HomePage from './features/home/HomePage';
import CommunityPage from './features/community/CommunityPage';
import LibraryPage from './features/library/LibraryPage';
import LegacyPage from './features/legacy/LegacyPage';
import GovernmentSchemesPage from './features/schemes/GovernmentSchemesPage';
import AboutUsPage from './features/about/AboutUsPage';
import ContributePage from './features/contribute/ContributePage';
import SignInPage from './features/auth/SignInPage';
import SignUpPage from './features/auth/SignUpPage';
import ProfilePage from './features/profile/ProfilePage';
import AiAssistantPage from './features/ai/AiAssistantPage';

export default function AppRoutes({ currentView, setCurrentView, _requireAuthView, currentUser, handleLogout }) {
  // Normalize string for robust route matching
  const normalizedView = (currentView || 'home').toString().toLowerCase().trim();

  switch (normalizedView) {
    case 'home':
    case 'main':
    case 'index':
      return <HomePage onViewChange={setCurrentView} currentUser={currentUser} />;

    case 'library':
    case 'knowledge':
    case 'knowledge-base':
      return <LibraryPage onContribute={() => setCurrentView('contribute')} />;

    case 'community':
    case 'mentors':
    case 'communities':
      return <CommunityPage userProfile={currentUser} />;

    case 'legacy':
    case 'archive':
    case 'archives':
    case 'legacy archives':
      return <LegacyPage />;

    case 'schemes':
    case 'govt schemes':
    case 'government schemes':
    case 'govt-schemes':
      return <GovernmentSchemesPage />;

    case 'about':
    case 'about us':
    case 'about-us':
      return <AboutUsPage onViewChange={setCurrentView} onSignUpClick={() => setCurrentView('signup')} />;

    case 'signin':
    case 'sign-in':
    case 'login':
      return <SignInPage onViewChange={setCurrentView} />;

    case 'signup':
    case 'sign-up':
    case 'register':
      return <SignUpPage onViewChange={setCurrentView} />;

    case 'profile':
    case 'user-profile':
    case 'account':
      return <ProfilePage userProfile={currentUser} onLogout={handleLogout} />;

    case 'contribute':
    case 'share':
    case 'add-knowledge':
      return <ContributePage onViewChange={setCurrentView} />;

    case 'ai':
    case 'ai-assistant':
    case 'chat':
      return <AiAssistantPage userProfile={currentUser} onClose={() => setCurrentView('home')} />;

    default:
      return <HomePage onViewChange={setCurrentView} currentUser={currentUser} />;
  }
}

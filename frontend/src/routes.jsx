import React from 'react';

const HomePage = React.lazy(() => import('./features/home/HomePage'));
const CommunityPage = React.lazy(() => import('./features/community/CommunityPage'));
const LibraryPage = React.lazy(() => import('./features/library/LibraryPage'));
const LegacyPage = React.lazy(() => import('./features/legacy/LegacyPage'));
const GovernmentSchemesPage = React.lazy(() => import('./features/schemes/GovernmentSchemesPage'));
const AboutUsPage = React.lazy(() => import('./features/about/AboutUsPage'));
const ContributePage = React.lazy(() => import('./features/contribute/ContributePage'));
const SignInPage = React.lazy(() => import('./features/auth/SignInPage'));
const SignUpPage = React.lazy(() => import('./features/auth/SignUpPage'));
const ProfilePage = React.lazy(() => import('./features/profile/ProfilePage'));
const AiAssistantPage = React.lazy(() => import('./features/ai/AiAssistantPage'));
const AdminCostControlPage = React.lazy(() => import('./features/admin/AdminCostControlPage'));

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

    case 'admin':
    case 'admin-costs':
    case 'cost-control':
    case 'ai-usage':
    case 'ai-costs':
      return <AdminCostControlPage currentUser={currentUser} onViewChange={setCurrentView} />;

    default:
      return <HomePage onViewChange={setCurrentView} currentUser={currentUser} />;
  }
}

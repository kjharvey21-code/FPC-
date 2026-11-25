import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { TopNav } from './components/TopNav';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';
import { HomeTab } from './components/tabs/HomeTab';
import { FeedTab } from './components/tabs/FeedTab';
import { MembersTab } from './components/tabs/MembersTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { AdminTab } from './components/tabs/AdminTab';
import { EventDetailsModal } from './components/modals/EventDetailsModal';
import { BirthdatePromptBanner } from './components/BirthdatePromptBanner';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-xs text-slate-600 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while loading FPC Hub.'}
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload FPC Hub</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MainLayout: React.FC = () => {
  const {
    currentUser,
    activeTab,
    events,
    selectedNotificationEventId,
    setSelectedNotificationEventId,
  } = useApp();

  const [dismissedBirthdatePromptForId, setDismissedBirthdatePromptForId] = useState<string | null>(null);

  const selectedNotificationEvent = selectedNotificationEventId
    ? events.find((e) => e.id === selectedNotificationEventId) || null
    : null;

  if (!currentUser) {
    return (
      <>
        <AuthScreen />
        <ToastContainer />
      </>
    );
  }

  const showWorkspaceBirthdatePrompt =
    !currentUser.birthdate &&
    dismissedBirthdatePromptForId !== currentUser.id &&
    activeTab !== 'profile';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Bar */}
      <TopNav />

      {/* Main Responsive Canvas with mobile bottom nav clearance */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3.5 sm:pt-6 md:pt-8 pb-24 sm:pb-28 md:pb-8">
        {showWorkspaceBirthdatePrompt && (
          <BirthdatePromptBanner
            dismissible
            onDismiss={() => setDismissedBirthdatePromptForId(currentUser.id)}
          />
        )}
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'members' && <MembersTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'admin' && <AdminTab />}
      </main>

      {/* Event Details Modal opened via Notification Click */}
      {selectedNotificationEvent && (
        <EventDetailsModal
          event={selectedNotificationEvent}
          onClose={() => setSelectedNotificationEventId(null)}
        />
      )}

      {/* Mobile-first Navigation */}
      <BottomNav />

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}

import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Newspaper, Users, User, ShieldAlert } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useApp();

  if (!currentUser) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 pb-safe shadow-lg">
      <div
        className={`grid ${
          currentUser.isOfficer ? 'grid-cols-5' : 'grid-cols-4'
        } items-center h-16`}
      >
        <button
          onClick={() => setActiveTab('home')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer relative ${
            activeTab === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Dashboard"
        >
          {activeTab === 'home' && (
            <span className="absolute top-1 w-6 h-0.5 rounded-full bg-indigo-600 animate-in fade-in duration-200" />
          )}
          <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer relative ${
            activeTab === 'feed' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Feed"
        >
          {activeTab === 'feed' && (
            <span className="absolute top-1 w-6 h-0.5 rounded-full bg-indigo-600 animate-in fade-in duration-200" />
          )}
          <Newspaper className={`w-5 h-5 transition-transform ${activeTab === 'feed' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer relative ${
            activeTab === 'members' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Members"
        >
          {activeTab === 'members' && (
            <span className="absolute top-1 w-6 h-0.5 rounded-full bg-indigo-600 animate-in fade-in duration-200" />
          )}
          <Users className={`w-5 h-5 transition-transform ${activeTab === 'members' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Members</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer relative ${
            activeTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Profile"
        >
          {activeTab === 'profile' && (
            <span className="absolute top-1 w-6 h-0.5 rounded-full bg-indigo-600 animate-in fade-in duration-200" />
          )}
          <User className={`w-5 h-5 transition-transform ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
        </button>

        {currentUser.isOfficer && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer relative ${
              activeTab === 'admin' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
            aria-label="Admin Hub"
          >
            {activeTab === 'admin' && (
              <span className="absolute top-1 w-6 h-0.5 rounded-full bg-indigo-600 animate-in fade-in duration-200" />
            )}
            <ShieldAlert className={`w-5 h-5 transition-transform ${activeTab === 'admin' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
};

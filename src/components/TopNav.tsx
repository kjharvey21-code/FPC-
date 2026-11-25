import React from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, ShieldAlert, Award } from 'lucide-react';
import { getRankTierForPks } from '../data/pksFramework';
import { NotificationCenter } from './notifications/NotificationCenter';

export const TopNav: React.FC = () => {
  const { currentUser, logout, activeTab, setActiveTab, systemSettings, getMemberPks, getMemberRank, isFirestoreLive } = useApp();

  if (!currentUser) return null;

  const totalPks = getMemberPks(currentUser.id);
  const rank = getMemberRank(currentUser.id);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <img
              src={systemSettings.logoUrl}
              alt="FPC Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <button
            onClick={() => setActiveTab('home')}
            className="text-left font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-base sm:text-lg">{systemSettings.appName}</span>
            <span className="text-xs text-indigo-600 font-medium hidden sm:inline">· First Peek</span>
            {isFirestoreLive && (
              <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden lg:inline">Live Sync</span>
              </span>
            )}
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links (4 clean single-line links) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('home')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer py-1 ${
              activeTab === 'home' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer py-1 ${
              activeTab === 'feed' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer py-1 ${
              activeTab === 'members' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 cursor-pointer py-1 ${
              activeTab === 'profile' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
            }`}
          >
            Profile
          </button>

          {/* Admin tab is strictly visible ONLY to elevated roles */}
          {currentUser.isOfficer && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-indigo-700 cursor-pointer py-1 flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                  : 'text-indigo-600/90 hover:text-indigo-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Hub</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action / User Lockup */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-time Push Notifications Bell */}
          <NotificationCenter />

          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-left transition-colors cursor-pointer group"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.nickname}
              className="w-7 h-7 rounded-lg object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors leading-none truncate max-w-[100px]">
                {currentUser.nickname}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-none mt-1 flex items-center gap-1">
                <Award className="w-2.5 h-2.5 text-indigo-500" />
                <span>
                  <strong className="text-indigo-600">{totalPks} PKS</strong> · {rank.name}
                  {currentUser.officerRole && currentUser.officerRole !== 'None'
                    ? ` · ${currentUser.officerRole}`
                    : currentUser.projectHeadRoles && currentUser.projectHeadRoles.length > 0
                    ? ` · Project Head`
                    : ''}
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => logout()}
            title="Log Out of FPC Hub"
            className="px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            aria-label="Log Out of FPC Hub"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

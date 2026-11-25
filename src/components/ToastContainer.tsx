import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-xl transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-700/60 text-rose-100'
              : toast.type === 'info'
              ? 'bg-sky-950/90 border-sky-700/60 text-sky-100'
              : 'bg-slate-900/95 border-amber-500/40 text-slate-100'
          }`}
        >
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}

          <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">{toast.message}</div>

          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-white shrink-0 p-1 -mr-1 -mt-1 rounded-lg"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

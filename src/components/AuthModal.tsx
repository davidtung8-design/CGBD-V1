import React, { useState, useEffect } from 'react';
import { Lock, User, X, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  showToast: (msg: string) => void;
  user: any;
  onLogout: () => void;
}

export function AuthModal({ isOpen, onClose, isDarkMode, showToast, user, onLogout }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      showToast("Google 登录成功");
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        showToast("未启用 Google 登录");
      } else if (error.code === 'auth/popup-closed-by-user') {
        showToast("登录窗口已关闭");
      } else {
        showToast(`Google 登录失败: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border relative overflow-hidden text-center",
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="flex justify-end mb-4">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="mb-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500/30">
                  <User size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-500">已登录 (Authenticated)</h2>
                <p className="text-sm text-slate-500 mt-2 font-mono">{user.email}</p>
                {user.displayName && <p className="text-lg font-bold mt-1">{user.displayName}</p>}
              </div>

              <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800 mb-8">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Cloud Sync Information</p>
                <p className="text-xs mt-2 opacity-80">
                  您的数据现在已经与云端实时同步。所有更改都将自动保存到此账户。
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
                >
                  继续使用 (Continue Using)
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  退出登录 (Logout)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border relative overflow-hidden",
              isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            )}
          >
            <div className="flex justify-end mb-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800/10 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <Lock size={32} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-center">
                身份验证
              </h2>
              <p className="text-xs mt-2 uppercase tracking-widest font-medium opacity-60 text-center mb-10">
                请登录以同步您的云端数据
              </p>
            </div>

            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className={cn(
                "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 border transition-all active:scale-[0.98] shadow-lg",
                isDarkMode ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white shadow-black/40" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900 shadow-slate-200/50"
              )}
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              <span className="text-lg">使用 Google 登录</span>
            </button>

            <p className="mt-8 text-[10px] text-center text-slate-500 uppercase tracking-widest leading-relaxed">
              登录即表示您同意自动将本地数据<br/>与您的私有云端数据库同步
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

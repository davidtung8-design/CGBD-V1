import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, X, Loader2, ArrowRight, AlertCircle, ExternalLink } from 'lucide-react';
import { loginWithEmail, registerWithEmail, signInWithGoogle } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  showToast: (msg: string) => void;
}

export function AuthModal({ isOpen, onClose, isDarkMode, showToast }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    const isSafariUA = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const inIframe = window.self !== window.top;
    setIsSafari(isSafariUA);
    setIsIframe(inIframe);
    
    // Test if Firebase is available
    console.log("Firebase Auth status:", !!loginWithEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Direct visual feedback for mobile users
    alert("正在尝试连接身份验证服务器...\n(Connecting to server...)");
    console.log("Submitting auth form...", { email, isLogin });
    setIsLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        showToast("登录成功 (Login Success)");
      } else {
        await registerWithEmail(email, password, name || 'User');
        showToast("注册成功 (Registration Success)");
      }
      onClose();
    } catch (error: any) {
      console.error("Auth Error Detail:", error);
      const msg = error.code === 'auth/user-not-found' ? '用户不存在' :
                  error.code === 'auth/wrong-password' ? '密码错误' :
                  error.code === 'auth/network-request-failed' ? '网络请求被拦截 (Safari 隐私限制)' :
                  error.message;
      alert(`登录失败: ${msg}\n错误代码: ${error.code}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      showToast("Google 登录成功");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {isLogin ? "欢迎回来" : "创建账户"}
                </h2>
                <p className={cn("text-xs mt-1 uppercase tracking-widest font-medium opacity-60")}>
                  {isLogin ? "登录您的数字矩形账户" : "开启您的时间管理之旅"}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800/10 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="您的姓名"
                    className={cn(
                      "w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all",
                      isDarkMode ? "bg-slate-900 border-slate-800 focus:border-blue-500 text-white" : "bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900"
                    )}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  required
                  placeholder="电子邮箱"
                  className={cn(
                    "w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all",
                    isDarkMode ? "bg-slate-900 border-slate-800 focus:border-blue-500 text-white" : "bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900"
                  )}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  required
                  placeholder="密码"
                  className={cn(
                    "w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all",
                    isDarkMode ? "bg-slate-900 border-slate-800 focus:border-blue-500 text-white" : "bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900"
                  )}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className={cn(
                "p-3 rounded-xl border mb-2",
                isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
              )}>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                  <AlertCircle size={10} /> 故障排除提示 / Troubleshooting
                </p>
                <p className="text-[10px] leading-relaxed opacity-80">
                  如果您无法“点击登录”或无反应，通常是 Safari 拦截了认证。
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {isLogin ? "点击登录" : "立即注册"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-slate-800" />
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">或者</span>
              <div className="h-[1px] flex-1 bg-slate-800" />
            </div>

            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className={cn(
                "w-full mt-4 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border transition-all active:scale-[0.98]",
                isDarkMode ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900"
              )}
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              使用 Google 登录
            </button>

            {(isSafari || isIframe) && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="w-full mt-4 py-4 bg-orange-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all"
              >
                <ExternalLink size={18} />
                在独立 Safari 中打开 (解决登录无反应)
              </a>
            )}

            <div className="mt-8 text-center text-xs">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-500 hover:text-blue-500 transition-colors"
              >
                {isLogin ? "没有账户？立即注册" : "已有账户？点击登录"}
              </button>
            </div>

            {isSafari && (
              <div className={cn(
                "mt-6 p-4 rounded-xl border flex flex-col gap-2",
                isDarkMode ? "bg-amber-500/10 border-amber-500/20 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800"
              )}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">iOS Safari 安全策略</span>
                </div>
                <div className="space-y-2 opacity-80 text-[9px] leading-tight">
                  <p>Safari 拦截了第三方 Cookie 导致无法认证。请点击上方的 **“在 Safari 中重新打开”** 按钮。</p>
                  <p>如果仍然失败，请在右上角 **Sync ID** 处直接输入文字作为 ID 存取（无需登录）。</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

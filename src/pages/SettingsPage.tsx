import React from 'react';
import { ThemeKey, ThemeConfig } from '../types';
import { THEMES } from '../constants';
import { cn } from '../lib/utils';
import { Moon, Trash2, Phone, Github, Award, History, Zap, Plus, Minus } from 'lucide-react';
import { DTIcon } from '../components/DTIcon';
import { motion } from 'motion/react';

interface SettingsPageProps {
  themeKey: ThemeKey;
  setThemeKey: (key: ThemeKey) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  ambientSound: boolean;
  setAmbientSound: (val: boolean) => void;
  selectedSound: 'rain' | 'zen' | 'ocean' | 'lofi';
  setSelectedSound: (val: 'rain' | 'zen' | 'ocean' | 'lofi') => void;
  onStartFocusTimer: (mins: number) => void;
  isFocusTimerRunning: boolean;
  focusTime: number;
  formatFocusTime: (secs: number) => string;
  targetMins: number;
  setTargetMins: (mins: number) => void;
  onToggleTimer: () => void;
  onOpenLargeTimer: () => void;
  backups: { id: string, timestamp: any, label: string }[];
  onCreateBackup: () => void;
  onRestoreBackup: (id: string) => void;
  onClearData: () => void;
  setHasInteracted: (val: boolean) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  themeKey, setThemeKey, isDarkMode, setIsDarkMode, 
  isFocusMode, setIsFocusMode, ambientSound, setAmbientSound,
  selectedSound, setSelectedSound,
  onStartFocusTimer, isFocusTimerRunning, focusTime, formatFocusTime,
  targetMins, setTargetMins, onToggleTimer, onOpenLargeTimer,
  backups, onCreateBackup, onRestoreBackup,
  onClearData,
  setHasInteracted
}) => {
  return (
    <div className="animate-fadeIn space-y-6">
      {/* Profile Bento Card */}
      <div className="bento-card p-10 overflow-hidden relative group">
        <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <DTIcon theme={THEMES[themeKey]} size={300} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white to-slate-400 p-0.5 shadow-2xl mb-6">
             <div className="w-full h-full rounded-[1.9rem] bg-slate-900 flex items-center justify-center text-3xl">
               👨‍💻
             </div>
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight text-white">时间管理大师</h2>
          <div className="mt-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
            Elite Strategist & Performance Mentor
          </div>
          
          <p className="mt-6 text-sm text-slate-500 italic font-medium max-w-md">
            "Success attracts success. Operational excellence is not an act, but a habit of the super-transcendent manager."
          </p>

          <div className="mt-10 grid grid-cols-3 gap-8 w-full max-w-sm">
             {[
               { val: '450K', label: 'GSPC Focus' },
               { val: '10', label: 'Elite Recruits' },
               { val: '512', label: 'Nodes of Insight' }
             ].map((s, i) => (
               <div key={i} className="text-center group/stat">
                 <div className="text-xl font-mono font-bold text-white group-hover/stat:text-blue-400 transition-colors">{s.val}</div>
                 <div className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Theme Matrix */}
        <div className="bento-card p-8">
          <div className="flex items-center gap-2 mb-8">
            <Award size={16} className="text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Atmosphere Modules</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
              const t = THEMES[key];
              return (
                <button 
                  key={key}
                  onClick={() => {
                    setThemeKey(key);
                    setHasInteracted(true);
                  }}
                  className={cn(
                    "group relative aspect-square rounded-2xl border-2 transition-all hover:scale-105 active:scale-95",
                    themeKey === key ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "border-slate-800"
                  )}
                  style={{ background: `linear-gradient(135deg, ${t.bg}, ${t.accent})` }}
                >
                  {themeKey === key && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px] rounded-xl">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-4 pt-8 border-t border-slate-800/50">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-[1.5rem] border border-slate-800">
                <div className="flex items-center gap-3">
                   <div className={cn("p-2 rounded-xl transition-colors", isFocusMode ? "bg-white text-slate-950" : "bg-slate-800 text-slate-500")}>
                      <Zap size={14} />
                   </div>
                   <div>
                      <span className="block text-[10px] font-bold text-white uppercase tracking-widest">Focus Protocol</span>
                      <span className="block text-[8px] text-slate-500 uppercase">Visual noise reduction</span>
                   </div>
                </div>
                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={cn("w-8 h-4 rounded-full relative transition-colors", isFocusMode ? "bg-white" : "bg-slate-700")}
                >
                  <div className={cn("absolute top-0.5 w-3 h-3 bg-slate-900 rounded-full transition-all", isFocusMode ? "right-0.5" : "left-0.5")} />
                </button>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-[1.5rem] border border-slate-800">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl transition-colors shadow-lg", isFocusTimerRunning ? "bg-cyan-500 text-slate-950 shadow-cyan-500/20" : "bg-slate-800 text-slate-500")}>
                        <Zap size={14} />
                      </div>
                      <div 
                        className={cn(isFocusTimerRunning && "cursor-pointer group")}
                        onClick={() => isFocusTimerRunning && onOpenLargeTimer()}
                      >
                        <span className="block text-[10px] font-bold text-white uppercase tracking-widest">Focus Count (倒数)</span>
                        <span className="block text-[8px] text-slate-500 uppercase font-mono">
                          {isFocusTimerRunning ? (
                            <span className="text-cyan-400 font-bold group-hover:text-cyan-300">Active: {formatFocusTime(focusTime)} (Tap to Flux)</span>
                          ) : 'Initiate Deep Focus State'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isFocusTimerRunning && (
                        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                          <button onClick={() => setTargetMins(Math.max(1, targetMins - 5))} className="p-1 text-slate-500 hover:text-white"><Minus size={10} /></button>
                          <span className="text-[10px] font-mono font-bold text-white min-w-[30px] text-center">{targetMins}m</span>
                          <button onClick={() => setTargetMins(Math.min(240, targetMins + 5))} className="p-1 text-slate-500 hover:text-white"><Plus size={10} /></button>
                        </div>
                      )}
                      <button 
                        onClick={onToggleTimer}
                        className={cn(
                          "px-4 py-1 text-[9px] font-black uppercase rounded-lg shadow-lg transition-all active:scale-95",
                          isFocusTimerRunning ? "bg-red-500 text-white shadow-red-500/20" : "bg-cyan-500 text-slate-950 shadow-cyan-500/20"
                        )}
                      >
                        {isFocusTimerRunning ? 'Abort' : 'Focus'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-[1.5rem] border border-slate-800">
                <div className="flex flex-col gap-4">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={cn("p-2 rounded-xl transition-colors", ambientSound ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500")}>
                            <Phone size={14} />
                         </div>
                         <div>
                            <span className="block text-[10px] font-bold text-white uppercase tracking-widest">Ambient Sound Node</span>
                            <span className="block text-[8px] text-slate-500 uppercase">Strategic audio mask</span>
                         </div>
                      </div>
                      <button 
                        onClick={() => setAmbientSound(!ambientSound)}
                        className={cn("w-8 h-4 rounded-full relative transition-colors", ambientSound ? "bg-emerald-600" : "bg-slate-700")}
                      >
                        <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", ambientSound ? "right-0.5" : "left-0.5")} />
                      </button>
                   </div>
                   
                   {ambientSound && (
                     <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                        {([
                          { id: 'zen', label: 'Zen Resonance' },
                          { id: 'rain', label: 'Atmospheric Rain' },
                          { id: 'ocean', label: 'Oceanic Drift' },
                          { id: 'lofi', label: 'Flux Mind Lofi' }
                        ] as const).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedSound(s.id);
                              setAmbientSound(true);
                              setHasInteracted(true);
                            }}
                            className={cn(
                              "px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all",
                              selectedSound === s.id 
                                ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400" 
                                : "bg-slate-800 border border-transparent text-slate-500 hover:text-slate-300"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Backup & Restore Matrix */}
        <div className="bento-card p-10 bg-slate-950">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <History size={16} className="text-white" />
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Strategic Backup Sync</h3>
              </div>
              <button 
                onClick={onCreateBackup}
                className="px-3 py-1 bg-white text-slate-950 text-[9px] font-bold uppercase rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1"
              >
                <Plus size={12} /> Create Node
              </button>
           </div>
           
           <div className="space-y-4">
             <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Restore system state to a previous node anchor:</p>
             
             {backups.length > 0 ? backups.map((b) => (
               <button 
                 key={b.id}
                 onClick={() => {
                    const confirmRestore = window.confirm(`Restore to [${b.label}]? Current session data will be overwritten.`);
                    if (confirmRestore) {
                       onRestoreBackup(b.id);
                    }
                 }}
                 className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left flex justify-between items-center group"
               >
                 <div className="flex-1">
                   <h4 className="text-[12px] font-bold text-white uppercase tracking-[0.2em] mb-1 group-hover:text-blue-400 transition-colors">
                     {b.label}
                   </h4>
                   <p className="text-[9px] text-slate-500 uppercase">Strategic Node Archive</p>
                 </div>
                 <div className="p-2 bg-slate-900 rounded-xl text-slate-600 group-hover:text-blue-500 transition-colors ml-4">
                   <History size={16} />
                 </div>
               </button>
             )) : (
               <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl">
                 <p className="text-[10px] text-slate-600 uppercase tracking-widest">No Cloud Nodes Detected</p>
                 <p className="text-[8px] text-slate-700 uppercase mt-1">Login to sync strategic backups</p>
               </div>
             )}
           </div>
        </div>

        {/* Global Configs */}
        <div className="bento-card p-2 flex flex-col justify-center divide-y divide-slate-800/50">
           <div 
             className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors"
             onClick={() => setIsDarkMode(!isDarkMode)}
           >
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-slate-800 rounded-xl text-slate-400"><Moon size={16} /></div>
                 <div>
                   <span className="block text-[11px] font-bold text-white uppercase tracking-wider">Dark Protocol</span>
                   <span className="block text-[9px] text-slate-500 uppercase">{isDarkMode ? 'Night Mode Active' : 'Day Mode Active'}</span>
                 </div>
              </div>
              <div className={cn(
                "w-10 h-5 rounded-full flex items-center px-1 shadow-inner relative transition-colors duration-300",
                isDarkMode ? "bg-blue-600" : "bg-slate-300"
              )}>
                 <motion.div 
                   animate={{ x: isDarkMode ? 20 : 0 }}
                   className="w-3.5 h-3.5 bg-white rounded-full shadow-lg" 
                 />
              </div>
           </div>

           <button 
              onClick={() => {
                const verify = prompt('警告：此操作将永久抹除所有战略数据。如需执行，请在此输入 "RESET":');
                if (verify === 'RESET') {
                  onClearData();
                } else if (verify !== null) {
                  alert('验证失败，操作已中止。数据安全。');
                }
              }}
              className="flex w-full items-center justify-between p-6 hover:bg-red-500/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-red-500/10 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all"><Trash2 size={16} /></div>
                 <div className="text-left">
                   <span className="block text-[11px] font-bold text-red-500 uppercase tracking-wider">Wipe All Memory</span>
                   <span className="block text-[9px] text-slate-500 uppercase italic">Irreversible system reset</span>
                 </div>
              </div>
              <History size={14} className="text-slate-800" />
           </button>

           <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-slate-800 rounded-xl text-slate-400 font-bold text-[10px]">v2</div>
                 <div>
                   <span className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">Kernel Version</span>
                   <span className="block text-[9px] text-slate-600 uppercase">2.1.0-ELITE · PROD</span>
                 </div>
              </div>
           </div>

           <a 
              href="https://wa.me/60162946245" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-between p-6 hover:bg-emerald-500/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all"><Phone size={16} /></div>
                 <div>
                   <span className="block text-[11px] font-bold text-emerald-500 uppercase tracking-wider">David Tung apps 开发者</span>
                   <span className="block text-[9px] text-slate-500 uppercase">WhatsApp Protocol</span>
                 </div>
              </div>
              <Github size={14} className="text-slate-800" />
           </a>
        </div>
      </div>

      <div className="mt-12 text-center pb-12">
         <p className="text-[9px] text-slate-600 opacity-60 uppercase tracking-[0.4em] leading-loose">
            © 2026 david tung · performance intelligence matrix<br/>
            architecting the super-transcendent elite
         </p>
      </div>
    </div>
  );
};

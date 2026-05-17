import React from 'react';
import { PerfData, ThemeConfig } from '../types';
import { formatNumber, cn } from '../lib/utils';
import { format } from 'date-fns';
import { Target, Users, Zap, Shield, Award, Edit3, Trash2, History, CloudRain, Moon, Waves, Coffee, VolumeX, X, Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface PerformancePageProps {
  perfData: PerfData;
  setPerfData: React.Dispatch<React.SetStateAction<PerfData>>;
  theme: ThemeConfig;
  isFocusTimerRunning: boolean;
  focusTime: number;
  targetMins: number;
  setTargetMins: React.Dispatch<React.SetStateAction<number>>;
  toggleFocusedTimer: () => void;
  setIsLargeTimerOpen: (open: boolean) => void;
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ 
  perfData, 
  setPerfData, 
  theme,
  isFocusTimerRunning,
  focusTime,
  targetMins,
  setTargetMins,
  toggleFocusedTimer,
  setIsLargeTimerOpen
}) => {
  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalActualQFYLP = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.actual || 0), 0);
  const totalNOC = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.noc || 0), 0);
  const totalRecruit = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.recruitActual || 0), 0);
  const totalFYC = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.fyc || 0), 0);

  const personalPct = Math.min(100, Math.floor((totalActualQFYLP / (perfData.annualTargetGSPC || 1)) * 100));
  const fycPct = Math.min(100, Math.floor((totalFYC / (perfData.annualTargetFYC || 1)) * 100));
  const teamPct = Math.min(100, Math.floor((perfData.teamQ / 300000) * 100));
  const recruitPct = Math.min(100, Math.floor((totalRecruit / (perfData.annualTargetTeam || 1)) * 100));

  const stats = [
    { label: '核心 ANP (QFYLP)', value: totalActualQFYLP, total: perfData.annualTargetGSPC, icon: <Target size={18} /> },
    { label: '成交件数 (NOC Nodes)', value: totalNOC, icon: <Shield size={18} /> },
    { label: '招募战将 (Recruits)', value: totalRecruit, total: perfData.annualTargetTeam, icon: <Zap size={18} /> },
    { label: 'FYC Commission', value: totalFYC, total: perfData.annualTargetFYC, icon: <Award size={18} /> },
    { label: '团队整体业绩', value: perfData.teamQ, total: 300000, icon: <Users size={18} /> },
  ];

  const salesMilestones = perfData.milestones.filter(m => m.category === 'sales');
  const recruitMilestones = perfData.milestones.filter(m => m.category === 'recruit');

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Focus & Ambient Controls (Moved from Home) */}
      <div className="bento-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-white" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Focus Timer</h3>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {isFocusTimerRunning ? (
            <div 
              onClick={() => setIsLargeTimerOpen(true)}
              className="flex-1 md:w-48 flex items-center justify-between bg-cyan-400/5 rounded-xl p-4 border border-cyan-400/20 cursor-pointer hover:bg-cyan-400/10 transition-all group shadow-[0_0_20px_rgba(34,211,238,0.1)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                <span className="text-xl font-mono font-black text-cyan-400 tracking-tighter tabular-nums">
                  {formatFocusTime(focusTime)}
                </span>
              </div>
              <span className="text-[8px] font-bold text-cyan-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Flux Mode
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-slate-800/20 rounded-xl p-1.5 border border-slate-800/40">
              <button 
                onClick={() => setTargetMins(prev => Math.max(1, prev - 5))}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                title="Decrease time"
              >
                <Minus size={16} /> 
              </button>
              <span className="text-sm font-mono font-bold text-slate-200 min-w-[80px] text-center uppercase tracking-widest">{targetMins} mins</span>
              <button 
                onClick={() => setTargetMins(prev => Math.min(240, prev + 5))}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                title="Increase time"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
          
          <button 
            onClick={toggleFocusedTimer}
            className={cn(
              "w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95",
              isFocusTimerRunning 
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600" 
                : "bg-white text-slate-950 shadow-lg shadow-white/20 hover:bg-slate-200"
            )}
          >
            {isFocusTimerRunning ? <X size={16} /> : <Zap size={16} fill="currentColor" />}
            {isFocusTimerRunning ? 'Terminate' : 'Deploy Focus'}
          </button>
        </div>
      </div>

      {/* Header Cards (Bento Style) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {stats.map((stat, i) => {
          const isWide = i === 0 || i === 4;
          
          return (
            <div key={i} className={cn(
              "bento-card p-6 flex flex-col justify-between group",
              isWide ? "md:col-span-2 lg:col-span-1 xl:col-span-1" : "md:col-span-1"
            )}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className="p-2 bg-slate-800 rounded-xl text-white group-hover:bg-white group-hover:text-slate-900 transition-all">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <input 
                    type="number"
                    className="text-3xl font-mono text-white bg-transparent border-none outline-none w-full p-0"
                    value={stat.value}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const currentMonthName = format(new Date(), 'M月', { locale: undefined });
                      
                      // For Team Q, we still update it directly as it's not in the monthly records
                      if (stat.label.includes('团队')) {
                        setPerfData(prev => ({ ...prev, teamQ: val }));
                        return;
                      }

                      setPerfData(prev => {
                        const newMonthly = prev.monthlyRecords.map(m => {
                          if (m.month === currentMonthName) {
                            if (stat.label.includes('ANP')) {
                              const otherSum = prev.monthlyRecords.filter(om => om.month !== currentMonthName).reduce((s, om) => s + (om.anp || 0), 0);
                              return { ...m, anp: val - otherSum };
                            }
                            if (stat.label.includes('招募')) {
                              const otherSum = prev.monthlyRecords.filter(om => om.month !== currentMonthName).reduce((s, om) => s + (om.recruitActual || 0), 0);
                              return { ...m, recruitActual: Math.floor(val - otherSum) };
                            }
                            if (stat.label.includes('NOC')) {
                              const otherSum = prev.monthlyRecords.filter(om => om.month !== currentMonthName).reduce((s, om) => s + (om.noc || 0), 0);
                              return { ...m, noc: Math.floor(val - otherSum) };
                            }
                            if (stat.label.includes('FYC')) {
                              const otherSum = prev.monthlyRecords.filter(om => om.month !== currentMonthName).reduce((s, om) => s + (om.fyc || 0), 0);
                              return { ...m, fyc: val - otherSum };
                            }
                          }
                          return m;
                        });
                        return { ...prev, monthlyRecords: newMonthly };
                      });
                    }}
                  />
                  {stat.total && (
                    <div className="flex items-center text-xs text-slate-600 whitespace-nowrap">
                      <span>/</span>
                      <input 
                        type="number"
                        className="w-24 bg-transparent border-none outline-none p-0 ml-1 text-slate-600 font-mono focus:text-white"
                        value={stat.total}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (stat.label.includes('ANP')) setPerfData(prev => ({ ...prev, annualTargetGSPC: val }));
                          if (stat.label.includes('招募')) setPerfData(prev => ({ ...prev, annualTargetTeam: val }));
                          if (stat.label.includes('FYC')) setPerfData(prev => ({ ...prev, annualTargetFYC: val }));
                        }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-500 uppercase mt-2 tracking-tighter">Real-time Performance Node</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Sync Grid */}
      <div className="grid gap-4 md:grid-cols-12">
        <div className="bento-card md:col-span-12 p-8 overflow-hidden relative">
          <div className="flex items-center gap-2 mb-8">
            <Award size={18} className="text-white" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Core Progress Synthesis</h3>
          </div>
          
          <div className="space-y-8">
            {[
              { label: 'Core ANP Achievement', current: personalPct },
              { label: 'FYC Commission Flow', current: fycPct },
              { label: 'Team Coverage Matrix', current: teamPct },
              { label: 'Recruitment Flow Velocity', current: recruitPct }
            ].map((p, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <span>{p.label}</span>
                  <span className="font-mono text-white">{p.current}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.current}%` }}
                    transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                    className="h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_var(--accent-color)]"
                    style={{ backgroundColor: theme.accent, opacity: 1 - (idx * 0.2) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Matrix Table */}
      <div className="bento-card p-8">
        <div className="flex items-center gap-2 mb-6">
          <History size={18} className="text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Performance Matrix · monthly Logs</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-slate-500 uppercase tracking-tighter border-b border-slate-800">
                <th className="p-4 font-bold">Month Unit</th>
                <th className="p-4 font-bold text-center">TARGET QFYLP</th>
                <th className="p-4 font-bold text-center">ACTUAL QFYLP</th>
                <th className="p-4 font-bold text-center">NOC</th>
                <th className="p-4 font-bold text-center">ANP</th>
                <th className="p-4 font-bold text-center">FYC Commission</th>
                <th className="p-4 font-bold text-center">Recruit Target</th>
                <th className="p-4 font-bold text-center">Recruit Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {perfData.monthlyRecords.map((m, i) => {
                const rows = [];
                rows.push(
                  <tr key={`month-${i}`} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 font-bold text-white uppercase">{m.month}</td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-400 font-mono focus:border-white outline-none"
                        value={m.target}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newRecords = [...perfData.monthlyRecords];
                          newRecords[i].target = val;
                          setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                        }}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-white font-mono focus:border-white outline-none"
                        value={m.actual}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newRecords = [...perfData.monthlyRecords];
                          newRecords[i].actual = val;
                          setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                        }}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-emerald-400 font-mono focus:border-emerald-500 outline-none"
                        value={m.noc}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const newRecords = [...perfData.monthlyRecords];
                          newRecords[i].noc = val;
                          setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                        }}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-white/50 font-mono focus:border-white outline-none"
                        value={m.anp}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newRecords = [...perfData.monthlyRecords];
                          newRecords[i].anp = val;
                          setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                        }}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-white font-mono focus:border-white outline-none"
                        value={m.fyc || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newRecords = [...perfData.monthlyRecords];
                          newRecords[i].fyc = val;
                          setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                        }}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-500 font-mono focus:border-white outline-none"
                        value={m.recruitTarget}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const newRecords = [...perfData.monthlyRecords];
                          newRecords[i].recruitTarget = val;
                          setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                        }}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-amber-500 font-mono focus:border-amber-500 outline-none"
                        value={m.recruitActual}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const newRecords = [...perfData.monthlyRecords];
                          newRecords[i].recruitActual = val;
                          setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                        }}
                      />
                    </td>
                  </tr>
                );

                if ((i + 1) % 3 === 0) {
                  const startIdx = i - 2;
                  const quarterRecords = perfData.monthlyRecords.slice(startIdx, i + 1);
                  const qTarget = quarterRecords.reduce((acc, curr) => acc + curr.target, 0);
                  const qActual = quarterRecords.reduce((acc, curr) => acc + curr.actual, 0);
                  const qNoc = quarterRecords.reduce((acc, curr) => acc + curr.noc, 0);
                  const qAnp = quarterRecords.reduce((acc, curr) => acc + curr.anp, 0);
                  const qFyc = quarterRecords.reduce((acc, curr) => acc + (curr.fyc || 0), 0);
                  const qRecruitTarget = quarterRecords.reduce((acc, curr) => acc + curr.recruitTarget, 0);
                  const qRecruitActual = quarterRecords.reduce((acc, curr) => acc + curr.recruitActual, 0);
                  const qNum = Math.floor((i + 1) / 3);

                  rows.push(
                    <tr key={`q-summary-${qNum}`} className="bg-white/5 font-bold border-y border-white/10">
                      <td className="p-4 text-white uppercase tracking-widest text-[9px]">Q{qNum} STAGE SUMMARY</td>
                      <td className="p-4 text-center font-mono text-slate-400">{formatNumber(qTarget)}</td>
                      <td className="p-4 text-center font-mono text-white">{formatNumber(qActual)}</td>
                      <td className="p-4 text-center font-mono text-emerald-400">{qNoc}</td>
                      <td className="p-4 text-center font-mono text-white/50">{formatNumber(qAnp)}</td>
                      <td className="p-4 text-center font-mono text-white">{formatNumber(qFyc)}</td>
                      <td className="p-4 text-center font-mono text-slate-500">{qRecruitTarget}</td>
                      <td className="p-4 text-center font-mono text-amber-500">{qRecruitActual}</td>
                    </tr>
                  );

                  if (i === 11) {
                    const yTarget = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.target, 0);
                    const yActual = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.actual, 0);
                    const yNoc = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.noc, 0);
                    const yAnp = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.anp, 0);
                    const yFyc = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.fyc || 0), 0);
                    const yRecruitTarget = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.recruitTarget, 0);
                    const yRecruitActual = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.recruitActual, 0);

                    rows.push(
                      <tr key="annual-summary" className="bg-emerald-400/10 font-black border-y-2 border-emerald-400/30">
                        <td className="p-4 text-emerald-400 uppercase tracking-[0.2em] text-[10px]">TOTAL WHOLE YEAR SUMMARY</td>
                        <td className="p-4 text-center font-mono text-slate-400">{formatNumber(yTarget)}</td>
                        <td className="p-4 text-center font-mono text-emerald-400">{formatNumber(yActual)}</td>
                        <td className="p-4 text-center font-mono text-emerald-400">{yNoc}</td>
                        <td className="p-4 text-center font-mono text-emerald-400">{formatNumber(yAnp)}</td>
                        <td className="p-4 text-center font-mono text-white">{formatNumber(yFyc)}</td>
                        <td className="p-4 text-center font-mono text-slate-500">{yRecruitTarget}</td>
                        <td className="p-4 text-center font-mono text-amber-500">{yRecruitActual}</td>
                      </tr>
                    );
                  }
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rewards Sync */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: 'Sales Achievables', data: salesMilestones, icon: <Target size={16} /> },
          { label: 'Recruitment Sync', data: recruitMilestones, icon: <Users size={16} /> }
        ].map((sec, idx) => (
          <div key={idx} className="bento-card p-8">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-800 rounded-xl text-white">{sec.icon}</div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{sec.label}</h3>
               </div>
               <span className="text-xs font-mono text-slate-500">{sec.data.filter(m => m.achieved).length}/{sec.data.length} Nodes</span>
            </div>
            <div className="grid gap-3">
              {sec.data.map((m, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    const milestoneIdx = perfData.milestones.findIndex(prevM => prevM.name === m.name);
                    if (milestoneIdx !== -1) {
                      const newMilestones = [...perfData.milestones];
                      newMilestones[milestoneIdx].achieved = !newMilestones[milestoneIdx].achieved;
                      setPerfData(prev => ({ ...prev, milestones: newMilestones }));
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-2xl p-4 border transition-all cursor-pointer hover:scale-[1.02]",
                    m.achieved ? "bg-white/10 border-white/20 text-white" : "bg-slate-900 border-slate-800 text-slate-600"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">{m.name}</span>
                  <Award size={14} className={m.achieved ? "text-white" : "text-slate-800 opacity-20"} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

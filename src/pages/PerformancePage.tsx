import React, { useMemo } from 'react';
import { PerfData, ThemeConfig } from '../types';
import { formatNumber, cn } from '../lib/utils';
import { format } from 'date-fns';
import { Target, Users, Zap, Shield, Award, Edit3, Trash2, History, CloudRain, Moon, Waves, Coffee, VolumeX, X, Minus, Plus, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
  isDarkMode: boolean;
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
  setIsLargeTimerOpen,
  isDarkMode
}) => {
  const [editingBigCasesIdx, setEditingBigCasesIdx] = React.useState<number | null>(null);

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalActualQFYLP = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.actual || 0), 0);
  const totalNOC = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.noc || 0), 0);
  const totalRecruit = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.recruitActual || 0), 0);
  const totalFYC = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.fyc || 0), 0);
  const totalANP = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.anp || 0), 0);

  const chartData = useMemo(() => {
    return perfData.monthlyRecords.map(m => ({
      name: m.month,
      Target: m.target || 0,
      Actual: m.actual || 0,
    }));
  }, [perfData.monthlyRecords]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const targetVal = payload[0]?.payload?.Target || 0;
      const actualVal = payload[0]?.payload?.Actual || 0;
      const achievementPct = targetVal > 0 ? Math.floor((actualVal / targetVal) * 100) : 0;
      const diff = actualVal - targetVal;

      return (
        <div className="bg-slate-950/95 border border-slate-800 p-4 rounded-2xl backdrop-blur-md shadow-xl text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-8">
              <span className="text-slate-500 font-medium">目标 (Target):</span>
              <span className="font-mono font-bold text-slate-300">RM {formatNumber(targetVal)}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-slate-500 font-medium">实际 (Actual):</span>
              <span className="font-mono font-black" style={{ color: theme.accent }}>RM {formatNumber(actualVal)}</span>
            </div>
            <div className="h-px bg-slate-800/50 my-1.5" />
            <div className="flex items-center justify-between gap-8">
              <span className="text-slate-500 font-medium">达成率 (Rate):</span>
              <span className="font-mono font-bold text-emerald-400">{achievementPct}%</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-slate-500 font-medium">差额 (Diff):</span>
              <span className={`font-mono font-bold ${diff >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                {diff >= 0 ? "+" : ""}RM {formatNumber(diff)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const personalPct = Math.min(100, Math.floor((totalActualQFYLP / (perfData.annualTargetGSPC || 1)) * 100));
  const fycPct = Math.min(100, Math.floor((totalFYC / (perfData.annualTargetFYC || 1)) * 100));
  const teamPct = Math.min(100, Math.floor((perfData.teamQ / 300000) * 100));
  const recruitPct = Math.min(100, Math.floor((totalRecruit / (perfData.annualTargetTeam || 1)) * 100));

  const stats = [
    { label: '核心 ANP (Core ANP)', value: totalANP, total: perfData.annualTargetGSPC, icon: <Target size={18} /> },
    { label: '核心 QFYLP (Core QFYLP)', value: totalActualQFYLP, total: perfData.annualTargetGSPC, icon: <Target size={18} /> },
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, i) => {
          return (
            <div key={i} className="bento-card p-6 flex flex-col justify-between group md:col-span-1">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className="p-2 bg-slate-800 rounded-xl text-white group-hover:bg-white group-hover:text-slate-900 transition-all">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                    <input 
                      type="text"
                      className="text-3xl font-mono text-white bg-transparent border-none outline-none w-full p-0"
                      value={formatNumber(stat.label.includes('FYC') ? Math.round(stat.value * 100) / 100 : stat.value, stat.label.includes('FYC') ? 2 : undefined)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
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
                            if (stat.label.includes('QFYLP')) {
                              const otherSum = prev.monthlyRecords.filter(om => om.month !== currentMonthName).reduce((s, om) => s + (om.actual || 0), 0);
                              return { ...m, actual: val - otherSum };
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
                          if (stat.label.includes('QFYLP')) setPerfData(prev => ({ ...prev, annualTargetGSPC: val }));
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
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
        {/* Core Progress Synthesis */}
        <div className="bento-card lg:col-span-5 p-8 overflow-hidden relative flex flex-col justify-between">
          <div>
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
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + idx * 0.15 }}
                      className="h-full rounded-full shadow-[0_0_20px_var(--accent-color)]"
                      style={{ backgroundColor: theme.accent, opacity: 1 - (idx * 0.2) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Performance Analyzer Chart */}
        <div className="bento-card lg:col-span-7 p-8 overflow-hidden relative flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-white" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">QFYLP Target vs Actual Analyzer</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase font-bold tracking-widest">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-700"></span>
                  <span className="text-slate-500">Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: theme.accent }}></span>
                  <span className="text-slate-300">Actual</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full sm:h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    dy={8}
                    fontFamily="monospace"
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-8}
                    fontFamily="monospace"
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                  <Bar 
                    dataKey="Actual" 
                    fill={theme.accent} 
                    radius={[4, 4, 0, 0]} 
                    barSize={16}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Target" 
                    stroke="#475569" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={{ r: 2, strokeWidth: 1, fill: '#1e293b' }}
                    activeDot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Matrix Table */}
      <div className="bento-card p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Performance Matrix · monthly Logs</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            📊 Sync Active • Customer Production Ledger Standards
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className={cn("text-slate-500 uppercase tracking-tighter border-b", isDarkMode ? "border-slate-800" : "border-slate-200")}>
                <th className="p-4 font-bold">Month Unit</th>
                <th className="p-4 font-bold text-center">TARGET QFYLP</th>
                <th className="p-4 font-bold text-center">ACTUAL QFYLP</th>
                <th className="p-4 font-bold text-center">NOC</th>
                <th className="p-4 font-bold text-center">ANP</th>
                <th className="p-4 font-bold text-center border-emerald-400/20">FYC Commission</th>
                <th className="p-4 font-bold text-center border-amber-400/20 text-amber-500">BIG CASES (&gt;3,750)</th>
                <th className="p-4 font-bold text-center">Recruit Target</th>
                <th className="p-4 font-bold text-center">Recruit Act</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800/30" : "divide-slate-200/50")}>
              {perfData.monthlyRecords.map((m, i) => {
                const rows = [];
                rows.push(
                  <tr key={`month-${i}`} className={cn("transition-colors group", isDarkMode ? "hover:bg-white/[0.02]" : "hover:bg-slate-50")}>
                    <td className={cn("p-4 font-bold uppercase", isDarkMode ? "text-white" : "text-slate-800")}>{m.month}</td>
                    <td className="p-4 text-center">
                      <input 
                        type="text" 
                        className={cn("w-24 border rounded-lg p-2 text-center font-mono outline-none", isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 focus:border-white" : "bg-slate-50 border-slate-200 text-slate-600 focus:border-slate-400")}
                        value={formatNumber(m.target)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                          const newRecords = [...perfData.monthlyRecords];
                          newRecords[i].target = val;
                          setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                        }}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <div className={cn(
                        "w-24 mx-auto border rounded-lg py-1.5 text-center font-mono text-xs font-semibold",
                        isDarkMode 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-emerald-50 border-emerald-250 text-emerald-700"
                      )}>
                        {formatNumber(m.actual)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={cn(
                        "w-16 mx-auto border rounded-lg py-1.5 text-center font-mono text-xs font-semibold",
                        isDarkMode 
                          ? "bg-slate-900/40 border-slate-800/30 text-slate-300" 
                          : "bg-slate-100 border-slate-200 text-slate-700"
                      )}>
                        {m.noc}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={cn(
                        "w-24 mx-auto border rounded-lg py-1.5 text-center font-mono text-xs font-semibold",
                        isDarkMode 
                          ? "bg-slate-900/40 border-slate-800/30 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      )}>
                        {formatNumber(m.anp)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={cn(
                        "w-24 mx-auto border rounded-lg py-1.5 text-center font-mono text-xs font-semibold",
                        isDarkMode 
                          ? "bg-slate-900/40 border-slate-800/30 text-slate-455-custom text-slate-400" 
                          : "bg-slate-50 border-slate-200 p-0 text-slate-700"
                      )}>
                        {formatNumber(m.fyc || 0, 2)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setEditingBigCasesIdx(i)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all min-w-[60px] mx-auto"
                      >
                        <span className="text-[14px] font-black font-mono text-amber-500">{(m.bigCases || []).length}</span>
                        <span className="text-[7px] font-bold text-amber-500/50 uppercase tracking-tighter">Cases Recorded</span>
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        className={cn("w-16 border rounded-lg p-2 text-center font-mono outline-none", isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 focus:border-white" : "bg-slate-50 border-slate-200 text-slate-600 focus:border-slate-400")}
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
                        className={cn("w-16 border rounded-lg p-2 text-center font-mono outline-none focus:border-amber-500", isDarkMode ? "bg-slate-900 border-slate-800 text-amber-500" : "bg-slate-50 border-slate-200 text-amber-600")}
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
                    <tr key={`q-summary-${qNum}`} className={cn("font-bold border-y", isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200")}>
                      <td className={cn("p-4 uppercase tracking-widest text-[9px]", isDarkMode ? "text-white" : "text-slate-800")}>Q{qNum} STAGE SUMMARY</td>
                      <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-slate-400" : "text-slate-500")}>{formatNumber(qTarget)}</td>
                      <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-white" : "text-slate-800")}>{formatNumber(qActual)}</td>
                      <td className="p-4 text-center font-mono text-emerald-500">{qNoc}</td>
                      <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-white/50" : "text-slate-500")}>{formatNumber(qAnp)}</td>
                      <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-white" : "text-slate-800")}>{formatNumber(qFyc, 2)}</td>
                      <td className="p-4 text-center font-mono text-amber-500">{quarterRecords.reduce((acc, curr) => acc + (curr.bigCases?.length || 0), 0)}</td>
                      <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-slate-500" : "text-slate-400")}>{qRecruitTarget}</td>
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
                        <td className={cn("p-4 uppercase tracking-[0.2em] text-[10px]", isDarkMode ? "text-emerald-400" : "text-emerald-700")}>TOTAL WHOLE YEAR SUMMARY</td>
                        <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-slate-400" : "text-slate-500")}>{formatNumber(yTarget)}</td>
                        <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>{formatNumber(yActual)}</td>
                        <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>{yNoc}</td>
                        <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>{formatNumber(yAnp)}</td>
                        <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-white" : "text-slate-800")}>{formatNumber(yFyc, 2)}</td>
                        <td className="p-4 text-center font-mono text-amber-500 font-bold">{perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.bigCases?.length || 0), 0)}</td>
                        <td className={cn("p-4 text-center font-mono", isDarkMode ? "text-slate-500" : "text-slate-400")}>{yRecruitTarget}</td>
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

      {/* Big Cases Modal */}
      {editingBigCasesIdx !== null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-amber-500/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-[0.2em] text-white">
                    {perfData.monthlyRecords[editingBigCasesIdx].month} Big Cases
                  </h3>
                  <p className="text-[10px] text-amber-500/60 uppercase tracking-widest mt-1">Single Case FYC &gt; RM 3,750</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingBigCasesIdx(null)}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-3">
                {perfData.monthlyRecords[editingBigCasesIdx].bigCases?.map((bc, bIdx) => (
                  <div key={bc.id} className="group flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/30 transition-all">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Case ID: {bc.id.slice(0, 8)}</span>
                        <button 
                          onClick={() => {
                            const newRecords = [...perfData.monthlyRecords];
                            newRecords[editingBigCasesIdx].bigCases = (newRecords[editingBigCasesIdx].bigCases || []).filter(c => c.id !== bc.id);
                            setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                          }}
                          className="text-slate-600 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase w-16">Plan:</span>
                          <input 
                            type="text"
                            placeholder="Plan Name"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white outline-none focus:border-amber-500/50"
                            value={bc.name || ''}
                            onChange={(e) => {
                              const newRecords = [...perfData.monthlyRecords];
                              const cases = [...(newRecords[editingBigCasesIdx].bigCases || [])];
                              cases[bIdx] = { ...bc, name: e.target.value };
                              newRecords[editingBigCasesIdx].bigCases = cases;
                              setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase w-16">ANP: RM</span>
                            <input 
                              type="text"
                              className="flex-1 bg-transparent border-none outline-none text-[12px] font-mono font-bold text-slate-300 p-0"
                              value={formatNumber(bc.anp || 0)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                const newRecords = [...perfData.monthlyRecords];
                                const cases = [...(newRecords[editingBigCasesIdx].bigCases || [])];
                                cases[bIdx] = { ...bc, anp: val };
                                newRecords[editingBigCasesIdx].bigCases = cases;
                                setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                              }}
                            />
                          </div>
                          <div className="flex-1 flex items-center gap-2 border-l border-white/10 pl-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">FYC: RM</span>
                            <input 
                              type="text"
                              className="flex-1 bg-transparent border-none outline-none text-[14px] font-mono font-black text-amber-500 p-0"
                              value={formatNumber(bc.fyc || 0, 2)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                const newRecords = [...perfData.monthlyRecords];
                                const cases = [...(newRecords[editingBigCasesIdx].bigCases || [])];
                                cases[bIdx] = { ...bc, fyc: val };
                                newRecords[editingBigCasesIdx].bigCases = cases;
                                setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!perfData.monthlyRecords[editingBigCasesIdx].bigCases || perfData.monthlyRecords[editingBigCasesIdx].bigCases.length === 0) && (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">Zero Big Cases Registered</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  const newRecords = [...perfData.monthlyRecords];
                  const currentCases = newRecords[editingBigCasesIdx].bigCases || [];
                  newRecords[editingBigCasesIdx].bigCases = [
                    ...currentCases,
                    { id: Math.random().toString(36).slice(2, 11), name: '', anp: 0, fyc: 3750 }
                  ];
                  setPerfData(prev => ({ ...prev, monthlyRecords: newRecords }));
                }}
                className="w-full py-4 rounded-2xl bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} fill="currentColor" />
                Register New Big Case
              </button>
            </div>

            <div className="p-8 bg-black/40 border-t border-white/5">
               <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-4">
                  <span className="text-slate-500">Monthly Big Case Total</span>
                  <span className="text-amber-500 font-mono text-lg">RM {
                    formatNumber(perfData.monthlyRecords[editingBigCasesIdx].bigCases?.reduce((sum, c) => sum + c.fyc, 0) || 0, 2)
                  }</span>
               </div>
               <button 
                 onClick={() => setEditingBigCasesIdx(null)}
                 className="w-full py-4 rounded-xl border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
               >
                 Close Manifest
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

import React, { useMemo } from 'react';
import { PerfData, ThemeConfig } from '../types';
import { Target, Users, Zap, Briefcase, MessageSquare, Clipboard, Flame, History, ChevronLeft, ChevronRight, Calculator, Trophy, LayoutGrid } from 'lucide-react';
import { formatNumber, cn } from '../lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, subDays, addDays } from 'date-fns';

interface ActionPage3v6RProps {
  perfData: PerfData;
  setPerfData: React.Dispatch<React.SetStateAction<PerfData>>;
  theme: ThemeConfig;
}

export const ActionPage3v6R: React.FC<ActionPage3v6RProps> = ({ perfData, setPerfData, theme }) => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  
  // Current day activities from log or default
  const dailyActivities = useMemo(() => {
    return perfData.dailyActivitiesLog?.[dateKey] || { of: 0, p: 0, f: 0, c: 0, ro: 0, rp: 0, rf: 0, rs: 0, q: 0, noc: 0, anp: 0 };
  }, [perfData.dailyActivitiesLog, dateKey]);

  const updateActivity = (id: string, val: number) => {
    setPerfData(prev => ({
      ...prev,
      dailyActivitiesLog: {
        ...prev.dailyActivitiesLog,
        [dateKey]: { ...dailyActivities, [id]: val }
      }
    }));
  };

  const salesTotal = dailyActivities.of + dailyActivities.p + dailyActivities.f + dailyActivities.c;
  const recruitTotal = dailyActivities.ro + dailyActivities.rp + dailyActivities.rf + dailyActivities.rs;

  // Aggregation Logic
  const aggregate = (range: 'week' | 'month' | 'year') => {
    let start: Date, end: Date;
    const now = selectedDate;

    if (range === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else if (range === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else {
      start = startOfYear(now);
      end = endOfYear(now);
    }

    const totals = { of: 0, p: 0, f: 0, c: 0, ro: 0, rp: 0, rf: 0, rs: 0, q: 0, noc: 0, anp: 0 };
    Object.entries(perfData.dailyActivitiesLog || {}).forEach(([key, val]) => {
      const d = parseISO(key);
      if (isWithinInterval(d, { start, end })) {
        Object.keys(totals).forEach(k => {
          totals[k as keyof typeof totals] += (val as any)[k] || 0;
        });
      }
    });
    return totals;
  };

  const weekTotals = useMemo(() => aggregate('week'), [perfData.dailyActivitiesLog, selectedDate]);
  const monthTotals = useMemo(() => aggregate('month'), [perfData.dailyActivitiesLog, selectedDate]);
  const yearTotals = useMemo(() => aggregate('year'), [perfData.dailyActivitiesLog, selectedDate]);

  const weeklyBreakdown = useMemo(() => {
    const monday = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(monday, i);
      const key = format(day, 'yyyy-MM-dd');
      const totals = perfData.dailyActivitiesLog?.[key] || { of: 0, p: 0, f: 0, c: 0, ro: 0, rp: 0, rf: 0, rs: 0, q: 0, noc: 0, anp: 0 };
      return { 
        dayName: format(day, 'EEE'), 
        dateStr: format(day, 'MM/dd'),
        fullDate: key,
        totals 
      };
    });
  }, [perfData.dailyActivitiesLog, selectedDate]);

  const yearlyBreakdown = useMemo(() => {
    const year = selectedDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(year, i, 1);
      const end = endOfMonth(start);
      const totals = { of: 0, p: 0, f: 0, c: 0, ro: 0, rp: 0, rf: 0, rs: 0, q: 0, noc: 0, anp: 0 };
      
      Object.entries(perfData.dailyActivitiesLog || {}).forEach(([key, val]) => {
        const d = parseISO(key);
        if (isWithinInterval(d, { start, end })) {
          Object.keys(totals).forEach(k => {
            totals[k as keyof typeof totals] += (val as any)[k] || 0;
          });
        }
      });
      return { month: format(start, 'MMM'), totals };
    });
    return months;
  }, [perfData.dailyActivitiesLog, selectedDate]);

  const monthlyBreakdown = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = [];
    let curr = start;
    while (curr <= end) {
      const key = format(curr, 'yyyy-MM-dd');
      const totals = perfData.dailyActivitiesLog?.[key] || { of: 0, p: 0, f: 0, c: 0, ro: 0, rp: 0, rf: 0, rs: 0, q: 0, noc: 0, anp: 0 };
      days.push({
        dayName: format(curr, 'EEE'),
        dayNum: format(curr, 'dd'),
        fullDate: key,
        totals
      });
      curr = addDays(curr, 1);
    }
    return days;
  }, [perfData.dailyActivitiesLog, selectedDate]);

  const getRangeLabel = (range: 'week' | 'month' | 'year') => {
    const now = selectedDate;
    if (range === 'week') {
      const s = startOfWeek(now, { weekStartsOn: 1 });
      const e = endOfWeek(now, { weekStartsOn: 1 });
      return `${format(s, 'MM/dd')} - ${format(e, 'MM/dd')}`;
    } else if (range === 'month') {
      return format(now, 'MMMM yyyy');
    } else {
      return format(now, 'yyyy');
    }
  };

  const handlePunchIn = () => {
    const dQ = dailyActivities.q || 0;
    const dNOC = dailyActivities.noc || 0;
    setPerfData(prev => ({
      ...prev,
      nightMessage: `🌙 ${format(selectedDate, 'MM/dd')} 打卡完成！\n今日斩获 ${formatNumber(dQ)} QFYLP | 访数 ${salesTotal + recruitTotal} 次`,
    }));
  };

  return (
    <div className="animate-fadeIn space-y-6 pb-20">
      {/* Date Selector */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedDate(prev => subDays(prev, 1))} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{format(selectedDate, 'EEEE')}</div>
            <div className="text-xl font-mono font-bold text-white tracking-tighter">{format(selectedDate, 'MMM dd, yyyy')}</div>
          </div>
          <button onClick={() => setSelectedDate(prev => addDays(prev, 1))} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <ChevronRight size={20} />
          </button>
        </div>
        <button 
          onClick={() => setSelectedDate(new Date())}
          className="px-4 py-2 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded-xl hover:bg-slate-700 transition-colors"
        >
          Jump to Today
        </button>
      </div>

      <div className="bento-grid">
        {/* Daily Mission */}
        <div className="bento-card md:col-span-8 p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Flame size={150} className="text-accent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 text-accent rounded-xl">
                   <Flame size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Daily Combat Mission · 今日作战任务</h3>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Input your high-value target strikes for the day</p>
                </div>
              </div>
              <div className="text-[9px] text-slate-600 font-mono italic">Sector: Tactical Ops</div>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="text-[9px] font-bold text-accent uppercase tracking-widest pl-2 border-l-2 border-accent/30 flex justify-between items-center">
                  <span>Tactical Objectives / 今日作战目标</span>
                </div>
                <textarea 
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-xs font-mono text-white focus:border-accent outline-none min-h-[120px] transition-all"
                  placeholder="1. 见5位准客户&#10;2. 完成2个增员面谈&#10;3. 处理完所有文书工作..."
                  value={perfData.dailyMission}
                  onChange={(e) => setPerfData(prev => ({ ...prev, dailyMission: e.target.value }))}
                />
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="text-[9px] font-bold text-accent uppercase tracking-widest pl-2 border-l-2 border-accent/30">Performance Benchmarks / 业绩基准</div>
                  <input 
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-xs font-mono text-white focus:border-accent outline-none transition-all"
                    placeholder="例如：今日成交 2 份保单 / 拿下 $5000 ANP"
                    value={perfData.dailyGoal}
                    onChange={(e) => setPerfData(prev => ({ ...prev, dailyGoal: e.target.value }))}
                  />
                </div>
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                   <div className="flex justify-between items-center mb-2">
                      <div className="text-[9px] text-accent uppercase font-bold tracking-widest">Velocity Tracking / 推进速率</div>
                      <div className="text-[9px] text-slate-500 font-mono">{dateKey}</div>
                   </div>
                   <div className="flex justify-between items-baseline">
                      <div className="text-3xl font-mono font-bold text-white text-shadow-glow">{formatNumber(salesTotal + recruitTotal)}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-tighter">Total Daily Engagements (活动量总和)</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biological Assets */}
        <div className="bento-card md:col-span-4 p-8 relative overflow-hidden group">
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                  <Zap size={18} />
                </div>
                <div>
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Biological Assets · 生物资产/能量</h3>
                   <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Your Peak Performance Baseline</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest pl-2 border-l-2 border-blue-500/20">Operational Status / 运作状态</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Energy % / 体力', val: perfData.personalEnergy, key: 'personalEnergy' },
                    { label: 'Focus % / 脑力', val: perfData.personalFocus, key: 'personalFocus' }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                       <span className="text-[9px] text-slate-500 uppercase font-mono">{stat.label}</span>
                       <input 
                         type="number"
                         max="100"
                         min="0"
                         className="w-full bg-slate-900/30 border border-slate-800 rounded-xl p-3 text-lg font-mono font-bold text-white outline-none focus:border-blue-500"
                         value={stat.val}
                         onChange={(e) => setPerfData(prev => ({ ...prev, [stat.key]: parseInt(e.target.value) || 0 }))}
                       />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-800">
              <div className="text-[9px] text-slate-500 font-mono italic opacity-60">"Health is the foundation of high-net-worth productivity."</div>
            </div>
          </div>
          <Zap className="absolute -top-10 -right-10 text-blue-500 opacity-5" size={180} />
        </div>

        {/* Activity Log Grid */}
        <div className="bento-card md:col-span-12 p-8 overflow-hidden">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                  <Clipboard size={18} />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">3v6R Activity Log · Point of Entry</h3>
              </div>
              <div className="flex gap-4">
                 <div className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase rounded-full tracking-widest font-mono">Sales: {formatNumber(salesTotal)}</div>
                 <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase rounded-full tracking-widest font-mono">Recruit: {formatNumber(recruitTotal)}</div>
              </div>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
             {[
               { id: 'of', label: 'OPEN', color: 'text-accent', bg: 'bg-accent/5', border: 'border-accent/10' },
               { id: 'p', label: 'PRESE', color: 'text-accent', bg: 'bg-accent/5', border: 'border-accent/10' },
               { id: 'f', label: 'FOLLOW', color: 'text-accent', bg: 'bg-accent/5', border: 'border-accent/10' },
               { id: 'c', label: 'CLOSE', color: 'text-accent', bg: 'bg-accent/5', border: 'border-accent/10' },
               { id: 'ro', label: 'R-OP', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
               { id: 'rp', label: 'R-PR', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
               { id: 'rf', label: 'R-FO', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
               { id: 'rs', label: 'R-SU', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' }
             ].map((act, i) => (
               <div key={i} className={cn("flex flex-col items-center rounded-2xl border p-4 text-center transition-all hover:border-slate-500 group", act.bg, act.border)}>
                 <span className={cn("text-[9px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity", act.color)}>{act.label}</span>
                 <input 
                   type="number"
                   className="mt-2 w-full bg-transparent text-center text-2xl font-mono font-bold text-white outline-none"
                   value={dailyActivities[act.id as keyof typeof dailyActivities] || 0}
                   onChange={(e) => updateActivity(act.id, parseInt(e.target.value) || 0)}
                 />
                 <div className="flex gap-1 mt-3">
                    <button onClick={() => updateActivity(act.id, Math.max(0, (dailyActivities[act.id as keyof typeof dailyActivities] || 0) - 1))} className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 transition-colors">-</button>
                    <button onClick={() => updateActivity(act.id, (dailyActivities[act.id as keyof typeof dailyActivities] || 0) + 1)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 transition-colors">+</button>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Tactical Performance Matrix */}
        <div className="bento-card md:col-span-12 p-8 overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                 <Calculator size={18} />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tactical Performance Matrix · {dateKey}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'QFYLP Captured', key: 'q', color: 'text-accent', sym: 'Q' },
                  { label: 'NOC Count', key: 'noc', color: 'text-white', sym: '#' },
                  { label: 'ANP Value', key: 'anp', color: 'text-accent', sym: '$' }
                ].map((inp, idx) => (
                  <div key={idx} className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] flex flex-col justify-between group hover:border-slate-600 transition-all">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                        {inp.label}
                        <span className="text-slate-800 group-hover:text-slate-600 transition-colors uppercase font-mono">{inp.sym}</span>
                     </label>
                     <input 
                       type="number" 
                       className={cn("w-full bg-transparent text-left text-3xl font-mono font-bold outline-none", inp.color)}
                       value={(dailyActivities as any)[inp.key] || 0} 
                       onChange={(e) => updateActivity(inp.key, parseFloat(e.target.value) || 0)} 
                     />
                  </div>
                ))}
            </div>
        </div>

        {/* Night Cycle Report */}
        <div className="bento-card md:col-span-12 p-8 flex flex-col justify-between relative overflow-hidden group">
           <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                  <History size={18} />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Night Cycle Report · Operational Sync</h3>
              </div>
              
              <div className="space-y-4">
                 <div className="text-[9px] font-bold text-accent uppercase tracking-widest pl-2 border-l-2 border-accent/30">Strategic Insights</div>
                 <p className="text-[11px] text-slate-500 leading-relaxed uppercase tracking-tighter italic opacity-80">"Operational clarity is the precursor to peak performance."</p>
              </div>
           </div>
           
           <div className="space-y-4">
              <button 
                onClick={handlePunchIn}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-black shadow-lg shadow-white/10 active:scale-95 transition-all group"
              >
                <Zap size={18} className="group-hover:fill-black" />
                <span className="uppercase tracking-widest text-[10px]">Execute Night Sync</span>
              </button>

              {perfData.nightMessage && (
                <div className="mt-4 animate-fadeIn rounded-2xl bg-slate-900/50 p-4 text-[10px] font-mono leading-relaxed text-blue-400 border border-blue-500/20 whitespace-pre-wrap">
                  {perfData.nightMessage}
                </div>
              )}
           </div>
           <History className="absolute -bottom-10 -right-10 text-slate-500 opacity-5" size={180} />
        </div>

        {/* AGGREGATION SUMMARIES */}
        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
           {[
             { title: 'Weekly Core Metrics', data: weekTotals, range: getRangeLabel('week') },
             { title: 'Monthly Force Projection', data: monthTotals, range: getRangeLabel('month') },
           ].map((agg, idx) => (
             <div key={idx} className="bento-card p-6 bg-slate-900/40 relative group">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Calculator size={80} className="text-slate-500" />
                </div>
                <div className="relative z-10">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{agg.title}</h4>
                      <span className="text-[9px] text-slate-600 font-mono italic">{agg.range}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      <div className="space-y-4">
                         <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest pl-2 border-l-2 border-blue-500/20">Activities Track</div>
                         {['of', 'p', 'f', 'c'].map(key => (
                            <div key={key} className="flex justify-between items-center px-2">
                               <span className="text-[10px] text-slate-500 uppercase font-mono">{key}</span>
                               <span className="text-xs font-bold text-white font-mono">{agg.data[key as keyof typeof agg.data]}</span>
                            </div>
                         ))}
                         <div className="pt-2 border-t border-slate-800 flex justify-between px-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Activities</span>
                            <span className="text-sm font-bold text-blue-400">{agg.data.of + agg.data.p + agg.data.f + agg.data.c}</span>
                         </div>
                         <div className="flex justify-between px-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Sales (ANP)</span>
                            <span className="text-sm font-bold text-yellow-500">{formatNumber(agg.data.anp)}</span>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest pl-2 border-l-2 border-emerald-500/20">Recruit Sync</div>
                         {['ro', 'rp', 'rf', 'rs'].map(key => (
                            <div key={key} className="flex justify-between items-center px-2">
                               <span className="text-[10px] text-slate-500 uppercase font-mono">{key}</span>
                               <span className="text-xs font-bold text-white font-mono">{agg.data[key as keyof typeof agg.data]}</span>
                            </div>
                         ))}
                         <div className="pt-2 border-t border-slate-800 flex justify-between px-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Total Recruit</span>
                            <span className="text-sm font-bold text-emerald-400">{agg.data.ro + agg.data.rp + agg.data.rf + agg.data.rs}</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* WEEKLY DAILY BREAKDOWN */}
        <div className="md:col-span-12 bento-card p-8 bg-slate-900/40 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Weekly Tactical Matrix</h4>
                    <p className="text-[9px] text-slate-600 font-mono mt-0.5 uppercase">Sector Coverage: {getRangeLabel('week')}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <div className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase rounded-full font-mono">Ops: {weekTotals.of + weekTotals.p + weekTotals.f + weekTotals.c}</div>
                  <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold uppercase rounded-full font-mono">ANP: {formatNumber(weekTotals.anp)}</div>
               </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[9px] text-slate-500 uppercase tracking-widest">
                        <th className="p-3 font-bold">Temporal Coord</th>
                        <th className="p-3 font-bold text-blue-500/80">OF</th>
                        <th className="p-3 font-bold text-blue-500/80">P</th>
                        <th className="p-3 font-bold text-blue-500/80">F</th>
                        <th className="p-3 font-bold text-blue-500/80">C</th>
                        <th className="p-3 font-bold text-blue-400">Total Ops</th>
                        <th className="p-3 font-bold text-yellow-500/80">Net ANP</th>
                        <th className="p-3 font-bold text-emerald-500/80">RO</th>
                        <th className="p-3 font-bold text-emerald-500/80">RP</th>
                        <th className="p-3 font-bold text-emerald-500/80">RF</th>
                        <th className="p-3 font-bold text-emerald-500/80">RS</th>
                        <th className="p-3 font-bold text-emerald-400">Recruit</th>
                     </tr>
                  </thead>
                  <tbody className="text-[10px] font-mono">
                     {weeklyBreakdown.map((d, idx) => {
                        const sT = d.totals.of + d.totals.p + d.totals.f + d.totals.c;
                        const rT = d.totals.ro + d.totals.rp + d.totals.rf + d.totals.rs;
                        const isSelected = d.fullDate === dateKey;
                        return (
                          <tr 
                            key={idx} 
                            onClick={() => setSelectedDate(parseISO(d.fullDate))}
                            className={cn(
                              "border-b border-slate-800/20 hover:bg-white/[0.03] transition-colors cursor-pointer",
                              isSelected && "bg-accent/10"
                            )}>
                             <td className="p-3 font-bold text-slate-400">{d.dayName} {d.dateStr}</td>
                             <td className="p-3 text-slate-600">{d.totals.of}</td>
                             <td className="p-3 text-slate-600">{d.totals.p}</td>
                             <td className="p-3 text-slate-600">{d.totals.f}</td>
                             <td className="p-3 text-slate-600">{d.totals.c}</td>
                             <td className="p-3 font-bold text-blue-400">{sT}</td>
                             <td className="p-3 font-bold text-yellow-400">{formatNumber(d.totals.anp)}</td>
                             <td className="p-3 text-slate-600">{d.totals.ro}</td>
                             <td className="p-3 text-slate-600">{d.totals.rp}</td>
                             <td className="p-3 text-slate-600">{d.totals.rf}</td>
                             <td className="p-3 text-slate-600">{d.totals.rs}</td>
                             <td className="p-3 font-bold text-emerald-400">{rT}</td>
                          </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
        </div>

        {/* MONTHLY DAILY BREAKDOWN */}
        <div className="md:col-span-12 bento-card p-8 bg-slate-900/40 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                    <LayoutGrid size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Monthly Strategic Matrix</h4>
                    <p className="text-[9px] text-slate-600 font-mono mt-0.5 uppercase">Deployment Window: {getRangeLabel('month')}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase rounded-full font-mono">Ops: {monthTotals.of + monthTotals.p + monthTotals.f + monthTotals.c}</div>
                  <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold uppercase rounded-full font-mono">ANP: {formatNumber(monthTotals.anp)}</div>
               </div>
            </div>

            <div className="overflow-x-auto h-[400px] custom-scrollbar">
               <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                     <tr className="text-[9px] text-slate-500 uppercase tracking-widest">
                        <th className="p-3 font-bold">Temporal Coord</th>
                        <th className="p-3 font-bold text-blue-500/80">OF</th>
                        <th className="p-3 font-bold text-blue-500/80">P</th>
                        <th className="p-3 font-bold text-blue-500/80">F</th>
                        <th className="p-3 font-bold text-blue-500/80">C</th>
                        <th className="p-3 font-bold text-blue-400">Total Ops</th>
                        <th className="p-3 font-bold text-yellow-500/80">Net ANP</th>
                        <th className="p-3 font-bold text-emerald-500/80">RO</th>
                        <th className="p-3 font-bold text-emerald-500/80">RP</th>
                        <th className="p-3 font-bold text-emerald-500/80">RF</th>
                        <th className="p-3 font-bold text-emerald-500/80">RS</th>
                        <th className="p-3 font-bold text-emerald-400">Recruit</th>
                     </tr>
                  </thead>
                  <tbody className="text-[10px] font-mono">
                     {monthlyBreakdown.map((d, idx) => {
                        const sT = d.totals.of + d.totals.p + d.totals.f + d.totals.c;
                        const rT = d.totals.ro + d.totals.rp + d.totals.rf + d.totals.rs;
                        const isSelected = d.fullDate === dateKey;
                        return (
                          <tr 
                            key={idx} 
                            onClick={() => setSelectedDate(parseISO(d.fullDate))}
                            className={cn(
                              "border-b border-slate-800/20 hover:bg-white/[0.03] transition-colors cursor-pointer",
                              isSelected && "bg-emerald-500/10"
                            )}>
                             <td className="p-3 font-bold text-slate-400">{d.dayNum}/{format(parseISO(d.fullDate), 'MM')} {d.dayName}</td>
                             <td className="p-3 text-slate-600">{d.totals.of}</td>
                             <td className="p-3 text-slate-600">{d.totals.p}</td>
                             <td className="p-3 text-slate-600">{d.totals.f}</td>
                             <td className="p-3 text-slate-600">{d.totals.c}</td>
                             <td className="p-3 font-bold text-blue-400">{sT}</td>
                             <td className="p-3 font-bold text-yellow-400">{formatNumber(d.totals.anp)}</td>
                             <td className="p-3 text-slate-600">{d.totals.ro}</td>
                             <td className="p-3 text-slate-600">{d.totals.rp}</td>
                             <td className="p-3 text-slate-600">{d.totals.rf}</td>
                             <td className="p-3 text-slate-600">{d.totals.rs}</td>
                             <td className="p-3 font-bold text-emerald-400">{rT}</td>
                          </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
        </div>

        {/* ANNUAL DETAILED MATRIX */}
        <div className="md:col-span-12 bento-card p-8 bg-slate-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Calculator size={150} className="text-slate-500" />
            </div>
            <div className="relative z-10">
               <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                        <Calculator size={18} />
                     </div>
                     <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Annual Strategic Matrix</h4>
                        <p className="text-[9px] text-slate-600 font-mono mt-0.5 uppercase">Annual Command Overview: {selectedDate.getFullYear()}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="flex gap-4 justify-end mt-1">
                       <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[9px] font-bold uppercase rounded-full font-mono">Total ANP: {formatNumber(yearTotals.anp)}</div>
                     </div>
                  </div>
               </div>

               <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-[9px] text-slate-500 uppercase tracking-widest">
                           <th className="p-3 font-bold">Month Coord</th>
                           <th className="p-3 font-bold text-blue-500/80">OF</th>
                           <th className="p-3 font-bold text-blue-500/80">P</th>
                           <th className="p-3 font-bold text-blue-500/80">F</th>
                           <th className="p-3 font-bold text-blue-500/80">C</th>
                           <th className="p-3 font-bold text-blue-400">Activities</th>
                           <th className="p-3 font-bold text-yellow-500/80">Sales (ANP)</th>
                           <th className="p-3 font-bold text-emerald-500/80">RO</th>
                           <th className="p-3 font-bold text-emerald-500/80">RP</th>
                           <th className="p-3 font-bold text-emerald-500/80">RF</th>
                           <th className="p-3 font-bold text-emerald-500/80">RS</th>
                           <th className="p-3 font-bold text-emerald-400">Recruit</th>
                        </tr>
                     </thead>
                     <tbody className="text-[10px] font-mono">
                        {yearlyBreakdown.map((m, idx) => {
                          const sT = m.totals.of + m.totals.p + m.totals.f + m.totals.c;
                          const rT = m.totals.ro + m.totals.rp + m.totals.rf + m.totals.rs;
                          return (
                            <tr key={idx} className={cn(
                              "border-b border-slate-800/20 hover:bg-white/[0.03] transition-colors",
                              m.month === format(selectedDate, 'MMM') && "bg-blue-500/10"
                            )}>
                               <td className="p-3 font-bold text-slate-400">{m.month}</td>
                               <td className="p-3 text-slate-600">{m.totals.of}</td>
                               <td className="p-3 text-slate-600">{m.totals.p}</td>
                               <td className="p-3 text-slate-600">{m.totals.f}</td>
                               <td className="p-3 text-slate-600">{m.totals.c}</td>
                               <td className="p-3 font-bold text-blue-400">{sT}</td>
                               <td className="p-3 font-bold text-yellow-400">{formatNumber(m.totals.anp)}</td>
                               <td className="p-3 text-slate-600">{m.totals.ro}</td>
                               <td className="p-3 text-slate-600">{m.totals.rp}</td>
                               <td className="p-3 text-slate-600">{m.totals.rf}</td>
                               <td className="p-3 text-slate-600">{m.totals.rs}</td>
                               <td className="p-3 font-bold text-emerald-400">{rT}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-800/20 font-bold border-t-2 border-slate-700">
                           <td className="p-4 text-white uppercase text-[9px] tracking-widest">Annual Aggregate</td>
                           <td className="p-4 text-slate-500">{yearTotals.of}</td>
                           <td className="p-4 text-slate-500">{yearTotals.p}</td>
                           <td className="p-4 text-slate-500">{yearTotals.f}</td>
                           <td className="p-4 text-slate-500">{yearTotals.c}</td>
                           <td className="p-4 text-blue-400 text-sm">{yearTotals.of + yearTotals.p + yearTotals.f + yearTotals.c}</td>
                           <td className="p-4 text-yellow-400 text-sm">{formatNumber(yearTotals.anp)}</td>
                           <td className="p-4 text-slate-500">{yearTotals.ro}</td>
                           <td className="p-4 text-slate-500">{yearTotals.rp}</td>
                           <td className="p-4 text-slate-500">{yearTotals.rf}</td>
                           <td className="p-4 text-slate-500">{yearTotals.rs}</td>
                           <td className="p-4 text-emerald-400 text-sm">{yearTotals.ro + yearTotals.rp + yearTotals.rf + yearTotals.rs}</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

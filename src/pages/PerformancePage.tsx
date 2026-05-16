import React from 'react';
import { PerfData, ThemeConfig } from '../types';
import { formatNumber, cn } from '../lib/utils';
import { Target, Users, Zap, Shield, Award, Edit3, Trash2, History } from 'lucide-react';
import { motion } from 'motion/react';

interface PerformancePageProps {
  perfData: PerfData;
  setPerfData: React.Dispatch<React.SetStateAction<PerfData>>;
  theme: ThemeConfig;
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ perfData, setPerfData, theme }) => {
  const personalPct = Math.min(100, Math.floor((perfData.totalANP / (perfData.annualTargetGSPC || 1)) * 100));
  const fycPct = Math.min(100, Math.floor(((perfData.totalFYC || 0) / (perfData.annualTargetFYC || 1)) * 100));
  const teamPct = Math.min(100, Math.floor((perfData.teamQ / 300000) * 100));
  const recruitPct = Math.min(100, Math.floor((perfData.recruitCount / (perfData.annualTargetTeam || 1)) * 100));

  const stats = [
    { label: '核心 ANP (QFYLP)', value: perfData.totalANP, total: perfData.annualTargetGSPC, icon: <Target size={18} /> },
    { label: '成交件数 (NOC Nodes)', value: perfData.totalNOC, icon: <Shield size={18} /> },
    { label: '招募战将 (Recruits)', value: perfData.recruitCount, total: perfData.annualTargetTeam, icon: <Zap size={18} /> },
    { label: 'FYC Commission', value: perfData.totalFYC || 0, total: perfData.annualTargetFYC, icon: <Award size={18} /> },
    { label: '团队整体业绩', value: perfData.teamQ, total: 300000, icon: <Users size={18} /> },
  ];

  const salesMilestones = perfData.milestones.filter(m => m.category === 'sales');
  const recruitMilestones = perfData.milestones.filter(m => m.category === 'recruit');

  return (
    <div className="animate-fadeIn space-y-6">
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
                <div className="p-2 bg-slate-800 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
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
                      if (stat.label.includes('ANP')) setPerfData(prev => ({ ...prev, totalANP: val }));
                      if (stat.label.includes('团队')) setPerfData(prev => ({ ...prev, teamQ: val }));
                      if (stat.label.includes('招募')) setPerfData(prev => ({ ...prev, recruitCount: val }));
                      if (stat.label.includes('NOC')) setPerfData(prev => ({ ...prev, totalNOC: val }));
                      if (stat.label.includes('FYC')) setPerfData(prev => ({ ...prev, totalFYC: val }));
                    }}
                  />
                  {stat.total && (
                    <div className="flex items-center text-xs text-slate-600 whitespace-nowrap">
                      <span>/</span>
                      <input 
                        type="number"
                        className="w-24 bg-transparent border-none outline-none p-0 ml-1 text-slate-600 font-mono focus:text-blue-400"
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
            <Award size={18} className="text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Core Progress Synthesis</h3>
          </div>
          
          <div className="space-y-8">
            {[
              { label: 'Core ANP Achievement', current: personalPct, color: 'bg-blue-500' },
              { label: 'FYC Commission Flow', current: fycPct, color: 'bg-indigo-500' },
              { label: 'Team Coverage Matrix', current: teamPct, color: 'bg-emerald-500' },
              { label: 'Recruitment Flow Velocity', current: recruitPct, color: 'bg-amber-500' }
            ].map((p, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <span>{p.label}</span>
                  <span className={cn("font-mono", idx === 0 ? "text-blue-400" : idx === 1 ? "text-emerald-400" : "text-amber-400")}>{p.current}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.current}%` }}
                    transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                    className={cn("h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.3)]", p.color)} 
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
                <th className="p-4 font-bold text-center">Target Q</th>
                <th className="p-4 font-bold text-center">Actual Q</th>
                <th className="p-4 font-bold text-center">NOC Nodes</th>
                <th className="p-4 font-bold text-center">ANP Fluidity</th>
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
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-400 font-mono focus:border-blue-500 outline-none"
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
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-blue-400 font-mono focus:border-blue-500 outline-none"
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
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-white/50 font-mono focus:border-blue-500 outline-none"
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
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-blue-400 font-mono focus:border-blue-500 outline-none"
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
                    <tr key={`q-summary-${qNum}`} className="bg-blue-500/5 font-bold border-y border-blue-500/20">
                      <td className="p-4 text-blue-500 uppercase tracking-widest text-[9px]">Q{qNum} STAGE SUMMARY</td>
                      <td className="p-4 text-center font-mono text-slate-400">{formatNumber(qTarget)}</td>
                      <td className="p-4 text-center font-mono text-blue-400">{formatNumber(qActual)}</td>
                      <td className="p-4 text-center font-mono text-emerald-400">{qNoc}</td>
                      <td className="p-4 text-center font-mono text-white/50">{formatNumber(qAnp)}</td>
                      <td className="p-4 text-center font-mono text-blue-400">{formatNumber(qFyc)}</td>
                      <td className="p-4 text-center font-mono text-slate-500">{qRecruitTarget}</td>
                      <td className="p-4 text-center font-mono text-amber-500">{qRecruitActual}</td>
                    </tr>
                  );
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
                  <div className="p-2 bg-slate-800 rounded-xl text-blue-500">{sec.icon}</div>
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
                    m.achieved ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-slate-900 border-slate-800 text-slate-600"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">{m.name}</span>
                  <Award size={14} className={m.achieved ? "text-blue-400" : "text-slate-800 opacity-20"} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

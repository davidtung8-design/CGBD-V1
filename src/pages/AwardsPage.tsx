import React, { useMemo } from 'react';
import { PerfData, ThemeConfig } from '../types';
import { Trophy, Target, Star, Award, TrendingUp, ChevronRight, Zap, Flame, Crown, Medal, Users, UserPlus, CheckCircle2 as CheckCircleIcon } from 'lucide-react';
import { formatNumber, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AwardsPageProps {
  perfData: PerfData;
  isDarkMode: boolean;
  theme: ThemeConfig;
}

interface ContestDefinition {
  id: string;
  name: string;
  chineseName: string;
  description: string;
  targetMetric: 'anp' | 'noc' | 'qfylp' | 'recruit' | 'qualifier' | 'fyc' | 'big_cases';
  targetValue: number;
  period: 'yearly' | 'quarterly' | 'monthly';
  category: 'rookie' | 'sales' | 'recruit' | 'top' | 'management';
  icon: React.ReactNode;
  color: string;
  specificQuarter?: number;
  quarterlyProgress?: { q1: number; q2: number; q3: number };
}

const CONTESTS: ContestDefinition[] = [
  // Superbeez Series (Quarterly Tiers)
  { id: '2.0', name: 'Superbeez Bronze', chineseName: '超级蜜蜂 (铜)', description: '6 NOC in a quarter with Avg Case Size RM 2,400', targetMetric: 'noc', targetValue: 6, period: 'quarterly', category: 'sales', icon: <Medal size={20} />, color: 'from-amber-700 to-amber-900', quarterlyProgress: { q1: 6, q2: 6, q3: 6 } },
  { id: '2.1s', name: 'Superbeez Silver', chineseName: '超级蜜蜂 (银)', description: '12 NOC in a quarter with Avg Case Size RM 3,000', targetMetric: 'noc', targetValue: 12, period: 'quarterly', category: 'sales', icon: <Medal size={20} />, color: 'from-slate-400 to-slate-600', quarterlyProgress: { q1: 12, q2: 12, q3: 12 } },
  { id: '2.1g', name: 'Superbeez Gold', chineseName: '超级蜜蜂 (金)', description: '18 NOC in a quarter with Avg Case Size RM 3,000', targetMetric: 'noc', targetValue: 18, period: 'quarterly', category: 'sales', icon: <Medal size={20} />, color: 'from-yellow-400 to-yellow-600', quarterlyProgress: { q1: 18, q2: 18, q3: 18 } },
  { id: '2.1p', name: 'Superbeez Platinum', chineseName: '超级蜜蜂 (白金)', description: '24 NOC in a quarter with Avg Case Size RM 3,000', targetMetric: 'noc', targetValue: 24, period: 'quarterly', category: 'sales', icon: <Medal size={20} />, color: 'from-slate-200 to-slate-400', quarterlyProgress: { q1: 24, q2: 24, q3: 24 } },
  { id: '2.1c', name: 'Superbeez Crown', chineseName: '超级蜜蜂 (皇冠)', description: '30 NOC in a quarter with Avg Case Size RM 3,000', targetMetric: 'noc', targetValue: 30, period: 'quarterly', category: 'sales', icon: <Crown size={20} />, color: 'from-rose-400 to-orange-500', quarterlyProgress: { q1: 30, q2: 30, q3: 30 } },
  
  // Management Awards
  { id: '2.3', name: 'Superbeez Builder', chineseName: '超级蜜蜂增员奖', description: 'Min 2 Superbeez Award Qualifiers in DG (Excl. Personal Sales)', targetMetric: 'qualifier', targetValue: 2, period: 'quarterly', category: 'management', icon: <Users size={20} />, color: 'from-orange-400 to-rose-600' },

  // Special Recognition
  { id: '4.0', name: 'Super Honey Award', chineseName: '超级蜂蜜奖', description: 'Single Case FYC > RM 3,750 (Award for exceptional high-value production)', targetMetric: 'big_cases', targetValue: 1, period: 'yearly', category: 'sales', icon: <Zap size={20} />, color: 'from-yellow-200 to-amber-500' },

  // Recruitment
  { id: '11.0a', name: 'Super Recruiter Bronze', chineseName: '超级招募金 (铜)', description: '1 New Recruit (30K QFYLP_C or 18K)', targetMetric: 'recruit', targetValue: 1, period: 'yearly', category: 'recruit', icon: <UserPlus size={20} />, color: 'from-amber-600 to-amber-800' },
  { id: '11.0b', name: 'Super Recruiter Silver', chineseName: '超级招募金 (银)', description: '2 New Recruits (30K QFYLP_C each)', targetMetric: 'recruit', targetValue: 2, period: 'yearly', category: 'recruit', icon: <UserPlus size={20} />, color: 'from-slate-400 to-slate-600' },
  { id: '11.0c', name: 'Super Recruiter Gold', chineseName: '超级招募金 (金)', description: '3 New Recruits (30K QFYLP_C each)', targetMetric: 'recruit', targetValue: 3, period: 'yearly', category: 'recruit', icon: <UserPlus size={20} />, color: 'from-yellow-400 to-yellow-700' },

  // Star Producer Series (Progressive)
  { id: '8.0a', name: 'Star Producer Bronze', chineseName: '超级巨星 (铜)', description: 'Progressive FYC Targets: Q1(18%) Q2(40%) Q3(68%)', targetMetric: 'fyc', targetValue: 36000, period: 'yearly', category: 'sales', icon: <Medal size={20} />, color: 'from-amber-700 to-amber-900', quarterlyProgress: { q1: 6480, q2: 14400, q3: 24480 } },
  { id: '8.0b', name: 'Star Producer Silver', chineseName: '超级巨星 (银)', description: 'Progressive FYC Targets', targetMetric: 'fyc', targetValue: 55000, period: 'yearly', category: 'sales', icon: <Medal size={20} />, color: 'from-slate-400 to-slate-600', quarterlyProgress: { q1: 9900, q2: 22000, q3: 37400 } },
  { id: '8.0c', name: 'Star Producer Gold', chineseName: '超级巨星 (金)', description: 'Progressive FYC Targets', targetMetric: 'fyc', targetValue: 80000, period: 'yearly', category: 'sales', icon: <Medal size={20} />, color: 'from-yellow-500 to-yellow-700', quarterlyProgress: { q1: 14400, q2: 32000, q3: 54400 } },
  { id: '8.0d', name: 'Star Producer Platinum', chineseName: '超级巨星 (白金)', description: 'Progressive FYC Targets', targetMetric: 'fyc', targetValue: 100000, period: 'yearly', category: 'sales', icon: <Medal size={20} />, color: 'from-slate-200 to-slate-400', quarterlyProgress: { q1: 18000, q2: 40000, q3: 68000 } },
  { id: '8.0e', name: 'Star Producer Diamond', chineseName: '超级巨星 (钻石)', description: 'Progressive FYC Targets', targetMetric: 'fyc', targetValue: 150000, period: 'yearly', category: 'top', icon: <Zap size={20} />, color: 'from-white to-slate-400', quarterlyProgress: { q1: 27000, q2: 60000, q3: 102000 } },

  // Management (Group)
  { id: '14.0a', name: 'Super Direct Group Bronze', chineseName: '超级直属组奖 (铜)', description: 'RM 500,000 QFYLP_C (Excl. Personal)', targetMetric: 'qfylp', targetValue: 500000, period: 'yearly', category: 'management', icon: <Trophy size={20} />, color: 'from-amber-600 to-amber-800' },
  { id: '14.0b', name: 'Super Direct Group Silver', chineseName: '超级直属组奖 (银)', description: 'RM 750,000 QFYLP_C (Excl. Personal)', targetMetric: 'qfylp', targetValue: 750000, period: 'yearly', category: 'management', icon: <Trophy size={20} />, color: 'from-slate-400 to-slate-600' },
  { id: '14.0c', name: 'Super Direct Group Gold', chineseName: '超级直属组奖 (金)', description: 'RM 1,000,000 QFYLP_C (Excl. Personal)', targetMetric: 'qfylp', targetValue: 1000000, period: 'yearly', category: 'management', icon: <Trophy size={20} />, color: 'from-yellow-400 to-yellow-600' },
  
  { id: '13.0', name: 'Super Star Manager', chineseName: '超级明星经理', description: 'Qualified for BOTH Star Producer & Star Manager', targetMetric: 'qualifier', targetValue: 2, period: 'yearly', category: 'management', icon: <Crown size={20} />, color: 'from-rose-400 to-orange-500' },

  // High Performance
  { id: '3.0', name: 'Starlight 1000', chineseName: '千星闪耀', description: 'QFYLP 100,000', targetMetric: 'qfylp', targetValue: 100000, period: 'yearly', category: 'top', icon: <Star size={20} />, color: 'from-indigo-400 to-purple-600 shadow-purple-500/20' },
  { id: '2.4', name: 'Superbeez 100', chineseName: '百单制胜', description: '100 NOC within the year', targetMetric: 'noc', targetValue: 100, period: 'yearly', category: 'sales', icon: <Trophy size={20} />, color: 'from-white to-slate-300' },
  { id: '5.1', name: 'Top of the Top', chineseName: '最高荣誉', description: '150 NOC Accumulation', targetMetric: 'noc', targetValue: 150, period: 'yearly', category: 'top', icon: <Crown size={20} />, color: 'from-rose-500 to-orange-600 shadow-rose-500/20' },
  
  // Elite
  { id: '10.1a', name: 'MDRT', chineseName: '百万圆桌会议', description: 'QFYLP 398,400', targetMetric: 'qfylp', targetValue: 398400, period: 'yearly', category: 'top', icon: <Crown size={20} />, color: 'from-amber-400 to-yellow-600 shadow-yellow-500/20' },
  { id: '10.1b', name: 'COT', chineseName: '内阁会议', description: 'QFYLP 1,195,200', targetMetric: 'qfylp', targetValue: 1195200, period: 'yearly', category: 'top', icon: <Crown size={20} />, color: 'from-slate-300 to-slate-500 shadow-slate-500/20' },
  { id: '10.1c', name: 'TOT', chineseName: '顶尖会议', description: 'QFYLP 2,390,400', targetMetric: 'qfylp', targetValue: 2390400, period: 'yearly', category: 'top', icon: <Crown size={20} />, color: 'from-yellow-300 to-amber-500 shadow-amber-500/30' },
];

export const AwardsPage: React.FC<AwardsPageProps> = ({ perfData, isDarkMode, theme }) => {
  // --- Calculation Logic ---
  const stats = useMemo(() => {
    const totalANP = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.anp, 0);
    const totalNOC = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.noc, 0);
    const totalFYC = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.fyc || 0), 0);
    const totalQFYLP = perfData.monthlyRecords.reduce((acc, curr) => acc + curr.actual, 0);

    // Calculate all quarters for specific tracking
    const quarters = [0, 1, 2, 3].map(q => {
      const qMonths = perfData.monthlyRecords.slice(q * 3, q * 3 + 3);
      return {
        anp: qMonths.reduce((acc, curr) => acc + curr.anp, 0),
        noc: qMonths.reduce((acc, curr) => acc + curr.noc, 0),
        fyc: qMonths.reduce((acc, curr) => acc + (curr.fyc || 0), 0),
        qfylp: qMonths.reduce((acc, curr) => acc + curr.actual, 0),
        bigCases: qMonths.reduce((acc, curr) => acc + (curr.bigCases?.length || 0), 0)
      };
    });

    // Current Quarter (Rough estimation as month mapping isn't precise in current data)
    const currentMonthIdx = new Date().getMonth();
    const currentQuarterIdx = Math.floor(currentMonthIdx / 3);
    const qStats = quarters[currentQuarterIdx];
    const totalBigCases = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.bigCases?.length || 0), 0);

    return { 
      totalANP, totalNOC, totalQFYLP, totalFYC, totalBigCases,
      qANP: qStats.anp, qNOC: qStats.noc, qFYC: qStats.fyc, qQFYLP: qStats.qfylp, qBigCases: qStats.bigCases,
      allQuarters: quarters,
      currentQuarterIdx
    };
  }, [perfData.monthlyRecords]);

  return (
    <div className="animate-fadeIn space-y-8 pb-32">
      {/* Page Header */}
      <div className={cn(
        "bento-card p-10 relative overflow-hidden",
        isDarkMode ? "bg-slate-900 shadow-2xl" : "bg-white shadow-xl"
      )}>
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Trophy size={200} className="text-yellow-500" />
        </div>
        <div className="relative z-10">
           <div className="flex items-center gap-4 mb-2">
             <div className="p-3 bg-yellow-500/20 text-yellow-500 rounded-2xl">
               <Trophy size={24} />
             </div>
             <h1 className={cn(
               "text-xl font-black uppercase tracking-[0.4em]",
               isDarkMode ? "text-white" : "text-slate-900"
             )}>Contest Vanguard · 竞赛追踪</h1>
           </div>
           <p className="text-sm text-slate-500 font-medium tracking-widest uppercase">Super Group Marketing Department 2026</p>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
              <div className="space-y-1">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total ANP Captured</div>
                 <div className="text-3xl font-mono font-bold text-white">RM {formatNumber(stats.totalANP)}</div>
              </div>
              <div className="space-y-1">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aggregate NOC Nodes</div>
                 <div className="text-3xl font-mono font-bold text-white">{stats.totalNOC}</div>
              </div>
              <div className="space-y-1">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strategic Velocity</div>
                 <div className="text-3xl font-mono font-bold text-blue-400">Peak Performance</div>
              </div>
           </div>
        </div>
      </div>

      {/* Awards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CONTESTS.map((contest, i) => {
          let currentVal = 0;
          
          // Determine the correct stats bucket
          const targetQuarterIdx = contest.specificQuarter ? contest.specificQuarter - 1 : stats.currentQuarterIdx;
          const targetStats = stats.allQuarters[targetQuarterIdx];

          if (contest.targetMetric === 'noc') {
            currentVal = contest.period === 'quarterly' ? targetStats.noc : stats.totalNOC;
          } else if (contest.targetMetric === 'anp') {
            currentVal = contest.period === 'quarterly' ? targetStats.anp : stats.totalANP;
          } else if (contest.targetMetric === 'qfylp') {
            currentVal = contest.period === 'quarterly' ? targetStats.qfylp : stats.totalQFYLP;
          } else if (contest.targetMetric === 'fyc') {
            currentVal = contest.period === 'quarterly' ? targetStats.fyc : stats.totalFYC;
          } else if (contest.targetMetric === 'big_cases') {
            currentVal = contest.period === 'quarterly' ? (targetStats as any).bigCases : stats.totalBigCases;
          } else if (contest.targetMetric === 'recruit') {
            currentVal = perfData.monthlyRecords.reduce((acc, curr) => acc + (curr.recruitActual || 0), 0);
          } else if (contest.targetMetric === 'qualifier') {
            // Placeholder: currently no tracking for specifically who qualified for what
            // but we can look at recruitActual as a proxy or use recruitCount
            currentVal = 0; 
          }
          
          const progress = Math.min(100, (currentVal / contest.targetValue) * 100);
          const deficit = Math.max(0, contest.targetValue - currentVal);
          
          // Special logic for Superbeez Average Case Size
          let avgCaseSizeOk = true;
          if (contest.id.startsWith('2.')) {
            const currentANP = contest.period === 'quarterly' ? targetStats.anp : stats.totalANP;
            const currentNOC = currentVal; // currentVal is NOC for these
            const requiredAvg = contest.id === '2.0' ? 2400 : 3000;
            if (currentNOC > 0 && (currentANP / currentNOC) < requiredAvg) {
              avgCaseSizeOk = false;
            }
          }

          const isAchieved = currentVal >= contest.targetValue && avgCaseSizeOk;

          return (
            <motion.div 
              key={contest.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bento-card p-6 flex flex-col justify-between group transition-all hover:scale-[1.02]",
                isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white shadow-xl shadow-slate-200/50"
              )}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "p-3 rounded-[1.2rem] bg-gradient-to-br shadow-lg text-white",
                    contest.color
                  )}>
                    {contest.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Contest {contest.id}</div>
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-widest mt-1",
                      isAchieved ? "text-emerald-500" : "text-white"
                    )}>
                      {contest.period}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className={cn(
                    "text-sm font-black uppercase tracking-widest",
                    isDarkMode ? "text-white" : "text-slate-900"
                  )}>
                    {contest.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{contest.chineseName}</p>
                  <p className="text-[9px] text-slate-500 mt-2 font-mono leading-relaxed">{contest.description}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {/* Quarterly Markers */}
                {contest.quarterlyProgress && (
                  <div className="flex justify-between text-[8px] font-bold text-slate-600 uppercase mb-2 px-1">
                    {[0, 1, 2].map((idx) => {
                      const qKey = `q${idx + 1}` as keyof typeof contest.quarterlyProgress;
                      const qTarget = contest.quarterlyProgress![qKey];
                      const qStat = stats.allQuarters[idx];
                      let isHit = false;
                      
                      if (contest.period === 'yearly') {
                        isHit = currentVal >= qTarget;
                      } else {
                        // For quarterly awards, we track each quarter's merit separately
                        const metricVal = contest.targetMetric === 'noc' ? qStat.noc : 
                                        contest.targetMetric === 'fyc' ? qStat.fyc : 
                                        qStat.anp;
                        isHit = metricVal >= qTarget;
                      }

                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <span>Q{idx + 1}</span>
                          <span className={cn(isHit ? "text-emerald-400" : "")}>
                            {contest.targetMetric === 'noc' ? qTarget : `RM ${formatNumber(qTarget, contest.targetMetric === 'fyc' ? 2 : undefined)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between items-end">
                  <div>
                     <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Progress</div>
                     <div className="text-2xl font-mono font-black text-white">
                       {['noc', 'recruit', 'qualifier'].includes(contest.targetMetric)
                         ? currentVal 
                         : `RM ${formatNumber(currentVal, contest.targetMetric === 'fyc' ? 2 : undefined)}`
                       }
                       <span className="text-slate-600 text-xs font-normal ml-2">
                         / {['noc', 'recruit', 'qualifier'].includes(contest.targetMetric)
                           ? contest.targetValue 
                           : `RM ${formatNumber(contest.targetValue, contest.targetMetric === 'fyc' ? 2 : undefined)}`
                         }
                       </span>
                     </div>
                  </div>
                  <div className={cn(
                    "text-xs font-black font-mono",
                    isAchieved ? "text-emerald-500" : "text-white"
                  )}>
                    {progress.toFixed(1)}%
                  </div>
                </div>

                <div className="h-3 w-full bg-slate-800/40 rounded-full overflow-hidden border border-slate-800/10">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${progress}%` }}
                     className={cn(
                       "h-full rounded-full bg-gradient-to-r",
                       isAchieved ? "from-emerald-500 to-teal-600" : "from-white to-slate-400"
                     )}
                   />
                </div>

                <div className="flex items-center justify-between">
                   <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                     {isAchieved ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircleIcon size={10} /> Qualification Met
                        </span>
                     ) : (
                        <div className="flex flex-col gap-0.5">
                          <span>
                            {['noc', 'recruit', 'qualifier', 'big_cases'].includes(contest.targetMetric)
                              ? `Gap: ${deficit}` 
                              : `Gap: RM ${formatNumber(deficit, contest.targetMetric === 'fyc' ? 2 : undefined)}`}
                          </span>
                          {!avgCaseSizeOk && currentVal > 0 && (
                            <span className="text-rose-500 text-[7px] lowercase italic">Avg case size below threshold</span>
                          )}
                        </div>
                     )}
                   </div>
                   <div className="p-1 px-2 rounded-md bg-slate-800/20 text-[8px] font-bold text-slate-500 uppercase">
                     {contest.category}
                   </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Manual Entry Warning */}
      <div className="p-8 bento-card bg-white/10 border-white/20 text-center">
         <p className="text-[10px] text-white font-bold uppercase tracking-[0.2em] mb-2 font-mono">Precision Tracking Invariant</p>
         <p className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
           Award calculations are based on your aggregated Monthly Records and Daily Logs. 
           Ensure all actual sales and case counts are synchronized for accurate qualification auditing.
         </p>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { PerfData, CustomerSaleRecord } from '../types';
import { 
  DollarSign, Calendar, Gift, Plus, Trash2, Edit, ChevronDown, 
  Download, Upload, Search, BarChart3, User, CreditCard, ChevronRight, X, Info, History
} from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

const fycRateOptions = [
  { label: '28%', value: 0.28, desc: '< 20 Years ILP (默认 Default)' },
  { label: '35%', value: 0.35, desc: '< 20 Years ILP Traditional' },
  { label: '14%', value: 0.14, desc: '10 Years ILP' },
  { label: '17.5%', value: 0.175, desc: '10 Years Traditional' },
  { label: '8%', value: 0.08, desc: '5 Years ILP' },
  { label: '10%', value: 0.10, desc: '5 Years Traditional' }
];

interface ProductionPageProps {
  perfData: PerfData;
  setPerfData: React.Dispatch<React.SetStateAction<PerfData>>;
  isDarkMode: boolean;
  theme: any;
  showToast: (message: string) => void;
}

export const ProductionPage: React.FC<ProductionPageProps> = ({
  perfData,
  setPerfData,
  isDarkMode,
  theme,
  showToast
}) => {
  // Ensure we have a default list
  const records = useMemo(() => perfData.customerSaleRecords || [], [perfData.customerSaleRecords]);

  // Dynamic current year determination
  const currentSystemYear = useMemo(() => new Date().getFullYear(), []);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerSaleRecord | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formInforceDate, setFormInforceDate] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [formBirthday, setFormBirthday] = useState('');
  const [formPlanName, setFormPlanName] = useState('');
  const [formANP, setFormANP] = useState('');
  const [formFYC, setFormFYC] = useState('');
  const [fycRate, setFycRate] = useState<number>(0.28); // Default 28% ILP
  const [formInstallmentPref, setFormInstallmentPref] = useState('');
  const [formPayMode, setFormPayMode] = useState<'M' | 'Q' | 'HY' | 'Y'>('M');
  const [formMonthlyPayments, setFormMonthlyPayments] = useState<number[]>(Array(12).fill(0));
  const [formNotes, setFormNotes] = useState('');

  // Auto-fill monthly payments and live updating fyc and collected premium in the form state
  const handleAutoFillMonthlyPaymentsState = (dateVal: string, modeVal: 'M' | 'Q' | 'HY' | 'Y', anpVal: string, activeRate: number) => {
    if (!dateVal) return;
    const parts = dateVal.split('-');
    if (parts.length < 2) return;
    const month = parseInt(parts[1], 10);
    if (isNaN(month) || month < 1 || month > 12) return;

    const idx = month - 1; // 0-based index
    const payments = Array(12).fill(0);

    if (modeVal === 'M') {
      // First payment is 2 months
      payments[idx] = 2;
      // Remaining months get 1 payment
      for (let i = idx + 2; i < 12; i++) {
        payments[i] = 1;
      }
    } else if (modeVal === 'Q') {
      for (let i = idx; i < 12; i += 3) {
        payments[i] = 1;
      }
    } else if (modeVal === 'HY') {
      for (let i = idx; i < 12; i += 6) {
        payments[i] = 1;
      }
    } else if (modeVal === 'Y') {
      if (idx >= 0 && idx < 12) {
        payments[idx] = 1;
      }
    }

    setFormMonthlyPayments(payments);

    // Live update the installment premium
    const anpNum = parseFloat(anpVal) || 0;
    let suggestedInstall = 0;
    if (modeVal === 'M') suggestedInstall = anpNum / 12;
    else if (modeVal === 'Q') suggestedInstall = anpNum / 4;
    else if (modeVal === 'HY') suggestedInstall = anpNum / 2;
    else if (modeVal === 'Y') suggestedInstall = anpNum;
    setFormInstallmentPref(suggestedInstall.toFixed(2));

    // Live update the suggested FYC based on Collected Premium * Rate!
    const totalPayments = payments.reduce((acc, curr) => acc + curr, 0);
    const collectedPremium = suggestedInstall * totalPayments;
    const computedFYC = collectedPremium > 0 ? (collectedPremium * activeRate) : (anpNum * activeRate);
    setFormFYC(computedFYC.toFixed(2));
  };

  const handleANPChange = (val: string) => {
    setFormANP(val);
    handleAutoFillMonthlyPaymentsState(formInforceDate, formPayMode, val, fycRate);
  };

  const handlePayModeChange = (mode: 'M' | 'Q' | 'HY' | 'Y') => {
    setFormPayMode(mode);
    handleAutoFillMonthlyPaymentsState(formInforceDate, mode, formANP, fycRate);
  };

  const handleFycRateSelect = (rate: number) => {
    setFycRate(rate);
    handleAutoFillMonthlyPaymentsState(formInforceDate, formPayMode, formANP, rate);
  };

  const handleInforceDateChange = (val: string) => {
    setFormInforceDate(val);
    handleAutoFillMonthlyPaymentsState(val, formPayMode, formANP, fycRate);
  };

  // Open add modal
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormName('');
    const initialDate = `${selectedYear}-01-01`;
    setFormInforceDate(initialDate);
    setFormBirthday('');
    setFormPlanName('');
    setFormANP('');
    setFormFYC('');
    setFycRate(0.28);
    setFormInstallmentPref('');
    setFormPayMode('M');
    
    // Auto-populate monthly payments starting from Jan (Index 0)
    const payments = Array(12).fill(0);
    payments[0] = 2; // Month 1 (Jan) gets 2
    for (let i = 2; i < 12; i++) {
      payments[i] = 1;
    }
    setFormMonthlyPayments(payments);
    
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (rec: CustomerSaleRecord) => {
    setEditingRecord(rec);
    setFormName(rec.customerName);
    setFormInforceDate(rec.inforceDate);
    setFormBirthday(rec.birthday || '');
    setFormPlanName(rec.planName);
    setFormANP(rec.anp.toString());
    setFormFYC(rec.fyc.toString());
    
    // Match the custom rate or set a default one
    const calcRate = rec.fycRate ?? (rec.anp > 0 ? rec.fyc / rec.anp : 0.28);
    // Find closest rate from options (e.g. difference less than 0.005)
    const matched = fycRateOptions.find(o => Math.abs(o.value - calcRate) < 0.005);
    setFycRate(matched ? matched.value : calcRate);

    setFormInstallmentPref(rec.installmentPremium.toString());
    setFormPayMode(rec.payMode);
    setFormMonthlyPayments([...rec.monthlyPayments]);
    setFormNotes(rec.notes || '');
    setIsAddModalOpen(true);
  };

  // Save record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPlanName.trim()) {
      showToast('⚠️ Please enter customer name and plan name');
      return;
    }

    const anpNum = parseFloat(formANP) || 0;
    const installNum = parseFloat(formInstallmentPref) || 0;

    // Calculate collected premium
    const totalPayments = formMonthlyPayments.reduce((acc, curr) => acc + curr, 0);
    const collectedPremium = installNum * totalPayments;

    // Use selected rate option
    const savedRate = fycRate;

    // If collected premium > 0, FYC = collected premium * saved rate
    // Else, default to ANP * saved rate so it shows the initial projected commission
    const savedFYC = collectedPremium > 0 ? (collectedPremium * savedRate) : (anpNum * savedRate);

    const savedRecord: CustomerSaleRecord = {
      id: editingRecord ? editingRecord.id : crypto.randomUUID(),
      customerName: formName.trim(),
      inforceDate: formInforceDate,
      birthday: formBirthday || undefined,
      planName: formPlanName.trim().toUpperCase(),
      anp: anpNum,
      fyc: parseFloat(savedFYC.toFixed(2)),
      fycRate: savedRate,
      installmentPremium: installNum,
      payMode: formPayMode,
      monthlyPayments: formMonthlyPayments,
      notes: formNotes.trim() || undefined
    };

    setPerfData(prev => {
      const currentList = prev.customerSaleRecords || [];
      let updatedList = [];
      if (editingRecord) {
        updatedList = currentList.map(r => r.id === editingRecord.id ? savedRecord : r);
        showToast('✅ Record updated successfully');
      } else {
        updatedList = [savedRecord, ...currentList];
        showToast('✅ Record added successfully');
      }
      return {
        ...prev,
        customerSaleRecords: updatedList
      };
    });

    setIsAddModalOpen(false);
  };

  // Delete record
  const handleDeleteRecord = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the sales record for ${name}?`)) return;
    setPerfData(prev => {
      const currentList = prev.customerSaleRecords || [];
      return {
        ...prev,
        customerSaleRecords: currentList.filter(r => r.id !== id)
      };
    });
    showToast('🗑️ Record removed');
  };

  // Increment payment count for a month
  const handleCycleMonthPayment = (recordId: string, monthIdx: number) => {
    setPerfData(prev => {
      const currentList = prev.customerSaleRecords || [];
      const updatedList = currentList.map(r => {
        if (r.id === recordId) {
          const payments = [...r.monthlyPayments];
          // Cycle: 0 -> 1 -> 2 -> 0 (supports double payment tracking)
          payments[monthIdx] = (payments[monthIdx] + 1) % 3;

          const totalPayments = payments.reduce((acc, curr) => acc + curr, 0);
          const collectedPremium = r.installmentPremium * totalPayments;
          
          // Use stored fycRate or deduce it
          const rate = r.fycRate ?? (r.anp > 0 ? r.fyc / r.anp : 0.28);
          
          // Recalculate First Year Commission based on Collected Premium * Rate!
          // Note: If total collected premium is 0, we show projected commission (r.anp * rate)
          const actualFYC = totalPayments > 0 ? (collectedPremium * rate) : (r.anp * rate);

          return { 
            ...r, 
            monthlyPayments: payments,
            fycRate: rate,
            fyc: parseFloat(actualFYC.toFixed(2))
          };
        }
        return r;
      });
      return {
        ...prev,
        customerSaleRecords: updatedList
      };
    });
  };

  // Perform filtering of both direct current-year records and bring-forward records
  const filteredRecords = useMemo(() => {
    // 1. Get direct records of selectedYear
    const direct = records.filter(r => r.inforceDate && r.inforceDate.startsWith(selectedYear));

    // 2. Synthesize all Bring Forward records for this selectedYear from previous year (selectedYear - 1)
    const bpYear = parseInt(selectedYear, 10);
    const priorYearStr = (bpYear - 1).toString();
    const derivedBFRecords: CustomerSaleRecord[] = [];

    records.forEach(r => {
      if (r.inforceDate && r.inforceDate.startsWith(priorYearStr)) {
        // Calculate how many payments were received in Year 1
        const p1 = r.monthlyPayments.reduce((acc, curr) => acc + curr, 0);
        
        // Determine total first-year payments expected
        let expectedTotalPayments = 12; // Monthly
        if (r.payMode === 'Q') expectedTotalPayments = 4;
        else if (r.payMode === 'HY') expectedTotalPayments = 2;
        else if (r.payMode === 'Y') expectedTotalPayments = 1;

        // Look at how many are left for Year 2 (current selectedYear)
        const remainingCount = Math.max(0, expectedTotalPayments - p1);

        if (remainingCount > 0) {
          const inforceParts = r.inforceDate.split('-');
          const inforceMonth = inforceParts.length >= 2 ? parseInt(inforceParts[1], 10) : 1;
          const p2_array = Array(12).fill(0);
          
          if (r.payMode === 'M') {
            for (let i = 0; i < remainingCount && i < 12; i++) {
              p2_array[i] = 1;
            }
          } else if (r.payMode === 'Q') {
            for (let k = 0; k < 4; k++) {
              const targetMonth = inforceMonth + 3 * k;
              if (targetMonth > 12) {
                const y2Index = targetMonth - 12 - 1;
                if (y2Index >= 0 && y2Index < 12) {
                  p2_array[y2Index] = 1;
                }
              }
            }
          } else if (r.payMode === 'HY') {
            for (let k = 0; k < 2; k++) {
              const targetMonth = inforceMonth + 6 * k;
              if (targetMonth > 12) {
                const y2Index = targetMonth - 12 - 1;
                if (y2Index >= 0 && y2Index < 12) {
                  p2_array[y2Index] = 1;
                }
              }
            }
          }

          const actualY2CollectedPayments = p2_array.reduce((acc, curr) => acc + curr, 0);
          const collectedPremiumY2 = r.installmentPremium * actualY2CollectedPayments;
          const rate = r.fycRate ?? (r.anp > 0 ? r.fyc / r.anp : 0.28);
          const fycY2 = collectedPremiumY2 * rate;

          derivedBFRecords.push({
            ...r,
            id: `${r.id}-bf`, // unique ID for carry forward row
            customerName: r.customerName,
            anp: 0, // No ANP credited to selectedYear
            fyc: parseFloat(fycY2.toFixed(2)),
            fycRate: rate,
            monthlyPayments: p2_array,
            isBringForward: true
          });
        }
      }
    });

    const allRecordsForYear = [...direct, ...derivedBFRecords];

    // 3. Apply search filtering
    return allRecordsForYear.filter(r => {
      const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [records, searchTerm, selectedYear]);

  // Aggregate Key Statistics
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalANP = 0;
    let totalFYC = 0;

    // Month level collections
    const monthlyCollections = Array(12).fill(0);

    filteredRecords.forEach(r => {
      totalANP += r.anp;
      totalFYC += r.fyc;
      
      r.monthlyPayments.forEach((p, idx) => {
        const amt = r.installmentPremium * p;
        monthlyCollections[idx] += amt;
        totalCollected += amt;
      });
    });

    return {
      totalCollected,
      totalANP,
      totalFYC,
      monthlyCollections
    };
  }, [filteredRecords]);

  // Bring Forward Collected Premium calculation:
  // For each policy in force in the selectedYear, calculate how much of its first-year annualized premium (ANP)
  // is carried forward to the next year (i.e. ANP minus the collected first-year premium in selectedYear).
  const bfCollected = useMemo(() => {
    let sum = 0;
    filteredRecords.forEach(r => {
      if (!r.isBringForward) {
        const totalPayments = r.monthlyPayments.reduce((acc, curr) => acc + curr, 0);
        const collectedPremium = r.installmentPremium * totalPayments;
        const carriedOver = Math.max(0, r.anp - collectedPremium);
        sum += carriedOver;
      }
    });
    return sum;
  }, [filteredRecords]);

  // Export to Excel function
  const handleExportToExcel = () => {
    if (filteredRecords.length === 0) {
      showToast('❌ No records to export');
      return;
    }

    const exportRows = filteredRecords.map((r, idx) => {
      const row: any = {
        'No.': idx + 1,
        'Life Assured': r.customerName,
        'Inforce Date': r.inforceDate,
        'Birthday': r.birthday || 'N/A',
        'Plan': r.planName,
        'Annualized Premium (ANP)': r.anp,
        'First Year Commission (FYC)': r.fyc,
        'Installment Premium': r.installmentPremium,
        'Payment Mode': r.payMode,
        'Jan Payments': r.monthlyPayments[0],
        'Feb Payments': r.monthlyPayments[1],
        'Mar Payments': r.monthlyPayments[2],
        'Apr Payments': r.monthlyPayments[3],
        'May Payments': r.monthlyPayments[4],
        'Jun Payments': r.monthlyPayments[5],
        'Jul Payments': r.monthlyPayments[6],
        'Aug Payments': r.monthlyPayments[7],
        'Sep Payments': r.monthlyPayments[8],
        'Oct Payments': r.monthlyPayments[9],
        'Nov Payments': r.monthlyPayments[10],
        'Dec Payments': r.monthlyPayments[11],
        'Total Payments': r.monthlyPayments.reduce((sum, curr) => sum + curr, 0),
        'Collected Premium': r.installmentPremium * r.monthlyPayments.reduce((sum, curr) => sum + curr, 0),
        'Notes': r.notes || ''
      };
      return row;
    });

    try {
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Production ${selectedYear}`);
      XLSX.writeFile(wb, `Sales_Production_Report_${selectedYear}.xlsx`);
      showToast('📊 Report exported as Excel successfully!');
    } catch (e) {
      console.error(e);
      showToast('❌ Excel export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Hub Header */}
      <div className={cn(
        "bento-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        !isDarkMode && "bg-white border-slate-200"
      )}>
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.25em] flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-500" />
            Customer Production Ledger • 客户业绩账目
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Real-time collected premium tracking & commission synthesis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year selector */}
          <div className="flex rounded-xl overflow-hidden border border-slate-800">
            {[(currentSystemYear - 1).toString(), currentSystemYear.toString(), (currentSystemYear + 1).toString()].map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={cn(
                  "px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all",
                  selectedYear === y 
                    ? (isDarkMode ? "bg-white text-slate-950" : "bg-slate-900 text-white")
                    : (isDarkMode ? "bg-slate-900 text-slate-400 hover:text-white" : "bg-white text-slate-600 hover:text-slate-900")
                )}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Manual Switcher for all lookup history years */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              自定义:
            </span>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={cn(
                  "pl-3 pr-7 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border appearance-none cursor-pointer focus:outline-none",
                  isDarkMode 
                    ? "bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700" 
                    : "bg-white border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-400 shadow-sm"
                )}
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='rgba(156, 163, 175, 0.8)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                {/* 20 years select option box from current year minus 10 to current year plus 10 */}
                {Array.from({ length: 21 }, (_, idx) => {
                  const itemYearStr = (currentSystemYear - 10 + idx).toString();
                  return (
                    <option key={itemYearStr} value={itemYearStr}>
                      {itemYearStr}年
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <button 
            onClick={handleExportToExcel}
            className={cn(
              "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-1.5",
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700" 
                : "bg-white border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-400 shadow-sm"
            )}
          >
            <Download size={12} /> Export Excel
          </button>

          <button 
            onClick={handleOpenAddModal}
            className={cn(
              "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5",
              isDarkMode 
                ? "bg-white text-slate-950 hover:bg-slate-200 shadow-lg shadow-white/5" 
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            <Plus size={14} /> Add Record
          </button>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className={cn(
          "bento-card p-6 flex items-center justify-between relative overflow-hidden",
          !isDarkMode && "bg-white border-slate-200"
        )}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">RM Collected Premium</span>
            <span className="text-2xl font-mono font-black text-emerald-500 mt-1 block">
              RM {formatNumber(stats.totalCollected)}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase mt-2 font-bold pl-1">
              <span>Total ledger sum paid</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className={cn(
          "bento-card p-6 flex items-center justify-between relative overflow-hidden",
          !isDarkMode && "bg-white border-slate-200"
        )}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Total Policy ANP</span>
            <span className="text-2xl font-mono font-black text-amber-500 mt-1 block">
              RM {formatNumber(stats.totalANP)}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase mt-2 font-bold pl-1">
              <span>Target: RM 450,000 AIM</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
            <CreditCard size={20} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className={cn(
          "bento-card p-6 flex items-center justify-between relative overflow-hidden",
          !isDarkMode && "bg-white border-slate-200"
        )}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">First Year Commission</span>
            <span className="text-2xl font-mono font-black text-cyan-400 mt-1 block">
              RM {formatNumber(stats.totalFYC)}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase mt-2 font-bold pl-1">
              <span>Gross Commission Base</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Gift size={20} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className={cn(
          "bento-card p-6 flex items-center justify-between relative overflow-hidden",
          !isDarkMode && "bg-white border-slate-200"
        )}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Bring Forward Collected Premium</span>
            <span className="text-2xl font-mono font-black text-indigo-400 mt-1 block">
              RM {formatNumber(bfCollected)}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase mt-2 font-bold pl-1">
              <span>Carried over to next year • 转结至明年的首年保费</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <History size={20} />
          </div>
        </div>
      </div>

      {/* Monthly Collection Stream Breakdowns - Slider or Grid */}
      <div className={cn(
        "bento-card p-6",
        !isDarkMode && "bg-white border-slate-200"
      )}>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 pl-1">
          Monthly Revenue Stream • {selectedYear}年每月录得保费之汇总统计
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3">
          {stats.monthlyCollections.map((amt, idx) => {
            const isCollected = amt > 0;
            return (
              <div 
                key={idx} 
                className={cn(
                  "p-3 rounded-2xl border flex flex-col items-center justify-center transition-all",
                  isCollected
                    ? (isDarkMode ? "bg-emerald-500/[0.04] border-emerald-500/30" : "bg-emerald-500/[0.02] border-emerald-200")
                    : (isDarkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-50 border-slate-100")
                )}
              >
                <span className="text-[9px] font-bold uppercase text-slate-500">{idx + 1}月</span>
                <span className={cn(
                  "text-xs font-mono font-black mt-1 text-center shrink-0 truncate max-w-full",
                  isCollected ? "text-emerald-500" : "text-slate-400"
                )}>
                  {formatNumber(amt)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Database Filter Section */}
      <div className={cn(
        "bento-card p-6",
        !isDarkMode && "bg-white border-slate-200"
      )}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Search customers, plans or notes..." 
              className={cn(
                "w-full pl-10 pr-4 py-2.5 bg-transparent border rounded-2xl outline-none text-xs transition-colors font-medium",
                isDarkMode 
                  ? "border-slate-800 focus:border-white text-white bg-slate-900/50" 
                  : "border-slate-200 focus:border-slate-800 text-slate-900 bg-slate-50"
              )}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest shrink-0">
            Current Filter: <strong>{filteredRecords.length}</strong> record(s) found
          </span>
        </div>

        {/* Ledger Scrollable Container */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1240px]">
            <thead>
              <tr className="border-b border-slate-800 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <th className="py-3 px-2 text-center w-12">No</th>
                <th className="py-3 px-3">Life Assured (Insured)</th>
                <th className="py-3 px-2 w-28">Inforce Date</th>
                <th className="py-3 px-2 w-24">Birthday</th>
                <th className="py-3 px-2 w-20">Plan</th>
                <th className="py-3 px-2 text-right w-24">ANP</th>
                <th className="py-3 px-2 text-right w-24">FYC</th>
                <th className="py-3 px-2 text-right w-24">Install Pre</th>
                <th className="py-3 px-1 text-center w-14">Mode</th>
                {/* 12 Months Grid */}
                <th className="py-3 px-1 text-center font-mono w-[380px]">
                  Premium Collections (一月 至 十二月)
                </th>
                <th className="py-3 px-2 text-center w-14">Paid</th>
                <th className="py-3 px-3 text-right w-28">Collected Sum</th>
                <th className="py-3 px-3 text-center w-16">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, index) => {
                  const paymentCount = rec.monthlyPayments.reduce((sum, curr) => sum + curr, 0);
                  const collectedSum = rec.installmentPremium * paymentCount;

                  return (
                    <tr 
                      key={rec.id} 
                      className="text-xs hover:bg-slate-800/10 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3 px-2 text-center text-slate-500 font-mono font-bold">
                        {index + 1}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3 font-semibold text-white">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(!isDarkMode && "text-slate-900")}>{rec.customerName}</span>
                            {rec.isBringForward && (
                              <span className="text-[8px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/35 rounded-md font-bold uppercase tracking-wider select-none">
                                BF • 转结
                              </span>
                            )}
                          </div>
                          {rec.notes && <span className="text-[9px] text-slate-500 font-normal truncate max-w-[160px]">{rec.notes}</span>}
                        </div>
                      </td>

                      {/* Inforce date */}
                      <td className="py-3 px-2 font-mono text-slate-400 leading-none">
                        {rec.inforceDate}
                      </td>

                      {/* Birthday */}
                      <td className="py-3 px-2 text-slate-400 text-[11px] font-mono">
                        {rec.birthday || 'N/A'}
                      </td>

                      {/* Plan */}
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 bg-orange-500/10 text-[9px] font-extrabold text-orange-400 rounded-md border border-orange-500/25 font-mono shadow-[0_0_8px_rgba(249,115,22,0.05)]">
                          {rec.planName}
                        </span>
                      </td>

                      {/* ANP */}
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">
                        {formatNumber(rec.anp)}
                      </td>

                      {/* FYC */}
                      <td className="py-3 px-2 text-right font-mono text-cyan-400">
                        {formatNumber(rec.fyc)}
                      </td>

                      {/* Installment Premium */}
                      <td className="py-3 px-2 text-right font-mono text-amber-500 font-bold">
                        {formatNumber(rec.installmentPremium)}
                      </td>

                      {/* Pay Mode */}
                      <td className="py-3 px-1 text-center font-bold">
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-md font-black block mx-auto w-8 text-center",
                          rec.payMode === 'M' ? "bg-cyan-500/10 text-cyan-400" :
                          rec.payMode === 'Q' ? "bg-amber-500/10 text-amber-500" :
                          rec.payMode === 'HY' ? "bg-indigo-500/10 text-indigo-400" :
                          "bg-purple-500/10 text-purple-400"
                        )}>
                          {rec.payMode}
                        </span>
                      </td>

                      {/* Months 1-12 Payments Grid */}
                      <td className="py-2 px-1">
                        <div className="flex gap-1 justify-center max-w-[380px] mx-auto">
                          {rec.monthlyPayments.map((payVal, mIdx) => (
                            <button
                              key={mIdx}
                              disabled={rec.isBringForward}
                              onClick={() => handleCycleMonthPayment(rec.id, mIdx)}
                              title={rec.isBringForward 
                                ? `Month ${mIdx + 1} carry-over payment (${payVal} payment(s)) - edit under prior year to adjust`
                                : `Month ${mIdx + 1} payment counter (click to cycle)`}
                              className={cn(
                                "w-6 h-6 rounded-lg transition-all text-[9px] font-mono font-black border text-center flex items-center justify-center select-none",
                                !rec.isBringForward && "active:scale-90 hover:border-slate-600",
                                payVal === 0 
                                  ? (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-600" : "bg-white border-slate-200 text-slate-300")
                                  : payVal === 1
                                    ? "bg-cyan-500/25 border-cyan-500/70 text-cyan-400 hover:opacity-85"
                                    : "bg-emerald-500/30 border-emerald-500 text-emerald-400 hover:opacity-85",
                                rec.isBringForward && "cursor-not-allowed opacity-75"
                              )}
                            >
                              {payVal}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Total Payments Count */}
                      <td className="py-3 px-2 text-center font-mono font-extrabold text-slate-400">
                        {paymentCount}
                      </td>

                      {/* Collected Sum */}
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-500">
                        {formatNumber(collectedSum)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3">
                        {rec.isBringForward ? (
                          <div className="text-center text-[10px] font-black text-indigo-400/80 uppercase select-none pr-1 tracking-wider leading-none">
                            Carry-forward
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenEditModal(rec)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/40 rounded-lg transition-all"
                              title="Edit Sales Node"
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteRecord(rec.id, rec.customerName)}
                              className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Remove Sales Node"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-3xl max-w-sm mx-auto">
                      <Calendar size={24} className="text-slate-600 mb-2" />
                      <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500">暂无销售业绩记录 No ledger entries</p>
                      <p className="text-[9px] text-slate-600 mt-1 uppercase">Click Add Record to log customer information</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Record Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "w-full max-w-lg rounded-[2.5rem] shadow-2xl border p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar",
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white text-slate-950 rounded-2xl shadow-lg">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                      {editingRecord ? 'Edit Customer Node' : 'Log New Production Node'}
                    </h3>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-medium">创建业绩档案 · Create Production File</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="p-2 hover:bg-slate-800/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="space-y-4 flex-1">
                {/* Name & Plan Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Client Name (Life Assured)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. JAY CHOU"
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl border outline-none text-xs transition-colors font-medium autocomplete-off",
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 focus:border-white text-white" 
                          : "bg-slate-50 border-slate-200 focus:border-slate-800 text-slate-900"
                      )}
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Plan Code (产品名)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. SPY, SPWP"
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl border outline-none text-xs transition-colors font-medium",
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 focus:border-white text-white" 
                          : "bg-slate-50 border-slate-200 focus:border-slate-800 text-slate-900"
                      )}
                      value={formPlanName}
                      onChange={e => setFormPlanName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Dates: Inforce & Birthday */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Inforce Date (保单生效日)</label>
                    <input 
                      type="date" 
                      required
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl border outline-none text-xs transition-colors font-medium",
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 focus:border-white text-white color-scheme-dark" 
                          : "bg-slate-50 border-slate-200 focus:border-slate-800 text-slate-900"
                      )}
                      value={formInforceDate}
                      onChange={e => handleInforceDateChange(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Birthday (生日日期 - 可空)</label>
                    <input 
                      type="date" 
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl border outline-none text-xs transition-colors font-medium",
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 focus:border-white text-white" 
                          : "bg-slate-50 border-slate-200 focus:border-slate-800 text-slate-900"
                      )}
                      value={formBirthday}
                      onChange={e => setFormBirthday(e.target.value)}
                    />
                  </div>
                </div>

                {/* Metrics: ANP & Pay Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Annualized Premium (ANP)</label>
                    <input 
                      type="number" 
                      required
                      step="any"
                      placeholder="e.g. 5400.00"
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl border outline-none text-xs transition-colors font-medium",
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 focus:border-white text-white" 
                          : "bg-slate-50 border-slate-200 focus:border-slate-800 text-slate-900"
                      )}
                      value={formANP}
                      onChange={e => handleANPChange(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Payment Mode</label>
                    <div className="flex rounded-2xl border border-slate-800 overflow-hidden h-[46px]">
                      {(['M', 'Q', 'HY', 'Y'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handlePayModeChange(mode)}
                          className={cn(
                            "flex-1 text-[11px] font-black uppercase tracking-wider transition-all",
                            formPayMode === mode 
                              ? (isDarkMode ? "bg-white text-slate-950" : "bg-slate-950 text-white")
                              : (isDarkMode ? "bg-slate-900/50 text-slate-400 hover:text-white" : "bg-white text-slate-500 hover:text-slate-900")
                          )}
                        >
                          {mode === 'M' ? 'M (月)' : mode === 'Q' ? 'Q (季)' : mode === 'HY' ? 'H (半年)' : 'Y (年)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggested Values & Manual Edit boxes */}
                <div className="space-y-4 p-5 rounded-3xl bg-slate-900/30 border border-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                        <span>Installment Premium</span>
                        <span className="text-[8.5px] font-mono text-amber-500">Suggested</span>
                      </div>
                      <input 
                        type="number" 
                        required
                        step="any"
                        placeholder="e.g. 450.00"
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl border outline-none text-xs transition-colors font-mono",
                          isDarkMode 
                            ? "bg-slate-950 border-slate-800 focus:border-white text-white" 
                            : "bg-white border-slate-200 focus:border-slate-800 text-slate-900"
                        )}
                        value={formInstallmentPref}
                        onChange={e => setFormInstallmentPref(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                        <span>First Year Commission</span>
                        <span className="text-[8.5px] font-mono text-cyan-400">Rate: {(fycRate * 100).toFixed(1)}%</span>
                      </div>
                      <input 
                        type="number" 
                        required
                        step="any"
                        placeholder="e.g. 1512.00"
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl border outline-none text-xs transition-colors font-mono",
                          isDarkMode 
                            ? "bg-slate-950 border-slate-800 focus:border-white text-white" 
                            : "bg-white border-slate-200 focus:border-slate-800 text-slate-900"
                        )}
                        value={formFYC}
                        onChange={e => setFormFYC(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 6 Quick Rate Options Grid */}
                  <div className="space-y-1.5 pt-2.5 border-t border-slate-800/40">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider pl-2 block">
                      Choose FYC Calculation Rate • 快速佣金率比例
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {fycRateOptions.map(opt => {
                        const isSelected = Math.abs(opt.value - fycRate) < 0.005;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleFycRateSelect(opt.value)}
                            className={cn(
                              "py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 border text-center flex flex-col items-center justify-center leading-tight select-none",
                              isSelected
                                ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 font-extrabold shadow-sm shadow-cyan-500/10"
                                : isDarkMode 
                                  ? "bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-950 hover:border-slate-400 shadow-sm"
                            )}
                          >
                            <span>{opt.label}</span>
                            <span className="text-[7.5px] opacity-75 font-medium tracking-tight block mt-0.5">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-time Premium Collections Tracker */}
                  <div className="space-y-2 pt-3 border-t border-slate-800/40">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
                        Premium Collections Month Grid • 保费回款月份 (1-12月)
                      </span>
                      <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md font-bold uppercase select-none">Auto-populated</span>
                    </div>
                    <div className="flex gap-1 justify-between py-1 overflow-x-auto min-w-full">
                      {formMonthlyPayments.map((payVal, mIdx) => {
                        const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                        const fullNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return (
                          <div key={mIdx} className="flex flex-col items-center gap-1 flex-1 min-w-[24px]">
                            <span className="text-[8px] font-black text-slate-500 uppercase">{monthNames[mIdx]}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextPayments = [...formMonthlyPayments];
                                nextPayments[mIdx] = (nextPayments[mIdx] + 1) % 3;
                                setFormMonthlyPayments(nextPayments);
                                
                                // Recalculate and update the FYC input in the form live!
                                const installNum = parseFloat(formInstallmentPref) || 0;
                                const totalPayments = nextPayments.reduce((acc, curr) => acc + curr, 0);
                                const collectedSum = installNum * totalPayments;
                                if (collectedSum > 0) {
                                  setFormFYC((collectedSum * fycRate).toFixed(2));
                                } else {
                                  const anpNum = parseFloat(formANP) || 0;
                                  setFormFYC((anpNum * fycRate).toFixed(2));
                                }
                              }}
                              title={`${fullNames[mIdx]} payment counter`}
                              className={cn(
                                "w-[26px] h-[26px] sm:w-7 sm:h-7 rounded-xl transition-all text-[10px] font-mono font-black border text-center flex items-center justify-center select-none active:scale-90",
                                payVal === 0 
                                  ? (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600" : "bg-white border-slate-200 text-slate-300 hover:border-slate-400")
                                  : payVal === 1
                                    ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-400 hover:opacity-85"
                                    : "bg-emerald-500/25 border-emerald-500 text-emerald-400 hover:opacity-85"
                              )}
                            >
                              {payVal}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-time Summary Indicators */}
                  <div className="pt-3 border-t border-slate-800/40 grid grid-cols-3 gap-2">
                    <div className="bg-slate-950/40 p-2 rounded-xl text-center border border-slate-900/50">
                      <span className="text-[7.5px] font-bold text-slate-500 uppercase block leading-none">Collected (已收)</span>
                      <span className="text-[10px] sm:text-[11px] font-mono font-black text-emerald-400 mt-1 block">
                        RM {formatNumber(((parseFloat(formInstallmentPref) || 0) * formMonthlyPayments.reduce((acc, curr) => acc + curr, 0)))}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-2 rounded-xl text-center border border-slate-900/50">
                      <span className="text-[7.5px] font-bold text-slate-500 uppercase block leading-none">fyc (首年佣金)</span>
                      <span className="text-[10px] sm:text-[11px] font-mono font-black text-cyan-400 mt-1 block">
                        RM {formatNumber((parseFloat(formFYC) || 0))}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-2 rounded-xl text-center border border-slate-900/50">
                      <span className="text-[7.5px] font-bold text-slate-500 uppercase block leading-none">Carried fwd (转结下年)</span>
                      <span className="text-[10px] sm:text-[11px] font-mono font-black text-indigo-400 mt-1 block">
                        RM {formatNumber(Math.max(0, (parseFloat(formANP) || 0) - ((parseFloat(formInstallmentPref) || 0) * formMonthlyPayments.reduce((acc, curr) => acc + curr, 0))))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Supplementary Memo (理赔备注 / 备注 - 可空)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Referred via friend Lee, Medical card rider"
                    className={cn(
                      "w-full px-4 py-3 rounded-2xl border outline-none text-xs transition-colors font-medium",
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 focus:border-white text-white" 
                        : "bg-slate-50 border-slate-200 focus:border-slate-800 text-slate-900"
                    )}
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                  />
                </div>

                <div className="mt-6 flex gap-3 shrink-0 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-colors",
                      isDarkMode 
                        ? "bg-transparent border-slate-800 text-slate-400 hover:text-white" 
                        : "bg-transparent border-slate-200 text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className={cn(
                      "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-colors",
                      isDarkMode ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                  >
                    Save File Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

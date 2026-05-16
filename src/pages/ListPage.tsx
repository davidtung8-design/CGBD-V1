import React, { useRef, useState } from 'react';
import { PerfData, FollowupLog } from '../types';
import { UserPlus, Target, Upload, Search, Plus, Trash2, Star, Database, ChevronRight, X, History, Clock, ClipboardPaste } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface ListPageProps {
  perfData: PerfData;
  setPerfData: React.Dispatch<React.SetStateAction<PerfData>>;
  isDarkMode: boolean;
  showToast: (message: string) => void;
}

export const ListPage: React.FC<ListPageProps> = ({ perfData, setPerfData, isDarkMode, showToast }) => {
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'prospect' | 'recruit'>('prospect');
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Reset filter when tab changes
  React.useEffect(() => {
    setFilterCategory('All');
  }, [activeTab]);

  // Follow-up Logs Modal State
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newLogNote, setNewLogNote] = useState('');
  const [newLogDate, setNewLogDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

  // --- Handlers ---
  const handleOpenFollowup = (id: string) => {
    setSelectedNodeId(id);
    setIsFollowupModalOpen(true);
    setNewLogNote('');
    setNewLogDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  };

  const handleAddFollowupLog = () => {
    if (!selectedNodeId || !newLogNote.trim()) return;

    const listKey = activeTab === 'prospect' ? 'prospectList' : 'recruitList';
    const newList = [...perfData[listKey]] as any[];
    const nodeIndex = newList.findIndex(n => n.id === selectedNodeId);
    
    if (nodeIndex === -1) return;

    const node = newList[nodeIndex];

    const newLog: FollowupLog = {
      id: Date.now().toString(),
      datetime: newLogDate,
      note: newLogNote.trim()
    };

    newList[nodeIndex] = {
      ...node,
      followupLogs: [newLog, ...(node.followupLogs || [])]
    };

    setPerfData(prev => ({ ...prev, [listKey]: newList }));
    setNewLogNote('');
    showToast('跟进记录已成功添加。');
  };

  const removeFollowupLog = (logId: string) => {
    if (!selectedNodeId) return;
    const listKey = activeTab === 'prospect' ? 'prospectList' : 'recruitList';
    const newList = [...perfData[listKey]] as any[];
    const nodeIndex = newList.findIndex(n => n.id === selectedNodeId);
    
    if (nodeIndex === -1) return;

    const node = newList[nodeIndex];
    
    newList[nodeIndex] = {
      ...node,
      followupLogs: (node.followupLogs || []).filter((l: any) => l.id !== logId)
    };

    setPerfData(prev => ({ ...prev, [listKey]: newList }));
  };

  const handleImportVCF = (type: 'prospect' | 'recruit', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) return;

        // Improved vCard parser
        const contacts: { name: string, tel: string }[] = [];
        let currentContact: { name?: string, tel?: string } = {};
        
        const rawLines = content.split(/\r?\n/);
        const lines: string[] = [];
        rawLines.forEach(line => {
          if (line.startsWith(' ') || line.startsWith('\t')) {
            if (lines.length > 0) lines[lines.length - 1] += line.substring(1);
          } else {
            lines.push(line);
          }
        });

        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;
          if (trimmedLine.toUpperCase().startsWith('BEGIN:VCARD')) currentContact = {};
          
          const colonIdx = trimmedLine.indexOf(':');
          if (colonIdx === -1) return;

          const keyPart = trimmedLine.substring(0, colonIdx).toUpperCase();
          const valuePart = trimmedLine.substring(colonIdx + 1).trim();

          if (keyPart === 'FN' || keyPart.endsWith('.FN')) {
            currentContact.name = valuePart;
          } else if ((keyPart === 'N' || keyPart.endsWith('.N')) && !currentContact.name) {
            const nameParts = valuePart.split(';').filter(Boolean);
            if (nameParts.length >= 2) currentContact.name = `${nameParts[1]} ${nameParts[0]}`.trim();
            else currentContact.name = nameParts.join(' ').trim();
          }

          if (keyPart.includes('TEL')) {
            if (valuePart) currentContact.tel = valuePart;
          }

          if (trimmedLine.toUpperCase().startsWith('END:VCARD')) {
            if (currentContact.name) {
              contacts.push({ name: currentContact.name, tel: currentContact.tel || '' });
            }
          }
        });

        if (contacts.length === 0) {
          alert('未在文件中检测到有效的联系人信息。');
          return;
        }

        const newEntries = contacts.map(c => ({
          id: crypto.randomUUID(),
          name: c.name,
          job: '',
          isPinned: false,
          category: '未分类' as any,
          followupLogs: [],
          ...(type === 'prospect' ? { plan: '', note: c.tel } : { interest: '0', followup: c.tel })
        }));

        setPerfData(prev => ({
          ...prev,
          [type === 'prospect' ? 'prospectList' : 'recruitList']: [
            ...prev[type === 'prospect' ? 'prospectList' : 'recruitList'],
            ...newEntries
          ]
        }));
        showToast(`已导入 ${contacts.length} 位联系人。`);
        if (e.target) e.target.value = '';
      } catch (err) {
        console.error("VCF Parse Error:", err);
        alert("解析 VCF 文件时发生错误。");
      }
    };
    reader.readAsText(file);
  };

  const handleImportContacts = async (type: 'prospect' | 'recruit') => {
    const isContactPickerSupported = 'contacts' in navigator && 'select' in (navigator as any).contacts;
    if (!isContactPickerSupported) {
      const confirmVCF = confirm('您的浏览器不支持直接读取通讯录。建议导入 .vcf 文件（iCloud/通讯录共享导出）。\n\n是否打开文件选择器？');
      if (confirmVCF) vcfInputRef.current?.click();
      return;
    }

    try {
      const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
      if (contacts?.length > 0) {
        const newEntries = contacts.map((c: any) => ({
          id: crypto.randomUUID(),
          name: Array.isArray(c.name) ? c.name[0] : (typeof c.name === 'string' ? c.name : 'Unknown'),
          job: '',
          isPinned: false,
          category: '未分类' as any,
          followupLogs: [],
          ...(type === 'prospect' 
            ? { plan: '', note: Array.isArray(c.tel) ? c.tel[0] : (typeof c.tel === 'string' ? c.tel : '') } 
            : { interest: '0', followup: Array.isArray(c.tel) ? c.tel[0] : (typeof c.tel === 'string' ? c.tel : '') })
        }));

        setPerfData(prev => ({
          ...prev,
          [type === 'prospect' ? 'prospectList' : 'recruitList']: [
            ...prev[type === 'prospect' ? 'prospectList' : 'recruitList'],
            ...newEntries
          ]
        }));
        showToast(`已同步 ${newEntries.length} 位联系人。`);
      }
    } catch (err) { console.error('Contact select error:', err); }
  };

  const currentList = activeTab === 'prospect' ? perfData.prospectList : perfData.recruitList;
  const filteredEntries = currentList.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activeTab === 'prospect' 
        ? (item as any).note.toLowerCase().includes(searchTerm.toLowerCase()) 
        : (item as any).followup.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = !showOnlyPinned || item.isPinned;
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const prospectCategories = ['跟进中', '已成交', '需要服务', 'KIV', '拒绝', '未分类'];
  const recruitCategories = ['跟进中', '已经考试', '90 days jumpstart', 'attend MIP COP', 'SG trip', 'KIV', '未分类'];
  const categories = activeTab === 'prospect' ? prospectCategories : recruitCategories;

  const addNew = (type: 'prospect' | 'recruit') => {
    const newItem = { 
      id: crypto.randomUUID(),
      name: type === 'prospect' ? 'New Prospect' : 'New Recruit', 
      job: '', 
      isPinned: true,
      category: '跟进中' as any,
      followupLogs: [],
      ...(type === 'prospect' ? { plan: '', note: '' } : { interest: '0', followup: '' }) 
    };
    setPerfData(prev => ({ ...prev, [type === 'prospect' ? 'prospectList' : 'recruitList']: [newItem, ...prev[type === 'prospect' ? 'prospectList' : 'recruitList']] }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`成功创建新的 ${type === 'prospect' ? '准客户' : '准增员'} 节点。`);
  };

  const togglePin = (type: 'prospect' | 'recruit', id: string) => {
    setPerfData(prev => {
      const listKey = type === 'prospect' ? 'prospectList' : 'recruitList';
      const newList = (prev[listKey] as any[]).map(item => item.id === id ? { ...item, isPinned: !item.isPinned } : item);
      return { ...prev, [listKey]: newList };
    });
  };

  const removeEntry = (type: 'prospect' | 'recruit', id: string) => {
    setPerfData(prev => {
      const listKey = type === 'prospect' ? 'prospectList' : 'recruitList';
      const newList = (prev[listKey] as any[]).filter(item => item.id !== id);
      return { ...prev, [listKey]: newList };
    });
    showToast("节点已成功从数据库中移除。 (Node deleted)");
  };

  const pinnedEntries = filteredEntries.filter(x => x.isPinned);

  return (
    <div className="animate-fadeIn space-y-8 pb-24">
      <div className={cn(
        "bento-card p-6 sticky top-0 z-40 backdrop-blur-xl border-b shadow-2xl space-y-4",
        isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/95 border-slate-200"
      )}>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex bg-slate-800/10 p-1.5 rounded-[1.5rem] border border-slate-800/10 shrink-0">
            <button onClick={() => setActiveTab('prospect')} className={cn("px-8 py-3 rounded-[1.2rem] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'prospect' ? "bg-blue-500 text-white shadow-xl" : "text-slate-500")}>
              <Target size={14} /> Prospects
            </button>
            <button onClick={() => setActiveTab('recruit')} className={cn("px-8 py-3 rounded-[1.2rem] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'recruit' ? "bg-emerald-500 text-white shadow-xl" : "text-slate-500")}>
              <UserPlus size={14} /> Recruits
            </button>
          </div>

          <div className="flex-1 w-full relative">
            <input 
              type="text"
              placeholder={`Search database...`}
              className={cn("w-full h-14 pl-14 pr-6 rounded-[1.5rem] border outline-none transition-all font-medium", isDarkMode ? "bg-slate-900 border-slate-800 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterCategory('All')} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest", filterCategory === 'All' ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500")}>All</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest", filterCategory === cat ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500")}>{cat}</button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowOnlyPinned(!showOnlyPinned)} className={cn("h-14 px-5 rounded-[1.5rem] border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", showOnlyPinned ? "bg-amber-500 text-white shadow-lg" : "bg-white text-slate-500")}>
              <Star size={16} fill={showOnlyPinned ? "currentColor" : "none"} />
              {showOnlyPinned ? "Pinned" : "All"}
            </button>
            <button onClick={() => addNew(activeTab)} className="h-14 px-6 bg-slate-900 text-white dark:bg-white dark:text-black rounded-[1.5rem] font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-xl">
              <Plus size={16} /> New Node
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pinnedEntries.length > 0 && !showOnlyPinned && searchTerm === '' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 px-2">
            <div className="flex items-center gap-2 px-6 mb-4">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Strategic Focus Matrix</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pinnedEntries.map((item, idx) => (
                <div key={item.id} className={cn("bento-card p-6 border-l-4 relative group transition-all hover:scale-[1.02]", activeTab === 'prospect' ? "border-l-blue-500" : "border-l-emerald-500", isDarkMode ? "bg-slate-900/60" : "bg-white shadow-xl shadow-slate-200/50")}>
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
                      <button 
                        onClick={() => togglePin(activeTab, item.id)} 
                        className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all"
                      >
                        <Star size={18} fill="currentColor" />
                      </button>
                      <button 
                        onClick={() => removeEntry(activeTab, item.id)} 
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-lg text-white">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{item.job || 'Industry / Role'}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl text-[11px] font-mono", isDarkMode ? "bg-slate-950/50 text-slate-400" : "bg-slate-50 text-slate-600")}>
                      {activeTab === 'prospect' ? (item as any).plan : `CFG Code: ${(item as any).interest}`}
                    </div>
                    <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-slate-500">
                      <span># Focus Node {idx + 1}</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("bento-card overflow-hidden border relative", isDarkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
        <input type="file" ref={vcfInputRef} className="hidden" accept=".vcf" onChange={(e) => handleImportVCF(activeTab, e)} />
        <div className="p-8 border-b border-slate-800/10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <div className={cn("p-4 rounded-[1.5rem]", activeTab === 'prospect' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500")}>
               <Database size={24} />
             </div>
             <div>
               <h2 className={cn("text-sm font-black uppercase tracking-[0.3em]", isDarkMode ? "text-slate-200" : "text-slate-800")}>Matrix Database Master File</h2>
               <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-widest">Index: {currentList.length} Operational Capacity</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleImportContacts(activeTab)} className={cn("flex items-center gap-2 px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all", isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500 shadow-sm")}>
              <UserPlus size={14} /> Phone Sync
            </button>
            <button onClick={() => vcfInputRef.current?.click()} className={cn("flex items-center gap-2 px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all", isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500 shadow-sm")}>
              <Upload size={14} /> VCF Import
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 z-30">
              <tr className={cn("uppercase tracking-tighter border-b backdrop-blur-md", isDarkMode ? "bg-slate-900/90 text-slate-500 border-slate-800" : "bg-slate-50/95 text-slate-400 border-slate-200")}>
                <th className="p-5 font-black w-24">Focus</th>
                <th className="p-5 font-black min-w-[200px]">Node Identity</th>
                <th className="p-5 font-black min-w-[120px]">Category</th>
                <th className="p-5 font-black min-w-[180px]">Organization / Role</th>
                <th className="p-5 font-black min-w-[200px]">{activeTab === 'prospect' ? 'Strategic Plan' : 'CFG Code'}</th>
                <th className="p-5 font-black min-w-[120px] text-center">History</th>
                <th className="p-5 font-black min-w-[300px]">Operational Logs</th>
                <th className="p-5 font-black w-20 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800/30" : "divide-slate-100")}>
              {filteredEntries.map((item) => (
                <tr key={item.id} className="hover:bg-blue-500/[0.02]">
                  <td className="p-5 text-center">
                    <button onClick={() => togglePin(activeTab, item.id)} className={cn("p-2 rounded-xl border", item.isPinned ? "text-amber-500 border-amber-500/30" : "text-slate-400 border-slate-800/10")}>
                      <Star size={16} fill={item.isPinned ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="p-3">
                    <input className="w-full bg-transparent px-4 py-3 outline-none font-bold" value={item.name} onChange={(e) => {
                      const newList = currentList.map(n => n.id === item.id ? { ...n, name: e.target.value } : n);
                      setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                    }} />
                  </td>
                  <td className="p-3">
                    <select className="w-full bg-transparent px-4 py-3 outline-none appearance-none" value={item.category || '未分类'} onChange={(e) => {
                      const newList = currentList.map(n => n.id === item.id ? { ...n, category: e.target.value as any } : n);
                      setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                    }}>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <input className="w-full bg-transparent px-4 py-3 outline-none text-slate-500" value={item.job} onChange={(e) => {
                      const newList = currentList.map(n => n.id === item.id ? { ...n, job: e.target.value } : n);
                      setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                    }} />
                  </td>
                  <td className="p-3">
                    <input className="w-full bg-transparent px-4 py-3 outline-none" value={activeTab === 'prospect' ? (item as any).plan : (item as any).interest} onChange={(e) => {
                      const newList = currentList.map(n => n.id === item.id ? (activeTab === 'prospect' ? { ...n, plan: e.target.value } : { ...n, interest: e.target.value }) : n);
                      setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                    }} />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleOpenFollowup(item.id)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest", item.followupLogs?.length ? "bg-blue-500 text-white" : "bg-slate-800/10 text-slate-500")}>
                      <History size={12} /> {item.followupLogs?.length || 'HISTORY'}
                    </button>
                  </td>
                  <td className="p-3">
                    <input className="w-full bg-transparent px-4 py-3 outline-none text-[10px]" value={activeTab === 'prospect' ? (item as any).note : (item as any).followup} onChange={(e) => {
                      const newList = currentList.map(n => n.id === item.id ? (activeTab === 'prospect' ? { ...n, note: e.target.value } : { ...n, followup: e.target.value }) : n);
                      setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                    }} />
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => removeEntry(activeTab, item.id)} 
                      className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 mx-auto shadow-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isFollowupModalOpen && selectedNodeId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setIsFollowupModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className={cn("w-full max-w-2xl max-h-[90vh] p-8 rounded-[2.5rem] shadow-2xl space-y-8 border flex flex-col", isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200 text-slate-900")}>
              {(() => {
                const node = currentList.find(n => n.id === selectedNodeId);
                if (!node) return null;
                return (
                  <>
                    <div className="flex justify-between items-center border-b pb-6">
                      <div className="flex items-center gap-4">
                        <History className="text-blue-500" size={24} />
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-widest">Operational History</h3>
                          <p className="text-xs text-slate-500">{node.name}</p>
                        </div>
                      </div>
                      <button onClick={() => setIsFollowupModalOpen(false)}><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-8">
                       <div className="p-6 bg-slate-800/10 rounded-3xl space-y-4">
                         <input type="datetime-local" className="w-full bg-transparent border-b p-2 outline-none" value={newLogDate} onChange={e => setNewLogDate(e.target.value)} />
                         <textarea className="w-full bg-transparent border rounded-xl p-4 h-24 outline-none resize-none" placeholder="Add follow-up notes..." value={newLogNote} onChange={e => setNewLogNote(e.target.value)} />
                         <button onClick={handleAddFollowupLog} className="w-full py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest">Record Session</button>
                       </div>
                       <div className="space-y-4">
                         {node.followupLogs?.map((log: any) => (
                           <div key={log.id} className="p-5 border rounded-2xl relative group">
                             <button onClick={() => removeFollowupLog(log.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                             <div className="text-[10px] text-blue-500 font-bold mb-1">{format(new Date(log.datetime), 'yyyy.MM.dd HH:mm')}</div>
                             <p className="text-sm">{log.note}</p>
                           </div>
                         ))}
                       </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

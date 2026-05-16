import React, { useRef, useState, useCallback } from 'react';
import { PerfData, FollowupLog, Prospect, RecruitCandidate } from '../types';
import { UserPlus, Target, Upload, Search, Plus, Trash2, Star, Database, Filter, ChevronRight, ClipboardPaste, X, History, Calendar, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface ListPageProps {
  perfData: PerfData;
  setPerfData: React.Dispatch<React.SetStateAction<PerfData>>;
  isDarkMode: boolean;
}

export const ListPage: React.FC<ListPageProps> = ({ perfData, setPerfData, isDarkMode }) => {
  const prospectInputRef = useRef<HTMLInputElement>(null);
  const recruitInputRef = useRef<HTMLInputElement>(null);
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'prospect' | 'recruit'>('prospect');
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  // Reset filter when tab changes
  React.useEffect(() => {
    setFilterCategory('All');
  }, [activeTab]);
  const [pasteValue, setPasteValue] = useState('');

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
    alert('跟进记录已成功添加。');
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
  const handlePasteSync = () => {
    if (!pasteValue.trim()) return;
    
    const lines = pasteValue.split(/\r?\n/).filter(l => l.trim());
    const newItems = lines.map(line => {
      // Split by common separators: tab, comma, semicolon, pipe
      const parts = line.split(/[\t,;|]/).map(p => p.trim());
      let name = parts[0];
      let note = parts.slice(1).join(' ');
      
      if (parts.length === 1) {
        const spaceIdx = line.lastIndexOf(' ');
        if (spaceIdx > 0 && /\d/.test(line.substring(spaceIdx))) {
          name = line.substring(0, spaceIdx).trim();
          note = line.substring(spaceIdx).trim();
        }
      }

      return {
        id: crypto.randomUUID(),
        name: name || 'Pasted Node',
        job: '',
        isPinned: false,
        category: '未分类',
        followupLogs: [],
        ...(activeTab === 'prospect' 
          ? { plan: '', note: note } 
          : { interest: '0', followup: note })
      };
    });

    setPerfData(prev => ({
      ...prev,
      [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: [
        ...prev[activeTab === 'prospect' ? 'prospectList' : 'recruitList'],
        ...newItems
      ]
    }));
    
    setPasteValue('');
    setIsPasteModalOpen(false);
    alert(`成功同步：已通过粘贴方式导入 ${newItems.length} 个联系人。`);
  };

  const handleImportVCF = (type: 'prospect' | 'recruit', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("VCF Import started:", file.name, file.size, "bytes");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) {
          console.error("VCF Content is empty");
          alert("文件内容为空，请检查文件是否损坏。");
          return;
        }

        console.log("VCF Content Length:", content.length);

        // Improved vCard parser
        const contacts: { name: string, tel: string }[] = [];
        let currentContact: { name?: string, tel?: string } = {};
        
        // Unfold folded lines
        const rawLines = content.split(/\r?\n/);
        const lines: string[] = [];
        rawLines.forEach(line => {
          if (line.startsWith(' ') || line.startsWith('\t')) {
            if (lines.length > 0) {
              lines[lines.length - 1] += line.substring(1);
            }
          } else {
            lines.push(line);
          }
        });

        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;
          if (trimmedLine.toUpperCase().startsWith('BEGIN:VCARD')) {
            currentContact = {};
          }
          
          const colonIdx = trimmedLine.indexOf(':');
          if (colonIdx === -1) return;

          const keyPart = trimmedLine.substring(0, colonIdx).toUpperCase();
          const valuePart = trimmedLine.substring(colonIdx + 1).trim();

          // Handle Name
          if (keyPart === 'FN' || keyPart.endsWith('.FN')) {
            currentContact.name = valuePart;
          } else if ((keyPart === 'N' || keyPart.endsWith('.N')) && !currentContact.name) {
            const nameParts = valuePart.split(';').filter(Boolean);
            if (nameParts.length >= 2) {
              currentContact.name = `${nameParts[1]} ${nameParts[0]}`.trim();
            } else {
              currentContact.name = nameParts.join(' ').trim();
            }
          }

          // Handle Telephone
          if (keyPart.includes('TEL')) {
            if (valuePart) currentContact.tel = valuePart;
          }

          if (trimmedLine.toUpperCase().startsWith('END:VCARD')) {
            if (currentContact.name) {
              contacts.push({ 
                name: currentContact.name, 
                tel: currentContact.tel || '' 
              });
            }
          }
        });

        if (contacts.length === 0) {
          alert('未在文件中检测到有效的联系人信息。请确保文件是标准的 .vcf 格式。');
          return;
        }

        const newEntries = contacts.map(c => ({
          id: crypto.randomUUID(),
          name: c.name,
          job: '',
          isPinned: false,
          category: '未分类' as any,
          followupLogs: [],
          ...(type === 'prospect' 
            ? { plan: '', note: c.tel } 
            : { interest: '0', followup: c.tel })
        }));

        setPerfData(prev => ({
          ...prev,
          [type === 'prospect' ? 'prospectList' : 'recruitList']: [
            ...prev[type === 'prospect' ? 'prospectList' : 'recruitList'],
            ...newEntries
          ]
        }));
        alert(`已成功导入 ${contacts.length} 位联系人到 ${type === 'prospect' ? '准客户' : '准增员'} 列表。`);
        if (e.target) e.target.value = '';
      } catch (err) {
        console.error("VCF Parse Error:", err);
        alert("解析 VCF 文件时发生错误，请重试。");
      }
    };
    reader.onerror = () => alert('读取文件失败，请重试。');
    reader.readAsText(file);
  };

  const handleImportContacts = async (type: 'prospect' | 'recruit') => {
    const isContactPickerSupported = 'contacts' in navigator && 'select' in (navigator as any).contacts;
    
    if (!isContactPickerSupported) {
      const confirmVCF = confirm('您的浏览器不支持直接读取通讯录（通常是由于 iFrame 限制或浏览器版本过低）。\n\n您可以选择导入 .vCard (.vcf) 文件，这是从 iPhone 搬运联系人最稳妥的方法：\n1. 在手机通讯录选好人 -> 共享联系人 -> 存储到“文件”\n2. 在这里选择刚才存储的文件。\n\n是否现在选择 .vcf 文件进行导入？');
      if (confirmVCF) {
        vcfInputRef.current?.click();
      }
      return;
    }

    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);
      
      if (contacts && contacts.length > 0) {
        const newEntries = contacts.map((c: any) => {
          let name = 'Unknown';
          if (typeof c.name === 'string') name = c.name;
          else if (Array.isArray(c.name) && c.name[0]) name = c.name[0];
          
          let tel = '';
          if (typeof c.tel === 'string') tel = c.tel;
          else if (Array.isArray(c.tel) && c.tel[0]) tel = c.tel[0];

          return {
            id: crypto.randomUUID(),
            name,
            job: '',
            isPinned: false,
            category: '未分类' as any,
            followupLogs: [],
            ...(type === 'prospect' 
              ? { plan: '', note: tel } 
              : { interest: '0', followup: tel })
          };
        });

        setPerfData(prev => ({
          ...prev,
          [type === 'prospect' ? 'prospectList' : 'recruitList']: [
            ...prev[type === 'prospect' ? 'prospectList' : 'recruitList'],
            ...newEntries
          ]
        }));
        alert(`已同步 ${newEntries.length} 位联系人。`);
      }
    } catch (err) { 
      console.error('Contact select error:', err);
      // Optional: don't alert on user cancel
    }
  };
  const currentList = activeTab === 'prospect' ? perfData.prospectList : perfData.recruitList;
  
  const pinnedEntries = currentList.filter(x => x.isPinned);
  const unpinnedEntries = currentList.filter(x => !x.isPinned);

  // Combine for search but keep pinned status
  const filteredEntries = [...pinnedEntries, ...unpinnedEntries].filter(item => {
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

  // --- Handlers ---
  const handleImportCSV = (type: 'prospect' | 'recruit', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const rows = content.split(/\r?\n/).filter(row => row.trim());
      if (rows.length === 0) return;

      // 1. Detect Delimiter
      const firstLine = rows[0];
      const delimiters = [',', ';', '\t', '|'];
      const delimiterCounts = delimiters.map(d => ({
        delimiter: d,
        count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length
      }));
      const bestDelimiter = delimiterCounts.reduce((prev, curr) => curr.count > prev.count ? curr : prev, { delimiter: ',', count: 0 }).delimiter;

      // 2. Parse Rows helper
      const parseRow = (line: string) => {
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === bestDelimiter && !inQuotes) {
            parts.push(current.trim().replace(/^["']|["']$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim().replace(/^["']|["']$/g, ''));
        return parts;
      };

      const parsedRows = rows.map(parseRow);
      const headers = parsedRows[0].map(h => h.toLowerCase());

      // 3. Map Columns
      const mapping = {
        name: headers.findIndex(h => h.includes('name') || h.includes('姓名') || h.includes('名字')),
        job: headers.findIndex(h => h.includes('job') || h.includes('industry') || h.includes('role') || h.includes('occupation') || h.includes('行业') || h.includes('职业')),
        extra: headers.findIndex(h => h.includes('plan') || h.includes('target') || h.includes('计划') || h.includes('interest') || h.includes('score') || h.includes('分数')),
        log: headers.findIndex(h => h.includes('note') || h.includes('log') || h.includes('history') || h.includes('tel') || h.includes('phone') || h.includes('备注') || h.includes('记录') || h.includes('电话'))
      };

      // If no definitive headers found, default to index mapping
      const dataRows = (mapping.name === -1 && mapping.job === -1) ? parsedRows : parsedRows.slice(1);
      
      const newEntries = dataRows.map(row => {
        const name = mapping.name !== -1 ? row[mapping.name] : row[0];
        const job = mapping.job !== -1 ? row[mapping.job] : row[1];
        const extraValue = mapping.extra !== -1 ? row[mapping.extra] : row[2];
        const logValue = mapping.log !== -1 ? row[mapping.log] : row[3];

        return {
          id: crypto.randomUUID(),
          name: name || '',
          job: job || '',
          isPinned: false,
          category: '未分类' as any,
          followupLogs: [],
          ...(type === 'prospect' 
            ? { plan: extraValue || '', note: logValue || '' } 
            : { interest: extraValue || '0', followup: logValue || '' })
        };
      }).filter(x => x.name && x.name !== 'name' && x.name !== '姓名');

      if (newEntries.length === 0) {
        alert('导入失败：未在文件中找到有效数据。请确保 CSV 包含姓名/Name 列。');
        return;
      }

      setPerfData(prev => ({
        ...prev,
        [type === 'prospect' ? 'prospectList' : 'recruitList']: [
          ...prev[type === 'prospect' ? 'prospectList' : 'recruitList'].filter(x => x.name),
          ...newEntries
        ]
      }));
      alert(`CSV 导入成功（检测到分隔符: "${bestDelimiter}"）：已同步 ${newEntries.length} 条记录。`);
      if (e.target) e.target.value = '';
    };
    reader.onerror = () => alert('读取文件失败，请重试。');
    reader.readAsText(file);
  };

  const addNew = (type: 'prospect' | 'recruit') => {
    const listKey = type === 'prospect' ? 'prospectList' : 'recruitList';
    const defaultName = type === 'prospect' ? 'New Prospect' : 'New Recruit';
    const newItem = { 
      id: crypto.randomUUID(),
      name: defaultName, 
      job: '', 
      isPinned: true, // Auto-pin new manual entries to ensure visibility at top
      category: '跟进中' as any,
      followupLogs: [],
      ...(type === 'prospect' ? { plan: '', note: '' } : { interest: '0', followup: '' }) 
    };
    
    setPerfData(prev => ({
      ...prev,
      [listKey]: [newItem, ...prev[listKey]]
    }));
    
    // Smooth scroll to top of matrix if possible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert(`成功创建新的 ${type === 'prospect' ? '准客户' : '准增员'} 节点。请在顶部的“战略重点”区域查看。`);
  };

  const togglePin = (type: 'prospect' | 'recruit', id: string) => {
    setPerfData(prev => {
      const listKey = type === 'prospect' ? 'prospectList' : 'recruitList';
      const newList = (prev[listKey] as any[]).map(item => 
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      );
      return { ...prev, [listKey]: newList };
    });
  };

  const removeEntry = (type: 'prospect' | 'recruit', id: string) => {
    if (!confirm('Warning: This will permanently delete this node from the database.')) return;
    setPerfData(prev => {
      const listKey = type === 'prospect' ? 'prospectList' : 'recruitList';
      const newList = (prev[listKey] as any[]).filter(item => item.id !== id);
      return { ...prev, [listKey]: newList };
    });
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-24">
      {/* Search & Mode Controller */}
      <div className={cn(
        "bento-card p-6 sticky top-0 z-40 backdrop-blur-xl border-b shadow-2xl space-y-4",
        isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/95 border-slate-200"
      )}>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex bg-slate-800/10 p-1.5 rounded-[1.5rem] border border-slate-800/10 shrink-0">
            <button 
              onClick={() => setActiveTab('prospect')}
              className={cn(
                "px-8 py-3 rounded-[1.2rem] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'prospect' 
                  ? "bg-blue-500 text-white shadow-xl" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Target size={14} /> Prospects
            </button>
            <button 
              onClick={() => setActiveTab('recruit')}
              className={cn(
                "px-8 py-3 rounded-[1.2rem] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'recruit' 
                  ? "bg-emerald-500 text-white shadow-xl" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <UserPlus size={14} /> Recruits
            </button>
          </div>

          <div className="flex-1 w-full relative">
            <input 
              type="text"
              placeholder={`Search matrix database nodes (Currently: ${currentList.filter(x => x.name).length} recorded)...`}
              className={cn(
                "w-full h-14 pl-14 pr-6 rounded-[1.5rem] border outline-none transition-all font-medium text-base",
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-white focus:border-blue-500 placeholder:text-slate-600" 
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 placeholder:text-slate-400"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          </div>

          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button 
              onClick={() => setFilterCategory('All')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                filterCategory === 'All' 
                  ? "bg-slate-700 text-white" 
                  : (isDarkMode ? "bg-slate-800/30 text-slate-500 hover:text-slate-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200")
              )}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  filterCategory === cat 
                    ? "bg-blue-500 text-white" 
                    : (isDarkMode ? "bg-slate-800/30 text-slate-500 hover:text-slate-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200")
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowOnlyPinned(!showOnlyPinned)}
              className={cn(
                "h-14 px-5 rounded-[1.5rem] border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                showOnlyPinned 
                  ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/20 shadow-lg" 
                  : (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600" : "bg-white border-slate-200 text-slate-500")
              )}
            >
              <Star size={16} fill={showOnlyPinned ? "currentColor" : "none"} />
              {showOnlyPinned ? "Pinned Only" : "Show All"}
            </button>
            <button 
              onClick={() => addNew(activeTab)}
              className="h-14 px-6 bg-slate-900 text-white dark:bg-white dark:text-black rounded-[1.5rem] font-bold flex items-center gap-2 hover:opacity-80 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-xl"
            >
              <Plus size={16} /> New Node
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Focus Matrix (Pinned Section) */}
      <AnimatePresence>
        {pinnedEntries.length > 0 && !showOnlyPinned && searchTerm === '' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 px-2"
          >
            <div className="flex items-center gap-2 px-6 mb-4">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
                {activeTab === 'prospect' ? "Strategic Focus Matrix (Top 20+ Focus)" : "Recruit Talent Pipeline"}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pinnedEntries.map((item, idx) => {
                return (
                  <motion.div 
                    layout
                    key={item.id}
                    className={cn(
                      "bento-card p-6 border-l-4 relative group transition-all hover:scale-[1.02]",
                      activeTab === 'prospect' ? "border-l-blue-500" : "border-l-emerald-500",
                      isDarkMode ? "bg-slate-900/60" : "bg-white shadow-xl shadow-slate-200/50"
                    )}
                  >
                    <button 
                      onClick={() => togglePin(activeTab, item.id)}
                      className="absolute top-4 right-4 text-amber-500 hover:scale-125 transition-transform"
                    >
                      <Star size={16} fill="currentColor" />
                    </button>
                    <div className="space-y-4">
                      <div>
                        <input 
                          className="bg-transparent border-none outline-none font-bold text-lg text-white w-full"
                          value={item.name}
                          onChange={(e) => {
                            const newList = currentList.map(node => 
                              node.id === item.id ? { ...node, name: e.target.value } : node
                            );
                            setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                          }}
                        />
                        <input 
                          className="bg-transparent border-none outline-none text-[10px] text-slate-500 uppercase tracking-widest block"
                          value={item.job}
                          placeholder="Industry / Role"
                          onChange={(e) => {
                            const newList = currentList.map(node => 
                              node.id === item.id ? { ...node, job: e.target.value } : node
                            );
                            setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                          }}
                        />
                      </div>
                      <div className={cn(
                        "p-3 rounded-xl text-[11px] font-mono leading-snug",
                        isDarkMode ? "bg-slate-950/50 text-slate-400" : "bg-slate-50 text-slate-600"
                      )}>
                        {activeTab === 'prospect' ? (item as any).plan : `CFG: ${(item as any).interest}`}
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-slate-500">
                        <span># Focus Node {idx + 1}</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Master Database Table */}
      <div className={cn(
        "bento-card overflow-hidden transition-all duration-500 border relative",
        isDarkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
      )}>
        <input type="file" ref={prospectInputRef} className="hidden" accept=".csv" onChange={(e) => handleImportCSV('prospect', e)} />
        <input type="file" ref={recruitInputRef} className="hidden" accept=".csv" onChange={(e) => handleImportCSV('recruit', e)} />
        <input type="file" ref={vcfInputRef} className="hidden" accept=".vcf,text/vcard,text/x-vcard" onChange={(e) => handleImportVCF(activeTab, e)} />

        <div className="p-8 border-b border-slate-800/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className={cn(
               "p-4 rounded-[1.5rem]",
               activeTab === 'prospect' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
             )}>
               <Database size={24} />
             </div>
             <div>
               <h2 className={cn(
                 "text-sm font-black uppercase tracking-[0.3em]",
                 isDarkMode ? "text-slate-200" : "text-slate-800"
               )}>
                 Matrix Database Master File
               </h2>
               <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-widest">
                 Index: {currentList.filter(x => x.name).length} / 2500+ Operational Capacity
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPasteModalOpen(true)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <ClipboardPaste size={14} /> Paste Matrix
            </button>
            <button 
              onClick={() => handleImportContacts(activeTab)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <UserPlus size={14} /> Phone Sync
            </button>
            <button 
              onClick={() => vcfInputRef.current?.click()}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <Upload size={14} /> VCF Import
            </button>
            <button 
              onClick={() => (activeTab === 'prospect' ? prospectInputRef : recruitInputRef).current?.click()}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <Upload size={14} /> Bulk CSV
            </button>
          </div>
        </div>

        {/* Paste Modal */}
        <AnimatePresence>
          {isPasteModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/20">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "w-full max-w-xl p-8 rounded-[2rem] shadow-2xl space-y-6 border",
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest">Paste Matrix Sync</h3>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">直接从备忘录或微信粘贴名字和电话</p>
                  </div>
                  <button onClick={() => setIsPasteModalOpen(false)} className="p-2 hover:bg-slate-800/10 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 italic">格式举例：<br/>张三 13812345678<br/>李四 012-3456789</p>
                  <textarea 
                    className={cn(
                      "w-full h-64 p-6 rounded-3xl border outline-none font-mono text-sm resize-none custom-scrollbar transition-all",
                      isDarkMode ? "bg-slate-900 border-slate-800 focus:border-blue-500" : "bg-slate-50 border-slate-200 focus:border-blue-500"
                    )}
                    placeholder="在此处粘贴您的联系人列表..."
                    value={pasteValue}
                    onChange={(e) => setPasteValue(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsPasteModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest border border-slate-800/20 text-slate-500 hover:bg-slate-800/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePasteSync}
                    className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    Sync Pinned Nodes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto custom-scrollbar overflow-y-auto max-h-[70vh]">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 z-30">
              <tr className={cn(
                "uppercase tracking-tighter border-b backdrop-blur-md",
                isDarkMode ? "bg-slate-900/90 text-slate-500 border-slate-800" : "bg-slate-50/95 text-slate-400 border-slate-200"
              )}>
                <th className="p-5 font-black w-24">Focus</th>
                <th className="p-5 font-black min-w-[200px]">Node Identity</th>
                <th className="p-5 font-black min-w-[120px]">Category</th>
                <th className="p-5 font-black min-w-[180px]">Organization / Role</th>
                <th className="p-5 font-black min-w-[200px]">{activeTab === 'prospect' ? 'Strategic Plan' : 'CFG Code'}</th>
                <th className="p-5 font-black min-w-[120px] text-center bg-blue-500/5">Follow-up History</th>
                <th className="p-5 font-black min-w-[300px]">Lifecycle Ops Logs</th>
                <th className="p-5 font-black w-20 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800/30" : "divide-slate-100")}>
              {filteredEntries.map((item, idx) => {
                const originalIndex = currentList.findIndex(n => n.id === item.id);
                return (
                  <tr key={item.id} className={cn(
                    "group transition-all",
                    isDarkMode ? "hover:bg-blue-500/[0.04]" : "hover:bg-blue-500/[0.01]"
                  )}>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => togglePin(activeTab, item.id)}
                        className={cn(
                          "p-2 rounded-xl border transition-all",
                          item.isPinned 
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                            : "border-slate-800/10 text-slate-700 hover:border-amber-500/30 hover:text-amber-500"
                        )}
                      >
                        <Star size={16} fill={item.isPinned ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className="p-3">
                      <input 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all placeholder:text-slate-800 font-bold",
                          isDarkMode ? "text-white focus:bg-slate-800 focus:border-blue-500/50" : "text-slate-900 focus:bg-white focus:border-blue-500/50"
                        )}
                        value={item.name}
                        placeholder="Initialize Node..."
                        onChange={(e) => {
                          const newList = currentList.map(node => 
                            node.id === item.id ? { ...node, name: e.target.value } : node
                          );
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <select 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all text-[11px] font-bold appearance-none cursor-pointer",
                          isDarkMode ? "text-slate-300 focus:bg-slate-800 focus:border-blue-500/50" : "text-slate-600 focus:bg-white focus:border-blue-500/50"
                        )}
                        value={item.category || '未分类'}
                        onChange={(e) => {
                          const newList = currentList.map(node => 
                            node.id === item.id ? { ...node, category: e.target.value as any } : node
                          );
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat} className={isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                       <input 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all placeholder:text-slate-800",
                          isDarkMode ? "text-slate-400 focus:bg-slate-800 focus:border-blue-500/50" : "text-slate-600 focus:bg-white focus:border-blue-500/50"
                        )}
                        value={item.job}
                        placeholder="Organization..."
                        onChange={(e) => {
                          const newList = currentList.map(node => 
                            node.id === item.id ? { ...node, job: e.target.value } : node
                          );
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      />
                    </td>
                    <td className="p-3">
                       <input 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all placeholder:text-slate-800",
                          activeTab === 'prospect' ? (isDarkMode ? "text-blue-400" : "text-blue-600") : (isDarkMode ? "text-emerald-400" : "text-emerald-600"),
                          "focus:bg-slate-800 focus:border-blue-500/50"
                        )}
                        value={activeTab === 'prospect' ? (item as any).plan : (item as any).interest}
                        placeholder={activeTab === 'prospect' ? "Strategic Plan..." : "CFG Code"}
                        onChange={(e) => {
                          const newList = currentList.map(node => {
                            if (node.id === item.id) {
                              if (activeTab === 'prospect') return { ...node, plan: e.target.value };
                              else return { ...node, interest: e.target.value };
                            }
                            return node;
                          });
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      />
                    </td>
                    <td className="p-3 text-center bg-blue-500/[0.02]">
                      <button 
                        onClick={() => handleOpenFollowup(item.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest transition-all",
                          item.followupLogs && item.followupLogs.length > 0
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                            : "bg-slate-800/10 text-slate-500 border border-slate-800/10 hover:border-blue-500/30 hover:text-blue-500 hover:bg-blue-500/5"
                        )}
                      >
                        <History size={12} />
                        {item.followupLogs?.length ? `${item.followupLogs.length} LOGS` : 'HISTORY'}
                      </button>
                    </td>
                    <td className="p-3">
                       <input 
                        className={cn(
                          "w-full bg-transparent border border-transparent rounded-[1rem] px-4 py-3 outline-none transition-all placeholder:text-slate-800 text-[10px]",
                          isDarkMode ? "text-slate-500 focus:bg-slate-800 focus:border-blue-500/50" : "text-slate-400 focus:bg-white focus:border-blue-500/50"
                        )}
                        value={activeTab === 'prospect' ? (item as any).note : (item as any).followup}
                        placeholder="Operational Logs / History Tracking..."
                        onChange={(e) => {
                          const newList = currentList.map(node => {
                            if (node.id === item.id) {
                              if (activeTab === 'prospect') return { ...node, note: e.target.value };
                              else return { ...node, followup: e.target.value };
                            }
                            return node;
                          });
                          setPerfData(prev => ({ ...prev, [activeTab === 'prospect' ? 'prospectList' : 'recruitList']: newList }));
                        }}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => removeEntry(activeTab, item.id)}
                        className="p-4 text-slate-800 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                        title="Destroy Node"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEntries.length === 0 && (
            <div className="p-32 text-center text-slate-500 space-y-6">
              <div className="w-16 h-16 bg-slate-800/10 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="opacity-20" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-400">Zero Nodes Detected</p>
                <p className="text-xs uppercase tracking-widest mt-2">{searchTerm ? 'Filters returned no matches' : 'Database is currently uninitialized'}</p>
              </div>
              <button 
                onClick={() => setSearchTerm('')} 
                className="px-6 py-2 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-500/10 transition-all"
              >
                Reset Matrix Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Logs Modal */}
      <AnimatePresence>
        {isFollowupModalOpen && selectedNodeId && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 cursor-pointer"
            onClick={() => {
              setIsFollowupModalOpen(false);
              setSelectedNodeId(null);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              className={cn(
                "w-full max-w-2xl max-h-[90vh] p-8 rounded-[2.5rem] shadow-2xl space-y-8 border relative overflow-hidden flex flex-col cursor-default",
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              {(() => {
                const node = currentList.find(n => n.id === selectedNodeId);
                if (!node) return null;

                return (
                  <>
                    {/* Header */}
                    <div className="flex justify-between items-start flex-shrink-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-500">
                          <History size={18} />
                          <h3 className="text-sm font-black uppercase tracking-[0.2em]">Follow-up Operational History</h3>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">
                          {node.name || 'Unknown Node'}
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                          Node ID: {node.id.substring(0, 8)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setIsFollowupModalOpen(false);
                            setSelectedNodeId(null);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            isDarkMode ? "hover:bg-slate-800/50 border-slate-800 text-slate-400" : "hover:bg-slate-100 border-slate-200 text-slate-600"
                          )}
                        >
                          Close
                        </button>
                        <button 
                          onClick={() => {
                            setIsFollowupModalOpen(false);
                            setSelectedNodeId(null);
                          }}
                          className="p-3 hover:bg-slate-800/10 rounded-full transition-colors"
                        >
                          <X size={24} className="text-slate-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
                      {/* Add New Log Section */}
                      <div className={cn(
                        "p-6 rounded-[2rem] space-y-4 border flex-shrink-0",
                        isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
                      )}>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                              <Clock size={12} /> Appointment Datetime
                            </label>
                            <input 
                              type="datetime-local"
                              className={cn(
                                "w-full h-12 px-4 rounded-xl border outline-none font-medium transition-all",
                                isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500"
                              )}
                              value={newLogDate}
                              onChange={(e) => setNewLogDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <ClipboardPaste size={12} /> Follow-up Summary Note
                          </label>
                          <textarea 
                            className={cn(
                              "w-full h-32 p-4 rounded-2xl border outline-none font-medium transition-all resize-none",
                              isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500"
                            )}
                            placeholder="Enter strategic follow-up details, decisions, or next steps..."
                            value={newLogNote}
                            onChange={(e) => setNewLogNote(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={handleAddFollowupLog}
                          disabled={!newLogNote.trim()}
                          className="w-full h-12 bg-blue-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> Record Follow-up Session
                        </button>
                      </div>

                      {/* Logs List */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">History Records ({node.followupLogs?.length || 0})</h4>
                        <div className="space-y-3">
                          {node.followupLogs?.map((log: any) => (
                            <motion.div 
                              key={log.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "p-5 rounded-2xl border relative group",
                                isDarkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                              )}
                            >
                              <button 
                                onClick={() => removeFollowupLog(log.id)}
                                className="absolute top-4 right-4 p-2 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-bold text-blue-500 font-mono tracking-widest">
                                  {format(new Date(log.datetime), 'yyyy.MM.dd HH:mm')}
                                </span>
                              </div>
                              <p className={cn(
                                "text-sm font-medium leading-relaxed",
                                isDarkMode ? "text-slate-300" : "text-slate-700"
                              )}>
                                {log.note}
                              </p>
                            </motion.div>
                          ))}
                          {(!node.followupLogs || node.followupLogs?.length === 0) && (
                            <div className="text-center py-12 opacity-30">
                              <History size={40} className="mx-auto mb-3" />
                              <p className="text-[10px] uppercase font-black tracking-widest">No history logs recorded yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-4 pt-4 border-t border-slate-800/10 flex-shrink-0">
                      <button 
                        onClick={() => {
                          setIsFollowupModalOpen(false);
                          setSelectedNodeId(null);
                        }}
                        className={cn(
                          "flex-1 h-16 rounded-2xl border font-black text-[12px] uppercase tracking-widest active:scale-[0.98] transition-all",
                          isDarkMode 
                            ? "bg-slate-900 border-slate-800 text-white hover:bg-slate-800 shadow-xl" 
                            : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 shadow-md"
                        )}
                      >
                        Exit Operational History
                      </button>
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

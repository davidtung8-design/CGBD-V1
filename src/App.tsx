/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Activity, CalendarEvent, TodoItem, DailyData, 
  MonthlyRecord, TeamMember, Prospect, RecruitCandidate, 
  Milestone, PerfData, ThemeKey, ThemeConfig 
} from './types';
import { Header } from './components/Header';
import { Home, Target, ClipboardList, Zap, Settings, Plus, Minus, Trash2, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Edit3, Award, Trophy, Calendar, CalendarPlus, History, X, BookOpen, PieChart as PieChartIcon, ListTodo, Volume2, VolumeX, CloudRain, Moon, Waves, Coffee } from 'lucide-react';
import { THEMES, ACTIVITIES, ENCOURAGEMENTS, GROUP_CONFIG } from './constants';
import { formatNumber, cn, getLunarDate, formatHour, formatTimeRange } from './lib/utils';
import * as XLSX from 'xlsx';
import { 
  format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, 
  isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, addMonths, subMonths, isToday
} from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  doc, setDoc, getDoc, getDocs, collection, query, where, onSnapshot, 
  writeBatch, deleteDoc, Timestamp, addDoc, orderBy, limit, serverTimestamp 
} from 'firebase/firestore';
import { db, auth, logout, handleRedirectResult, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';
import { PerformancePage } from './pages/PerformancePage';
import { ListPage } from './pages/ListPage';
import { ActionPage3v6R } from './pages/ActionPage3v6R';
import { SettingsPage } from './pages/SettingsPage';
import { AwardsPage } from './pages/AwardsPage';

// --- Default States ---
const DEFAULT_MONTHLY: MonthlyRecord[] = [
  { m: "1月", a: 130000 },
  { m: "2月", a: 130000 },
  { m: "3月", a: 130000 },
  { m: "4月", a: 145211 },
  { m: "5月", a: 0 },
  { m: "6月", a: 0 },
  { m: "7月", a: 0 },
  { m: "8月", a: 0 },
  { m: "9月", a: 0 },
  { m: "10月", a: 0 },
  { m: "11月", a: 0 },
  { m: "12月", a: 0 }
].map(data => ({
  month: data.m, target: 50000, actual: data.a, noc: 0, anp: 0, fyc: 0, recruitTarget: (data.m === "12月" ? 2 : 1), recruitActual: 0
}));

export const ambientSounds = {
  rain: 'https://cdn.pixabay.com/audio/2022/03/24/audio_3d1a3c7a3a.mp3',
  zen: 'https://cdn.pixabay.com/audio/2022/07/04/audio_e6e22e2303.mp3',
  ocean: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c1c4f44538.mp3',
  lofi: 'https://cdn.pixabay.com/audio/2022/05/27/audio_18087374a9.mp3'
};

const INITIAL_PERF: PerfData = {
  personalQ: 535211, teamQ: 0, recruitCount: 0, totalNOC: 0, totalANP: 0, totalFYC: 0,
  annualTargetGSPC: 450000,
  annualTargetFYC: 250000,
  annualTargetTeam: 10,
  monthlyRecords: DEFAULT_MONTHLY,
  prospectList: [],
  recruitList: [],
  teamMembers: [],
  weekActs: { OF: 0, P: 0, F: 0, C: 0 },
  weekRecruitActs: { RO: 0, RP: 0, RF: 0, RS: 0 },
  dailyMission: "", dailyGoal: "", todayQ: 0, todayNOC: 0, todayANP: 0,
  dailyActivities: { of: 0, p: 0, f: 0, c: 0, ro: 0, rp: 0, rf: 0, rs: 0 },
  nightMessage: "",
  milestones: [
    { name: "🔥 个人100K QFYLP", achieved: true, category: "sales" as const },
    { name: "⚡ 个人200K QFYLP", achieved: true, category: "sales" as const },
    { name: "🏆 个人300K QFYLP", achieved: true, category: "sales" as const },
    { name: "👑 个人450K GSPC", achieved: true, category: "sales" as const },
    { name: "🤝 招募第1位战将", achieved: false, category: "recruit" as const },
    { name: "🌟 招募第5位战将", achieved: false, category: "recruit" as const },
    { name: "💎 招募第10位精英", achieved: false, category: "recruit" as const },
    { name: "🛡️ 团队活跃4人组", achieved: false, category: "recruit" as const }
  ].map(m => ({ ...m })),
  wishingStatement: "",
  personalEnergy: 100,
  personalFocus: 100,
  dailyActivitiesLog: {}
};

export default function App() {
  // --- Navigation ---
  const [currentPage, setCurrentPage] = useState<'home' | 'perf' | 'list' | '3v6r' | 'awards' | 'settings'>('home');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = (text: string) => {
    if (!text) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Explicit Language Detection & Speech Rate Optimization
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    if (hasChinese) {
        utterance.lang = 'zh-CN';
        utterance.rate = 1.6; // Faster as requested
        utterance.pitch = 1.1; 
    } else {
        utterance.lang = 'en-US';
        utterance.rate = 1.3;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const [themeKey, setThemeKey] = useState<ThemeKey>('default');
  const theme = THEMES[themeKey] || THEMES.default;

  // --- Data States ---
  const [syncId, setSyncId] = useState<string>(localStorage.getItem('dt_sync_id') || "");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todoItems, setTodoItems] = useState<Record<string, TodoItem[]>>({});
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({});
  const [perfData, setPerfData] = useState<PerfData>(INITIAL_PERF);
  const [viewOffset, setViewOffset] = useState(0);
  const [encouragement, setEncouragement] = useState("");
  const [baseDate, setBaseDate] = useState(new Date());

  // --- UI States ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number, hour: number, offset: number } | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isReflectionArchiveOpen, setIsReflectionArchiveOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [ambientSound, setAmbientSound] = useState(false);
  const [selectedSound, setSelectedSound] = useState<'rain' | 'zen' | 'ocean' | 'lofi'>('zen');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [focusTime, setFocusTime] = useState(0); // in seconds
  const [targetMins, setTargetMins] = useState(30);
  const [isFocusTimerRunning, setIsFocusTimerRunning] = useState(false);
  const [isLargeTimerOpen, setIsLargeTimerOpen] = useState(false);
  const focusTimerRef = useRef<any>(null);

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  const startFocusTimer = (minutes: number) => {
    setFocusTime(minutes * 60);
    setIsFocusTimerRunning(true);
  };

  useEffect(() => {
    if (isFocusTimerRunning && focusTime > 0) {
      focusTimerRef.current = setInterval(() => {
        setFocusTime(prev => {
          if (prev <= 1) {
            if (focusTimerRef.current) clearInterval(focusTimerRef.current);
            setIsFocusTimerRunning(false);
            showToast("Focus session complete!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    }
    return () => { if (focusTimerRef.current) clearInterval(focusTimerRef.current); };
  }, [isFocusTimerRunning, focusTime, showToast]);

  const toggleFocusedTimer = () => {
    if (isFocusTimerRunning) {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
      setIsFocusTimerRunning(false);
    } else {
      setFocusTime(targetMins * 60);
      setIsFocusTimerRunning(true);
      setIsLargeTimerOpen(true);
    }
  };

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const [connectionError, setConnectionError] = useState<{ reason: string; code?: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio node
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
      
      audioRef.current.onerror = (e) => {
        const error = audioRef.current?.error;
        console.error("Audio error event:", error?.code, error?.message);
        showToast("Audio source unavailable. Switching off.");
        setAmbientSound(false);
      };
    }

    const currentUrl = ambientSounds[selectedSound];
    if (audioRef.current.src !== currentUrl) {
      audioRef.current.pause();
      audioRef.current.src = currentUrl;
      audioRef.current.load();
    }

    if (ambientSound && hasInteracted) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name === "NotAllowedError") {
            console.warn("Autoplay blocked. Audio will start on next interaction.");
          } else {
            console.error("Audio play promise failed:", error.message);
            setAmbientSound(false);
          }
        });
      }
    } else {
      audioRef.current.pause();
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [ambientSound, selectedSound, showToast, hasInteracted]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date());

  // --- Load Data & Real-time Sync ---
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('dt_dark_mode');
    if (savedDarkMode !== null) setIsDarkMode(savedDarkMode === 'true');

    const savedTheme = localStorage.getItem('dt_theme') as ThemeKey;
    if (savedTheme) setThemeKey(savedTheme);

    const savedFocus = localStorage.getItem('dt_focus');
    if (savedFocus) setIsFocusMode(savedFocus === 'true');

    const savedSound = localStorage.getItem('dt_sound');
    if (savedSound) setAmbientSound(savedSound === 'true');

    const savedSelectedSound = localStorage.getItem('dt_selected_sound') as any;
    if (savedSelectedSound) setSelectedSound(savedSelectedSound);

    setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    
    testConnection().then(res => {
      if (!res.success) {
        setConnectionError({ reason: res.reason || "Unknown", code: res.code });
      }
    });

    // Handle redirect result (for mobile Safari)
    import('./lib/firebase').then(({ handleRedirectResult }) => {
      handleRedirectResult().then(currentUser => {
        if (currentUser) {
          setUser(currentUser);
          showToast("Redirect Login Success");
        }
      }).catch(err => {
        console.error("Redirect Result Error:", err);
        // Don't show toast for every minor issue, but log it
      });
    });

    // Listen for Firebase Auth changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      const prevUser = user;
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        setSyncId(currentUser.email);
        localStorage.setItem('dt_sync_id', currentUser.email);
        
        // Show welcome toast if they just logged in (transition from null to user)
        if (!prevUser) {
          showToast(`欢迎回来: ${currentUser.email}`);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    const unsubscribes: (() => void)[] = [];

    // 1. Sync Perf Data
    const perfRef = doc(db, `users/${user.uid}/perf/main`);
    unsubscribes.push(onSnapshot(perfRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PerfData;
        setPerfData(prev => {
          // Deep merge or overwrite if different
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data;
          }
          return prev;
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/perf/main`)));

    // 2. Sync Events
    const eventsRef = collection(db, `users/${user.uid}/events`);
    unsubscribes.push(onSnapshot(eventsRef, (snap) => {
      const loadedEvents: CalendarEvent[] = [];
      snap.forEach(doc => loadedEvents.push(doc.data() as CalendarEvent));
      setEvents(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(loadedEvents)) {
          return loadedEvents;
        }
        return prev;
      });
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/events`)));

    // 3. Sync Todos
    const todosRef = collection(db, `users/${user.uid}/todos`);
    unsubscribes.push(onSnapshot(todosRef, (snap) => {
      const loadedTodos: Record<string, TodoItem[]> = {};
      snap.forEach(doc => {
        loadedTodos[doc.id] = (doc.data() as { items: TodoItem[] }).items;
      });
      setTodoItems(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(loadedTodos)) {
          return loadedTodos;
        }
        return prev;
      });
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/todos`)));

    // 4. Sync Daily Data
    const dailyRef = collection(db, `users/${user.uid}/daily`);
    unsubscribes.push(onSnapshot(dailyRef, (snap) => {
      const loadedDaily: Record<string, DailyData> = {};
      snap.forEach(doc => {
        loadedDaily[doc.id] = doc.data() as DailyData;
      });
      setDailyData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(loadedDaily)) {
          return loadedDaily;
        }
        return prev;
      });
      setIsSyncing(false); // Finished initial sync for daily at least
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/daily`)));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  const saveToCloud = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);

      // Save Perf
      const perfPath = `users/${user.uid}/perf/main`;
      batch.set(doc(db, perfPath), perfData);

      // Save Current Todos
      const currentTodoPath = `users/${user.uid}/todos/${todayKey}`;
      batch.set(doc(db, currentTodoPath), { items: currentTodos });

      // Save Current Daily Record
      const currentDailyPath = `users/${user.uid}/daily/${todayKey}`;
      batch.set(doc(db, currentDailyPath), currentDaily);

      await batch.commit();
      showToast("Cloud Sync: Success");
    } catch (e) {
      console.error("Sync Save Failed", e);
      handleFirestoreError(e, OperationType.WRITE, `users/${user?.uid}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Auto Save to Local & Cloud ---
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('dt_dark_mode', isDarkMode.toString());
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('dt_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('dt_perf', JSON.stringify(perfData));
  }, [perfData]);

  useEffect(() => {
    localStorage.setItem('dt_todos', JSON.stringify(todoItems));
  }, [todoItems]);

  useEffect(() => {
    localStorage.setItem('dt_daily', JSON.stringify(dailyData));
  }, [dailyData]);

  useEffect(() => {
    localStorage.setItem('dt_sync_id', syncId);
    
    if (syncId && user) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveToCloud();
      }, 2000); // Debounce 2s
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [syncId, perfData, todoItems, dailyData, user]);

  useEffect(() => {
    localStorage.setItem('dt_theme', themeKey);
  }, [themeKey]);

  useEffect(() => {
    localStorage.setItem('dt_focus', isFocusMode.toString());
  }, [isFocusMode]);

  useEffect(() => {
    localStorage.setItem('dt_sound', ambientSound.toString());
    localStorage.setItem('dt_selected_sound', selectedSound);
  }, [ambientSound, selectedSound]);

  // --- Data Synchronization ---
  // Sync total performance figures from monthly records
  useEffect(() => {
    const totalActualQ = perfData.monthlyRecords.reduce((sum, r) => sum + (r.actual || 0), 0);
    const totalNOC = perfData.monthlyRecords.reduce((sum, r) => sum + (r.noc || 0), 0);
    const totalANP = perfData.monthlyRecords.reduce((sum, r) => sum + (r.anp || 0), 0);
    const totalFYC = perfData.monthlyRecords.reduce((sum, r) => sum + (r.fyc || 0), 0);
    const totalRecruit = perfData.monthlyRecords.reduce((sum, r) => sum + (r.recruitActual || 0), 0);

    // Only update if there's a discrepancy to avoid potential update loops
    if (
      totalActualQ !== perfData.personalQ ||
      totalNOC !== perfData.totalNOC ||
      totalANP !== perfData.totalANP ||
      totalFYC !== (perfData.totalFYC || 0) ||
      totalRecruit !== perfData.recruitCount
    ) {
      setPerfData(prev => {
        // Auto-check milestones
        const updatedMilestones = prev.milestones.map(m => {
          let achieved = m.achieved;
          
          // Sales Milestones
          if (m.name.includes("100K") && totalANP >= 100000) achieved = true;
          if (m.name.includes("200K") && totalANP >= 200000) achieved = true;
          if (m.name.includes("300K") && totalANP >= 300000) achieved = true;
          if (m.name.includes("450K") && totalANP >= 450000) achieved = true;
          
          // Recruit Milestones
          if (m.name.includes("第1位") && totalRecruit >= 1) achieved = true;
          if (m.name.includes("第5位") && totalRecruit >= 5) achieved = true;
          if (m.name.includes("第10位") && totalRecruit >= 10) achieved = true;
          
          // Team Activity Milestone (Active members count)
          const activeMembers = prev.teamMembers.filter(tm => tm.active).length;
          if (m.name.includes("活跃4人组") && activeMembers >= 4) achieved = true;

          return { ...m, achieved };
        });

        return {
          ...prev,
          personalQ: totalActualQ,
          totalNOC: totalNOC,
          totalANP: totalANP,
          totalFYC: totalFYC,
          recruitCount: totalRecruit,
          milestones: updatedMilestones
        };
      });
    }
  }, [perfData.monthlyRecords, perfData.personalQ, perfData.totalNOC, perfData.totalANP, perfData.recruitCount, perfData.teamMembers]);

  // --- Helpers ---
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const currentTodos = todoItems[todayKey] || [];
  const currentDaily = dailyData[todayKey] || { r: "", g: "", sixTasks: ["", "", "", "", "", ""], protocol5352111: [] };
  const safeSixTasks = currentDaily.sixTasks || ["", "", "", "", "", ""];
  const safeProtocol = currentDaily.protocol5352111 || [];

  const currentMonday = useMemo(() => {
    const start = startOfWeek(baseDate, { weekStartsOn: 1 });
    if (viewOffset !== 0) {
      return viewOffset > 0 ? addWeeks(start, viewOffset) : subWeeks(start, Math.abs(viewOffset));
    }
    return start;
  }, [baseDate, viewOffset]);

  const timeAllocationData = useMemo(() => {
    const weekEvents = events.filter(e => e.weekOffset === viewOffset);
    const totals: Record<string, number> = {
      green: 0, yellow: 0, orange: 0, blue: 0, red: 0
    };
    
    weekEvents.forEach(e => {
      const act = ACTIVITIES.find(a => a.id === e.activityId);
      if (act && totals[act.group] !== undefined) {
        totals[act.group] += (e.endHour - e.startHour);
      }
    });

    return Object.entries(GROUP_CONFIG).map(([key, config]) => ({
      name: config.name,
      value: totals[key] || 0,
      color: config.color
    })).filter(d => d.value > 0);
  }, [events, viewOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentMonday, i));
  }, [currentMonday]);

  // --- Handlers ---
  const handleAddEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
    if (user) {
      const eventPath = `users/${user.uid}/events/${event.id}`;
      setDoc(doc(db, eventPath), event).catch(e => handleFirestoreError(e, OperationType.WRITE, eventPath));
    }
    setIsEventModalOpen(false);
  }, [user]);

  const [backups, setBackups] = useState<{ id: string, timestamp: any, label: string }[]>([]);

  // Fetch backups from Firestore
  useEffect(() => {
    if (!user) return;
    const backupsPath = `users/${user.uid}/backups`;
    try {
      const q = query(collection(db, backupsPath), orderBy('timestamp', 'desc'), limit(3));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bList = snapshot.docs.map(doc => ({
          id: doc.id,
          timestamp: doc.data().timestamp,
          label: doc.data().label || (doc.data().timestamp ? format(doc.data().timestamp.toDate(), 'yyyy-MM-dd HH:mm') : 'Pending...')
        }));
        setBackups(bList);
      }, (error) => handleFirestoreError(error, OperationType.GET, backupsPath));
      return unsubscribe;
    } catch (e) {
      console.error("Backup search failed, collection might not exist yet", e);
    }
  }, [user]);

  const handleCreateBackup = async () => {
    if (!user) {
      showToast("Please login to create cloud backups");
      return;
    }
    const label = prompt("Enter backup label (optional):", `Snapshot ${format(new Date(), 'MMM dd, HH:mm')}`);
    if (label === null) return;
    
    try {
      const backupData = {
        perfData,
        dailyData,
        events,
        todoItems,
        timestamp: serverTimestamp(),
        label: label || `Snapshot ${format(new Date(), 'MMM dd, HH:mm')}`
      };
      await addDoc(collection(db, `users/${user.uid}/backups`), backupData);
      showToast("Backup anchor created successfully");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/backups`);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!user) return;
    const backupRef = doc(db, `users/${user.uid}/backups`, backupId);
    try {
      const snap = await getDoc(backupRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.perfData) setPerfData(data.perfData);
        if (data.dailyData) setDailyData(data.dailyData);
        if (data.events) setEvents(data.events);
        if (data.todoItems) setTodoItems(data.todoItems);
        showToast(`System restored to [${data.label}] node anchor`);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, backupRef.path);
    }
  };

  const handleUpdateEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    if (user) {
      const eventPath = `users/${user.uid}/events/${event.id}`;
      setDoc(doc(db, eventPath), event).catch(e => handleFirestoreError(e, OperationType.WRITE, eventPath));
    }
    setIsEventModalOpen(false);
    setEditingEvent(null);
  }, [user]);

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (user) {
      const eventPath = `users/${user.uid}/events/${id}`;
      deleteDoc(doc(db, eventPath)).catch(e => handleFirestoreError(e, OperationType.DELETE, eventPath));
    }
  }, [user]);

  const handleExport = () => {
    const data = { events, perfData, todoItems, dailyData, themeKey };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `david_tung_backup_${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (re) => {
        const data = JSON.parse(re.target?.result as string);
        if (data.events) setEvents(data.events);
        if (data.perfData) setPerfData(data.perfData);
        if (data.todoItems) setTodoItems(data.todoItems);
        if (data.dailyData) setDailyData(data.dailyData);
        if (data.themeKey) setThemeKey(data.themeKey);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportReport = () => {
    // We will use SheetJS (xlsx) for a better export
    const workbook = XLSX.utils.book_new();

    // 1. Performance Summary Sheet
    const summaryData = [
        ['STRATEGIC PERFORMANCE SUMMARY'],
        ['Report Generated', format(new Date(), 'yyyy-MM-dd HH:mm')],
        ['Total QFYLP', perfData.personalQ],
        ['Total ANP', perfData.totalANP],
        ['Total NOC', perfData.totalNOC],
        ['Recruitment Count', perfData.recruitCount],
        []
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

    // 2. Weekly Matrix Grid Sheet
    const currentMonday = startOfWeek(addWeeks(baseDate, viewOffset), { weekStartsOn: 1 });
    const weekEvents = events.filter(e => e.weekOffset === viewOffset);
    const matrixGridData = [
        [`WEEKLY TIME MATRIX GRID (${format(currentMonday, 'd/M')} - ${format(addDays(currentMonday, 6), 'd/M')})`],
        ['Hour', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    ];

    for (let h = 5; h <= 23; h++) {
        const timeLabel = formatHour(h);
        const row = [timeLabel];
        [1, 2, 3, 4, 5, 6, 0].forEach(wd => {
            const eventsAtHour = weekEvents.filter(e => e.weekday === wd && h >= e.startHour && h < e.endHour);
            if (eventsAtHour.length > 0) {
                const cellContent = eventsAtHour.map(e => {
                    const act = ACTIVITIES.find(a => a.id === e.activityId);
                    const group = act ? (GROUP_CONFIG[act.group as keyof typeof GROUP_CONFIG]?.name || 'Other') : 'Other';
                    const color = act ? (GROUP_CONFIG[act.group as keyof typeof GROUP_CONFIG]?.color || '#000') : '#000';
                    return `${e.title || act?.name || 'Untitled'} [${group}] (${color})`;
                }).join(' | ');
                row.push(cellContent);
            } else {
                row.push('');
            }
        });
        matrixGridData.push(row);
    }
    const matrixWS = XLSX.utils.aoa_to_sheet(matrixGridData);
    
    // Auto-width logic for better visibility
    const colWidths = matrixGridData[1].map(() => ({ wch: 25 })); // Default width 25
    colWidths[0] = { wch: 10 }; // Hour column smaller
    matrixWS['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, matrixWS, 'Weekly Matrix');

    // 3. Detailed Logs & List Sheets
    const logsData = [
        ['Date', 'OPEN (OF)', 'PRESE (P)', 'FOLLOW (F)', 'CLOSE (C)', 'R-OP', 'R-PR', 'R-FO', 'R-SU', 'Total Sales Ops', 'Total Recruit Ops', 'Day QFYLP', 'Day ANP']
    ];
    const allLogKeys = Object.keys(perfData.dailyActivitiesLog || {}).sort().reverse();
    allLogKeys.slice(0, 60).forEach(key => { // Last 60 days
        const log = perfData.dailyActivitiesLog![key];
        const salesTotal = (log.of || 0) + (log.p || 0) + (log.f || 0) + (log.c || 0);
        const recruitTotal = (log.ro || 0) + (log.rp || 0) + (log.rf || 0) + (log.rs || 0);
        logsData.push([key, log.of || 0, log.p || 0, log.f || 0, log.c || 0, log.ro || 0, log.rp || 0, log.rf || 0, log.rs || 0, salesTotal, recruitTotal, log.q || 0, log.anp || 0]);
    });
    const logsWS = XLSX.utils.aoa_to_sheet(logsData);
    XLSX.utils.book_append_sheet(workbook, logsWS, 'Daily Logs');

    // 4. Prospect & Recruit Sheets
    const prospectsData = [['Name', 'Occupation', 'Plan/Target', 'Notes']];
    perfData.prospectList.forEach(p => prospectsData.push([p.name, p.job, p.plan, p.note]));
    const prospectsWS = XLSX.utils.aoa_to_sheet(prospectsData);
    XLSX.utils.book_append_sheet(workbook, prospectsWS, 'Prospects');

    const recruitData = [['Name', 'Occupation', 'Interest Level', 'Follow-up Note']];
    perfData.recruitList.forEach(r => recruitData.push([r.name, r.job, r.interest, r.followup]));
    const recruitWS = XLSX.utils.aoa_to_sheet(recruitData);
    XLSX.utils.book_append_sheet(workbook, recruitWS, 'Recruitment');

    // Write file
    const dateStr = format(new Date(), 'yyyyMMdd');
    XLSX.writeFile(workbook, `Tactical_Performance_Report_${dateStr}.xlsx`);
  };

  const handleSyncAppleCalendar = useCallback(() => {
    // Filter only events from the current visible week (matching the working HTML reference)
    const currentWeekEvents = events.filter(e => e.weekOffset === viewOffset);
    
    if (currentWeekEvents.length === 0) {
      alert("📅 当前周没有任务可同步 (No events in this week to sync)");
      return;
    }

    // Generate RFC 5545 iCalendar content (Exact same logic as the working HTML provided by the user)
    const icsContent: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//David Tung Time Manager//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:David Tung 时间管理大师',
      'X-WR-TIMEZONE:Asia/Kuala_Lumpur'
    ];

    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const formatDateForICS = (date: Date, hour: number) => {
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      return `${year}${month}${day}T${pad(hour)}0000`; // Local floating time
    };

    currentWeekEvents.forEach(event => {
      const activity = ACTIVITIES.find(a => a.id === event.activityId);
      
      const monday = startOfWeek(baseDate, { weekStartsOn: 1 });
      const weekMonday = addWeeks(monday, event.weekOffset);
      const eventDate = addDays(weekMonday, event.weekday === 0 ? 6 : event.weekday - 1);
      
      const dtstamp = formatDateForICS(new Date(), new Date().getHours());
      const dtstart = formatDateForICS(eventDate, event.startHour);
      const dtend = formatDateForICS(eventDate, event.endHour);

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${event.id}@davidtung.com`);
      icsContent.push(`DTSTAMP:${dtstamp}`);
      icsContent.push(`DTSTART:${dtstart}`);
      icsContent.push(`DTEND:${dtend}`);
      icsContent.push(`SUMMARY:${activity?.icon || '📅'} ${event.title || activity?.name || 'Scheduled Slot'}`);
      icsContent.push(`DESCRIPTION:活动类型: ${activity?.name || 'General'}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');
    const icsString = icsContent.join('\r\n');
    
    try {
      showToast("正在导出当前周日历...");
      
      // Pure client-side download logic (Verified to work in the user's provided HTML)
      const blob = new Blob([icsString], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `david_tung_week_${new Date().toISOString().slice(0, 10)}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast(`✅ 已成功导出当前周 ${currentWeekEvents.length} 个任务`);
      
    } catch (error) {
      console.error('Calendar sync error:', error);
      alert('同步失败，请重试。');
    }
  }, [events, baseDate, viewOffset, showToast]);

  const handleInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      if (ambientSound && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.warn("Failed to play audio on interaction:", e));
      }
    }
  }, [hasInteracted, ambientSound]);

  // --- Rendering ---
  return (
    <div className={cn("min-h-screen pb-24 transition-all duration-500", isDarkMode ? "dark" : "light-mode")} 
      onClick={handleInteraction}
      onKeyDown={handleInteraction}
      style={{ 
        fontFamily: '-apple-system, sans-serif' 
      } as React.CSSProperties}>
      
      {/* Toast Notification */}
      <div className={cn(
        "fixed top-24 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-500 pointer-events-none",
        isDarkMode ? "bg-slate-900/90 border-slate-700 text-white" : "bg-white/90 border-slate-200 text-slate-900",
        toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}>
        <p className="text-xs font-bold uppercase tracking-widest">{toast.message}</p>
      </div>

      {/* Connection Error Banner */}
      <AnimatePresence>
        {connectionError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[1100] bg-orange-600 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center shadow-xl"
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <RefreshCw size={16} className="animate-spin-slow" />
              <span>网络同步可能受限 / Sync Limited</span>
            </div>
            <p className="text-xs font-medium opacity-90 max-w-2xl">{connectionError.reason}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setConnectionError(null)}
                className="px-4 py-1.5 bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-colors"
              >
                Ignore / 忽略
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-1.5 bg-white text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-colors"
              >
                Retry / 重试
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLargeTimerOpen && isFocusTimerRunning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-black p-10 overflow-hidden"
          >
            {/* Super Transcendent Flux Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: [1, 1.4, 1.2, 1],
                  rotate: [0, 90, 180, 270, 360],
                  x: [-100, 100, 50, -100],
                  y: [-100, 50, 150, -100]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.2)_0%,transparent_60%)] blur-[120px]"
              />
              <motion.div 
                animate={{ 
                  scale: [1.2, 1, 1.5, 1.2],
                  rotate: [360, 270, 180, 90, 0],
                  x: [100, -100, 0, 100],
                  y: [100, -50, 100, 100]
                }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                className="absolute w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15)_0%,transparent_60%)] blur-[120px]"
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  x: [0, 50, -50, 0],
                  y: [0, -50, 50, 0]
                }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12)_0%,transparent_60%)] blur-[120px]"
              />
              <motion.div 
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.05),transparent)]"
              />
            </div>

            <button 
              onClick={() => setIsLargeTimerOpen(false)}
              className="absolute top-10 right-10 z-50 p-6 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-white/20 hover:text-white backdrop-blur-xl group"
            >
              <X size={40} className="group-active:scale-90 transition-transform" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative z-10 w-full max-w-7xl flex flex-col items-center justify-center h-full"
            >
               <div className="mb-20 flex flex-col items-center gap-6">
                <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  <span className="text-[12px] font-black text-white uppercase tracking-[0.5em] leading-none">Operational Essence</span>
                </div>
              </div>

              <div className="relative flex flex-col items-center justify-center w-full">
                {/* Main Large Numbers with Apple-style Fluidity */}
                <div className="relative flex items-center justify-center">
                  {/* Decorative Background Glow for Numbers */}
                  <div className="absolute inset-x-[-20%] inset-y-[-20%] bg-gradient-to-t from-white/10 via-transparent to-transparent blur-[100px] pointer-events-none" />
                  
                  <div className="flex items-baseline">
                    <motion.span 
                      key={formatFocusTime(focusTime).split(':')[0]}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-[20rem] sm:text-[30rem] md:text-[42rem] font-black leading-none tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-rose-500 to-indigo-600 drop-shadow-[0_0_80px_rgba(244,63,94,0.3)]"
                    >
                      {formatFocusTime(focusTime).split(':')[0]}
                    </motion.span>
                    <span className="text-[6rem] sm:text-[10rem] md:text-[14rem] font-black text-rose-500/20 mb-[4rem] sm:mb-[6rem] md:mb-[8rem] ml-10 tabular-nums">
                      {formatFocusTime(focusTime).split(':')[1]}
                    </span>
                  </div>
                </div>

                {/* Progress Ring or Bar */}
                <div className="mt-12 w-full max-w-xl px-12">
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-md">
                      <motion.div 
                        className="h-full bg-white shadow-[0_0_25px_rgba(255,255,255,0.6)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(focusTime / (targetMins * 60)) * 100}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 1 }}
                      />
                   </div>
                </div>
              </div>

              <div className="mt-24 grid grid-cols-2 gap-8 w-full max-w-md">
                 <div className="flex flex-col items-center gap-2 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl group transition-all hover:bg-white/10">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Mission Clock</span>
                    <span className="text-3xl font-mono font-black text-white tracking-widest">{targetMins}:00</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl group transition-all hover:bg-white/10">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Status Mode</span>
                    <span className="text-3xl font-mono font-black text-white tracking-widest">ACTIVE</span>
                 </div>
              </div>

              <div className="mt-20 flex gap-8">
                 <button 
                  onClick={toggleFocusedTimer}
                  className="w-24 h-24 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full shadow-[0_0_40px_rgba(239,68,68,0.3)] transition-all active:scale-90 group"
                 >
                   <X size={40} className="text-white group-hover:rotate-90 transition-transform duration-500" />
                 </button>
                 <button 
                  onClick={() => setIsLargeTimerOpen(false)}
                  className="px-16 py-8 bg-white text-slate-950 font-black text-[12px] uppercase tracking-[0.5em] rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all active:scale-95 hover:bg-slate-100"
                 >
                   Return to Matrix
                 </button>
              </div>
              
              <p className="mt-16 text-[9px] text-slate-600 font-bold uppercase tracking-[0.6em] animate-pulse">Super-Transcendent Operational State</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "mx-auto max-w-7xl px-4 sm:px-6 mb-24 transition-all duration-700",
        isFocusMode && "saturate-[0.5] brightness-[0.8] blur-[0.2px]"
      )}>
        <Header 
          theme={theme}
          syncId={syncId}
          onSyncIdChange={setSyncId}
          onAuthClick={() => setIsAuthModalOpen(true)}
          isLoggedIn={!!user}
          userEmail={user?.email || undefined}
          onLogout={async () => {
             try {
               await logout();
               showToast("Logged out");
             } catch (e) {
               console.error("Logout failed", e);
             }
          }}
          isSyncing={isSyncing}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onQuickAdd={() => {
            setSelectedSlot({ day: new Date().getDay(), hour: 9, offset: 0 });
            setIsEventModalOpen(true);
          }}
          onExport={handleExport}
          onImport={handleImport}
          onSyncIcal={handleSyncAppleCalendar}
          onExportAll={() => {}}
          onSyncGoogle={() => {}}
          onExportReport={handleExportReport}
        />

        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          isDarkMode={isDarkMode}
          showToast={showToast}
          user={user}
          onLogout={async () => {
             try {
               await logout();
               setUser(null);
               showToast("已退出登录 (Logged out)");
             } catch (e) {
               console.error("Logout failed", e);
             }
          }}
        />

        {/* Protocol Details Modal */}
        <AnimatePresence>
          {isProtocolModalOpen && activeProtocolId && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={cn(
                  "w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 sm:p-8 border overflow-hidden flex flex-col",
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white text-slate-950 rounded-2xl shadow-lg shadow-white/20">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em]">{
                        activeProtocolId === 'a' ? '认识新朋友' :
                        activeProtocolId === 'c' ? '打保户电话' :
                        'Protocol Details'
                      }</h3>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-medium">节点详细记录 · Detailed Log</p>
                    </div>
                  </div>
                  <button onClick={() => {
                    setIsProtocolModalOpen(false);
                    setActiveProtocolId(null);
                  }} className="p-2 hover:bg-slate-800/10 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 mb-6 flex-1">
                  {(() => {
                    const protocolDetails = dailyData[todayKey]?.protocolDetails?.[activeProtocolId] || ["", "", "", "", ""];
                    // Ensure enough slots based on the val
                    const requiredCount = 
                      activeProtocolId === 'a' ? 5 : 
                      activeProtocolId === 'b' ? 3 :
                      activeProtocolId === 'c' ? 5 : 
                      activeProtocolId === 'd' ? 2 : 1;
                    
                    const displayDetails = [...protocolDetails];
                    while (displayDetails.length < requiredCount) displayDetails.push("");

                    return displayDetails.map((detail, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-4">
                          <span>Node Entry {idx + 1}</span>
                        </div>
                        <textarea 
                          className={cn(
                            "w-full p-4 rounded-2xl border outline-none font-medium text-xs transition-all min-h-[60px]",
                            isDarkMode 
                              ? "bg-slate-900 border-slate-800 focus:border-white text-white" 
                              : "bg-slate-50 border-slate-200 focus:border-slate-800 text-slate-900"
                          )}
                          placeholder={
                            activeProtocolId === 'a' ? "姓名、地点、聊了什么内容..." :
                            activeProtocolId === 'c' ? "对方姓名、通话要点、结果..." :
                            "写下详细进展..."
                          }
                          value={detail}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDailyData(prev => {
                              const current = prev[todayKey] || { r: "", g: "", sixTasks: ["", "", "", "", "", ""], protocol5352111: [], protocolDetails: {} };
                              const details = { ...(current.protocolDetails || {}) };
                              const list = [...(details[activeProtocolId] || [])];
                              while (list.length < requiredCount) list.push("");
                              list[idx] = val;
                              details[activeProtocolId] = list;
                              
                              // Automatically check off protocol if at least one entry has content
                              const protocol = [...(current.protocol5352111 || [])];
                              // If any entry is not empty, and protocol id not in list, add it
                              const hasContent = list.some(d => d.trim());
                              let newProtocol = protocol;
                              if (hasContent && !protocol.includes(activeProtocolId)) {
                                newProtocol = [...protocol, activeProtocolId];
                              }

                              return {
                                ...prev,
                                [todayKey]: { ...current, protocolDetails: details, protocol5352111: newProtocol }
                              };
                            });
                          }}
                        />
                      </div>
                    ));
                  })()}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setIsProtocolModalOpen(false);
                      setActiveProtocolId(null);
                    }}
                    className="flex-1 py-4 bg-white text-slate-950 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-white/30 active:scale-95 transition-all"
                  >
                    Confirm & Sync Node
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {currentPage === 'home' && (
          <div className="space-y-6">
            {/* Wishing Statement (许愿文) AT THE VERY TOP */}
            <div className={cn(
              "bento-card p-10 flex flex-col justify-between overflow-hidden relative transition-all duration-500 shadow-2xl mb-6",
              isDarkMode ? "bg-slate-900 border-amber-500/20 shadow-amber-500/5" : "bg-white border-slate-200 shadow-slate-200"
            )}>
              <div className="absolute -bottom-10 -right-10 opacity-10">
                <Target size={250} className="text-amber-500" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-black text-amber-500 uppercase tracking-[0.4em]">Strategic Manifestation · 许愿文</h3>
                    <p className="text-[10px] text-slate-500 mt-2 uppercase font-mono tracking-widest">Personal Intelligence & Performance Dashboard Protocol</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleSpeak(perfData.wishingStatement || "")}
                      className={cn(
                        "p-4 rounded-[2rem] shadow-xl transition-all active:scale-95",
                        isSpeaking 
                          ? "bg-red-500 text-white shadow-red-500/30 animate-pulse" 
                          : "bg-white/10 text-white shadow-sm border border-white/20 hover:bg-white/20"
                      )}
                      title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                    >
                      {isSpeaking ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <div className="p-4 bg-amber-500 text-white rounded-[2rem] shadow-xl shadow-amber-500/30">
                      <Target size={24} />
                    </div>
                  </div>
                </div>
                <textarea 
                  className={cn(
                    "w-full bg-transparent text-2xl font-black leading-relaxed italic border-none outline-none resize-none custom-scrollbar min-h-[400px] text-center mb-8 p-6",
                    isDarkMode ? "text-white placeholder:text-slate-800" : "text-slate-900 placeholder:text-slate-200 bg-slate-50/50 rounded-3xl"
                  )}
                  placeholder="在此写下您的许愿文 (Define your vision here...)"
                  rows={12}
                  value={perfData.wishingStatement || ""}
                  onChange={(e) => setPerfData(prev => ({ ...prev, wishingStatement: e.target.value }))}
                />
                <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              </div>
            </div>

            {/* Encouragement Card (Inspiration Node) - MOVED HERE */}
            <div className={cn(
              "bento-card p-10 flex flex-col justify-center items-center text-center relative overflow-hidden group transition-all duration-700",
              isDarkMode ? "bg-slate-900/60 border-white/5 shadow-2xl shadow-blue-500/5" : "bg-white border-slate-200"
            )}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30" />
              <div className="relative z-10 flex flex-col items-center max-w-2xl">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <Zap size={24} className="text-amber-500" />
                </div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Inspiration Node</span>
                <p className={cn(
                  "text-3xl font-black italic mt-6 leading-tight transition-colors duration-500",
                  isDarkMode ? "text-white group-hover:text-amber-400" : "text-slate-900"
                )}>
                  "{encouragement}"
                </p>
                <div className="flex items-center gap-4 mt-8 opacity-40">
                  <div className="h-px w-8 bg-slate-700" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.4em]">Operational Clarity Protocol</span>
                  <div className="h-px w-8 bg-slate-700" />
                </div>
              </div>
            </div>

            <div className={cn(
              "bento-grid transition-all duration-700",
              isFocusMode && "gap-10 scale-[0.99] opacity-90"
            )}>
              {/* Other home elements follow... */}
              {/* Removed wishing statement from inside bento-grid */}

            {/* 5352111 Elite Discipline Protocol */}
            <div className={cn(
              "bento-card md:col-span-7 p-8 relative overflow-hidden",
              isDarkMode ? "bg-slate-900/60 border-white/10" : "bg-white border-slate-200"
            )}>
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Zap size={160} className="text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white text-slate-950 rounded-xl shadow-lg shadow-white/20">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white leading-none">Elite Protocol 5352111</h3>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-medium">每日核心作业纪律 · Core Discipline</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'a', val: '5', label: '新朋友', desc: '认识5位新朋友/陌生人', time: '15 Min' },
                    { id: 'b', val: '3', label: '工作预约', desc: '预定3个工作相关预约', time: '135 Min' },
                    { id: 'c', val: '5', label: '保户电话', desc: '持打5电话于保户/准保户', time: '15 Min' },
                    { id: 'd', val: '2', label: '大客户', desc: '应酬影响中心/大客户', time: '120 Min' },
                    { id: 'e', val: '1', label: '复习学习', desc: '复习/学习业务相关知识', time: '60 Min' },
                    { id: 'f', val: '1', label: '深度阅读', desc: '阅读业务相关知识内容', time: '60 Min' },
                    { id: 'g', val: '1', label: '文书处理', desc: '文书极速处理', time: '60 Min' },
                    { id: 'h', val: '8', label: '8/8/8 平衡', desc: '睡眠/工作/休闲平衡分配', time: '24 Hour' }
                  ].map((item, i) => {
                    const isCompleted = safeProtocol.includes(item.id);
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          setDailyData(prev => {
                            const current = prev[todayKey] || { r: "", g: "", sixTasks: ["", "", "", "", "", ""], protocol5352111: [] };
                            const protocol = current.protocol5352111 || [];
                            const isCurrentlyCompleted = protocol.includes(item.id);
                            const newProtocol = isCurrentlyCompleted 
                              ? protocol.filter(id => id !== item.id)
                              : [...protocol, item.id];
                            
                            return { 
                              ...prev, 
                              [todayKey]: { ...current, protocol5352111: newProtocol } 
                            };
                          });
                          if (!isCompleted) showToast(`Node ${item.id.toUpperCase()} Check OK`);
                        }}
                        className={cn(
                          "p-4 rounded-2xl border transition-all hover:translate-y-[-1px] cursor-pointer relative group/item overflow-hidden",
                          isDarkMode 
                            ? (isCompleted ? "bg-white/10 border-white/30" : "bg-slate-900/40 border-slate-800 hover:border-slate-700") 
                            : (isCompleted ? "bg-slate-50 border-slate-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm")
                        )}
                      >
                        {isCompleted && (
                          <div className="absolute top-0 right-0 p-1 opacity-20">
                            <CheckCircle2 size={48} className="text-white" />
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3 relative z-10">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProtocolId(item.id);
                              setIsProtocolModalOpen(true);
                            }}
                            className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                              isCompleted 
                                ? "bg-white border-white text-slate-950" 
                                : "border-slate-400 bg-transparent text-transparent"
                            )}
                          >
                            <CheckCircle2 size={14} className={isCompleted ? "opacity-100 scale-100" : "opacity-0 scale-50"} />
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProtocolId(item.id);
                              setIsProtocolModalOpen(true);
                            }}
                            className="text-[7px] font-bold text-white uppercase tracking-widest hover:underline"
                          >
                            {isCompleted ? "Edit Details" : "Add Details"}
                          </button>
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">{item.val} qty</span>
                        </div>
                        
                        <div className="relative z-10">
                          <p className={cn(
                            "text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5 transition-colors",
                            isCompleted 
                              ? "text-white" 
                              : (isDarkMode ? "text-slate-300" : "text-slate-900")
                          )}>{item.label}</p>
                          <p className={cn(
                            "text-[9px] leading-tight transition-colors mb-3",
                            isDarkMode 
                              ? (isCompleted ? "text-slate-400" : "text-slate-500") 
                              : "text-slate-500"
                          )}>{item.desc}</p>
                          
                          {/* Progress Details Preview */}
                          {(() => {
                            const details = currentDaily.protocolDetails?.[item.id] || [];
                            const filledDetails = details.filter(d => d.trim());
                            if (filledDetails.length === 0) return null;
                            return (
                              <div className={cn(
                                "mb-3 p-2 rounded-lg border text-[8px] font-mono leading-tight",
                                isDarkMode ? "bg-black/20 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-600 shadow-inner"
                              )}>
                                {filledDetails.map((d, di) => (
                                  <div key={di} className="break-words mb-1 last:mb-0">• {d}</div>
                                ))}
                              </div>
                            );
                          })()}

                          <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-tighter">
                            <span className={isCompleted ? "text-white font-bold" : "text-slate-600"}>{isCompleted ? 'Node Sync OK' : 'Pending'}</span>
                            <span className="text-slate-600">{item.time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 6 Most Important Things (6大要事) */}
            <div className={cn("bento-card md:col-span-5 p-8", !isDarkMode && "bg-white border-slate-200")}>
              <div className="flex items-center gap-2 mb-6">
                <ListTodo size={16} className="text-white" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">6大要事 · Critical 6</h3>
              </div>
              <div className="grid gap-3">
                {safeSixTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}.</span>
                    <input 
                      type="text"
                      className={cn(
                        "flex-1 bg-transparent border-b text-sm py-1 outline-none transition-colors",
                        isDarkMode ? "border-slate-800 focus:border-white text-slate-200" : "border-slate-200 focus:border-white text-slate-900"
                      )}
                      placeholder={`Important task ${idx + 1}...`}
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...safeSixTasks];
                        newTasks[idx] = e.target.value;
                        setDailyData(prev => ({ ...prev, [todayKey]: { ...currentDaily, sixTasks: newTasks } }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Goal Tracking - Large Bento Card */}
            <div className="bento-card md:col-span-8 p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Target size={200} />
              </div>
              <div className="relative z-10">
                <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/20">Annual Strategic Focus</span>
                
                <div className="mt-8 grid gap-10 sm:grid-cols-3">
                  <div>
                    <div className="group/metric cursor-pointer" onClick={(e) => {
                      const input = e.currentTarget.querySelector('input[type="number"]');
                      if (input instanceof HTMLInputElement) input.focus();
                    }}>
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">💰 ANP Core</h2>
                        <input 
                          type="number"
                          className="w-20 bg-slate-800/20 hover:bg-slate-800/40 text-right text-[10px] font-mono text-slate-400 outline-none border-b border-white/30 px-2 py-1 rounded-t-lg transition-colors focus:border-white"
                          value={perfData.annualTargetGSPC}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setPerfData(prev => ({ ...prev, annualTargetGSPC: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input 
                          type="number"
                          className="text-4xl font-light text-white bg-transparent border-none outline-none w-full max-w-[150px] p-0 hover:text-white transition-colors cursor-text"
                          value={perfData.totalANP}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newVal = parseFloat(e.target.value) || 0;
                            const currentMonthName = format(new Date(), 'M月', { locale: undefined });
                            setPerfData(prev => {
                              const newMonthly = prev.monthlyRecords.map(m => {
                                if (m.month === currentMonthName) {
                                  const otherMonthsSum = prev.monthlyRecords
                                    .filter(om => om.month !== currentMonthName)
                                    .reduce((sum, om) => sum + (om.anp || 0), 0);
                                  return { ...m, anp: newVal - otherMonthsSum };
                                }
                                return m;
                              });
                              return { ...prev, monthlyRecords: newMonthly, totalANP: newVal };
                            });
                          }}
                        />
                        <div className="text-[10px] text-slate-500 font-mono">ANP</div>
                      </div>
                      <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                          style={{ width: `${Math.min(100, (perfData.totalANP / (perfData.annualTargetGSPC || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="group/metric cursor-pointer" onClick={(e) => {
                      const input = e.currentTarget.querySelector('input[type="number"]');
                      if (input instanceof HTMLInputElement) input.focus();
                    }}>
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🛡️ NOC Nodes</h2>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input 
                          type="number"
                          className="text-4xl font-light text-emerald-400 bg-transparent border-none outline-none w-full max-w-[100px] p-0 hover:text-emerald-300 focus:text-emerald-300 transition-colors cursor-text"
                          value={perfData.totalNOC}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newVal = parseInt(e.target.value) || 0;
                            const currentMonthName = format(new Date(), 'M月', { locale: undefined });
                            setPerfData(prev => {
                              const newMonthly = prev.monthlyRecords.map(m => {
                                if (m.month === currentMonthName) {
                                  const otherMonthsSum = prev.monthlyRecords
                                    .filter(om => om.month !== currentMonthName)
                                    .reduce((sum, om) => sum + (om.noc || 0), 0);
                                  return { ...m, noc: newVal - otherMonthsSum };
                                }
                                return m;
                              });
                              return { ...prev, monthlyRecords: newMonthly, totalNOC: newVal };
                            });
                          }}
                        />
                        <div className="text-[10px] text-slate-500 font-mono">件数</div>
                      </div>
                      <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                          style={{ width: `${Math.min(100, (perfData.totalNOC / 100) * 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="group/metric cursor-pointer" onClick={(e) => {
                      const input = e.currentTarget.querySelector('input[type="number"]');
                      if (input instanceof HTMLInputElement) input.focus();
                    }}>
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">👥 Recruitment</h2>
                        <input 
                          type="number"
                          className="w-16 bg-slate-800/20 hover:bg-slate-800/40 text-right text-[10px] font-mono text-slate-400 outline-none border-b border-amber-500/30 px-2 py-1 rounded-t-lg transition-colors focus:border-amber-500"
                          value={perfData.annualTargetTeam}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setPerfData(prev => ({ ...prev, annualTargetTeam: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input 
                          type="number"
                          className="text-4xl font-light text-amber-500 bg-transparent border-none outline-none w-full max-w-[100px] p-0 hover:text-amber-400 focus:text-amber-400 transition-colors cursor-text"
                          value={perfData.recruitCount}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newVal = parseInt(e.target.value) || 0;
                            const currentMonthName = format(new Date(), 'M月', { locale: undefined });
                            setPerfData(prev => {
                              const newMonthly = prev.monthlyRecords.map(m => {
                                if (m.month === currentMonthName) {
                                  const otherMonthsSum = prev.monthlyRecords
                                    .filter(om => om.month !== currentMonthName)
                                    .reduce((sum, om) => sum + (om.recruitActual || 0), 0);
                                  return { ...m, recruitActual: newVal - otherMonthsSum };
                                }
                                return m;
                              });
                              return { ...prev, monthlyRecords: newMonthly, recruitCount: newVal };
                            });
                          }}
                        />
                        <div className="text-[10px] text-slate-500 font-mono">战将</div>
                      </div>
                      <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                          style={{ width: `${Math.min(100, (perfData.recruitCount / (perfData.annualTargetTeam || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Command Center (New Calendar Card) */}
            <div className={cn(
              "bento-card md:col-span-4 p-6 flex flex-col transition-colors duration-300",
              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            )}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-white" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Matrix</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalendarMonth(prev => subMonths(prev, 1))} className="p-1 hover:bg-white/10 rounded-lg"><ChevronLeft size={14} /></button>
                  <span className="text-[10px] font-mono font-bold text-white uppercase">{format(calendarMonth, 'MMM yyyy')}</span>
                  <button onClick={() => setCalendarMonth(prev => addMonths(prev, 1))} className="p-1 hover:bg-white/10 rounded-lg"><ChevronRight size={14} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                  <span key={d} className="text-[8px] font-bold text-slate-600 uppercase">{d}</span>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 });
                  const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 });
                  const days = eachDayOfInterval({ start, end });
                  
                  return days.map(day => {
                    const isSelected = isSameDay(day, selectedCalendarDay);
                    const isTodayLocal = isToday(day);
                    const isCurrentMonth = isSameMonth(day, calendarMonth);
                    
                    // Check if has events
                    const dayOfWeek = day.getDay();
                    const adjustedWeekday = dayOfWeek === 0 ? 0 : dayOfWeek; // Adjust if needed, current system uses 0 for Sunday
                    
                    const mondayBase = startOfWeek(baseDate, { weekStartsOn: 1 });
                    const mondayDay = startOfWeek(day, { weekStartsOn: 1 });
                    const diffWeeks = Math.round((mondayDay.getTime() - mondayBase.getTime()) / (7 * 24 * 60 * 60 * 1000));
                    
                    const hasEvents = events.some(e => e.weekday === adjustedWeekday && e.weekOffset === diffWeeks);

                    return (
                      <button 
                        key={day.toISOString()}
                        onClick={() => {
                          setSelectedCalendarDay(day);
                          setViewOffset(diffWeeks);
                        }}
                        className={cn(
                          "relative aspect-square flex items-center justify-center text-[10px] rounded-lg transition-all",
                          !isCurrentMonth && "opacity-20",
                          isSelected 
                            ? (isDarkMode ? "bg-white text-black font-black" : "bg-slate-900 text-white font-black") 
                            : (isTodayLocal ? "text-white font-black border border-white/30" : "text-slate-400 hover:bg-white/5"),
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <span>{format(day, 'd')}</span>
                          <span className={cn(
                            "text-[6px] font-bold mt-0.5",
                            isSelected ? (isDarkMode ? "text-black/60" : "text-white/60") : "text-slate-600"
                          )}>{getLunarDate(day)}</span>
                        </div>
                        {hasEvents && !isSelected && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Day Preview */}
              <div className="mt-6 pt-6 border-t border-slate-800/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{format(selectedCalendarDay, 'EEEE, d MMM')}</span>
                  <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-500/50" />
                </div>
                <div className="space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                  {(() => {
                    const dayOfWeek = selectedCalendarDay.getDay();
                    const adjustedWeekday = dayOfWeek === 0 ? 0 : dayOfWeek;
                    const mondayBase = startOfWeek(baseDate, { weekStartsOn: 1 });
                    const mondayDay = startOfWeek(selectedCalendarDay, { weekStartsOn: 1 });
                    const diffWeeks = Math.round((mondayDay.getTime() - mondayBase.getTime()) / (7 * 24 * 60 * 60 * 1000));
                    
                    const dayEvents = events.filter(e => e.weekday === adjustedWeekday && e.weekOffset === diffWeeks)
                      .sort((a, b) => a.startHour - b.startHour);

                    if (dayEvents.length === 0) return <p className="text-[9px] italic text-slate-600">No tactical deployments scheduled.</p>;
                    
                    return dayEvents.map(e => {
                      const act = ACTIVITIES.find(a => a.id === e.activityId);
                      const groupColor = GROUP_CONFIG[act?.group as keyof typeof GROUP_CONFIG]?.color || '#333';
                      return (
                        <div key={e.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/10 border border-slate-800/20">
                          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: groupColor }} />
                          <div className="flex-1">
                            <div className="flex justify-between text-[9px] font-bold text-white tracking-widest">
                              <span>{e.title}</span>
                              <span className="font-mono text-slate-500">{formatHour(e.startHour)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>


            {/* Time Allocation Chart */}
            <div className={cn(
              "bento-card md:col-span-6 p-8 flex flex-col items-center",
              isDarkMode ? "bg-slate-900/40" : "bg-white border-slate-200"
            )}>
              <div className="w-full flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <PieChartIcon size={16} className="text-white" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Time Allocation</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsReflectionArchiveOpen(true)}
                    className="px-2 py-1 bg-white/10 border border-white/30 rounded-lg text-[8px] font-bold text-white uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-1"
                  >
                    <History size={10} /> History
                  </button>
                  <span className="text-[9px] text-slate-500 uppercase font-mono">Matrix Week {viewOffset === 0 ? 'Current' : viewOffset > 0 ? `+${viewOffset}` : viewOffset}</span>
                </div>
              </div>
              
              <div className="w-full h-[220px]">
                {timeAllocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {timeAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                          border: isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-center items-center justify-center text-slate-500 italic text-xs">
                    No matrix activity data available for this week.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full px-4">
                {timeAllocationData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{d.value}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reflection Bento Sections */}
            <div className={cn("bento-card md:col-span-6 p-8", !isDarkMode && "bg-white border-slate-200")}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Edit3 size={16} className="text-slate-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Tactical Reflection · 今日检讨/反思</h3>
                </div>
                <button 
                  onClick={() => setIsReflectionArchiveOpen(true)}
                  className={cn(
                    "p-2 rounded-xl transition-all border",
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-600" 
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm"
                  )}
                  title="View Matrix Archive"
                >
                  <History size={14} />
                </button>
              </div>
              <textarea 
                className={cn(
                  "w-full rounded-2xl border p-4 text-sm outline-none transition-all min-h-[120px]",
                  isDarkMode 
                    ? "border-slate-800 bg-slate-900/50 text-slate-200 focus:border-white" 
                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-white"
                )}
                placeholder="Analyze deviations & achievements..."
                value={currentDaily.r}
                onChange={(e) => {
                  const val = e.target.value;
                  setDailyData(prev => ({ ...prev, [todayKey]: { ...currentDaily, r: val } }));
                }}
              />
            </div>

            <div className={cn("bento-card md:col-span-6 p-8", !isDarkMode && "bg-white border-slate-200")}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-slate-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Gratitude Synthesis · 今日感恩/鼓励自己</h3>
                </div>
                <button 
                  onClick={() => setIsReflectionArchiveOpen(true)}
                  className={cn(
                    "p-2 rounded-xl transition-all border",
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-600" 
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm"
                  )}
                  title="View Matrix Archive"
                >
                  <History size={14} />
                </button>
              </div>
              <textarea 
                className={cn(
                  "w-full rounded-2xl border p-4 text-sm outline-none transition-all min-h-[120px]",
                  isDarkMode 
                    ? "border-slate-800 bg-slate-900/50 text-slate-200 focus:border-emerald-500" 
                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                )}
                placeholder="Log internal wins & appreciation..."
                value={currentDaily.g}
                onChange={(e) => {
                  const val = e.target.value;
                  setDailyData(prev => ({ ...prev, [todayKey]: { ...currentDaily, g: val } }));
                }}
              />
            </div>

            {/* Timeline View - Full Width Wide Bento Card */}
            <div className={cn("bento-card md:col-span-12 p-8 transition-colors duration-300", !isDarkMode && "bg-white border-slate-200 shadow-slate-100")}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Time Matrix</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar size={14} />
                    <span>{format(currentMonday, 'd/M')} — {format(addDays(currentMonday, 6), 'd/M/yyyy')}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {/* Date/Week Jump Picker - Enhanced Accessibility */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        const input = document.getElementById('week-jump') as HTMLInputElement;
                        input.focus();
                        input.click(); // Trigger native click which often opens picker
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all cursor-pointer",
                        isDarkMode ? "bg-slate-900 border-slate-800 hover:border-slate-600 active:bg-slate-800" : "bg-white border-slate-200 shadow-sm hover:border-slate-300 active:bg-slate-50"
                      )}
                    >
                      <Target size={12} className="text-white" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Jump to Node</span>
                    </button>
                    <input 
                      id="week-jump"
                      type="date" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const targetDate = new Date(e.target.value);
                        const mondayNow = startOfWeek(new Date(), { weekStartsOn: 1 });
                        const mondayTarget = startOfWeek(targetDate, { weekStartsOn: 1 });
                        const diffWeeks = Math.round((mondayTarget.getTime() - mondayNow.getTime()) / (7 * 24 * 60 * 60 * 1000));
                        setViewOffset(diffWeeks);
                      }}
                    />
                  </div>

                  <button 
                    onClick={handleSyncAppleCalendar}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest border",
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600" 
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm"
                    )}
                  >
                    <CalendarPlus size={14} /> 一键同步 Apple 日历 (Sync Apple)
                  </button>
                  <div className={cn(
                    "flex p-1 rounded-2xl transition-colors duration-300 gap-1",
                    isDarkMode ? "bg-slate-800/50" : "bg-slate-200/50"
                  )}>
                    <button 
                      onClick={() => setViewOffset(prev => prev - 1)}
                      className={cn(
                        "p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                      )}
                      title="Previous Week"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <button 
                      onClick={() => setViewOffset(0)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                        viewOffset === 0 
                          ? (isDarkMode ? "bg-white text-black shadow-lg" : "bg-slate-900 text-white shadow-lg")
                          : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                      )}
                    >
                      Current
                    </button>

                    <button 
                      onClick={() => setViewOffset(prev => prev + 1)}
                      className={cn(
                        "p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                      )}
                      title="Next Week"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[800px] border-collapse text-[10px]">
                  <thead>
                    <tr>
                      <th className={cn(
                        "sticky left-0 z-10 w-24 border-r p-4 font-bold text-slate-500 uppercase tracking-tighter transition-colors",
                        isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"
                      )}>Timeline</th>
                      {weekDays.map((day, i) => (
                        <th key={i} className={cn(
                          "p-4 border-b font-medium transition-colors text-center",
                          isDarkMode ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-200"
                        )}>
                          <div className="flex flex-col items-center">
                            <span className="uppercase tracking-widest text-[8px] font-bold opacity-60 mb-1">{format(day, 'EEE')}</span>
                            <span className={cn(
                              "text-sm font-light mb-1",
                              isDarkMode ? "text-white" : "text-slate-900"
                            )}>{format(day, 'd/M')}</span>
                            <span className="text-[9px] text-white/60 font-medium">{getLunarDate(day)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const hours = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
                      const spanned = {} as Record<number, number>; // dayIdx -> remaining span

                      return hours.map((hour, hIdx) => (
                        <tr key={hour} className={cn("border-b transition-colors", isDarkMode ? "border-slate-800/30" : "border-slate-200")}>
                          <td className={cn(
                            "sticky left-0 z-10 border-r p-2 text-center text-slate-500 font-mono transition-colors",
                            isDarkMode ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-slate-50/80 backdrop-blur-sm"
                          )}>
                             {formatHour(hour)}
                          </td>
                          {Array.from({ length: 7 }).map((_, dayIdx) => {
                            if (spanned[dayIdx] > 0) {
                              spanned[dayIdx]--;
                              return null;
                            }

                            const weekday = dayIdx === 6 ? 0 : dayIdx + 1;
                            const cellEvents = events.filter(e => 
                              e.weekOffset === viewOffset && 
                              e.weekday === weekday && 
                              e.startHour === hour
                            );

                            let maxSpan = 1;
                            cellEvents.forEach(e => {
                               const duration = (e.endHour - e.startHour + 24) % 24 || 24;
                               const remainingRows = hours.length - hIdx;
                               const actualSpan = Math.min(duration, remainingRows);
                               if (actualSpan > maxSpan) maxSpan = actualSpan;
                            });

                            if (maxSpan > 1) {
                              spanned[dayIdx] = maxSpan - 1;
                            }

                            return (
                              <td 
                                key={dayIdx} 
                                rowSpan={maxSpan}
                                className={cn(
                                  "group relative min-h-[64px] cursor-pointer bg-transparent p-1 transition-colors border-r",
                                  isDarkMode ? "hover:bg-white/5 border-slate-800/20" : "hover:bg-white/5 border-slate-100"
                                )}
                                onClick={() => {
                                  setSelectedSlot({ day: weekday, hour, offset: viewOffset });
                                  setIsEventModalOpen(true);
                                }}>
                                {cellEvents.map(ev => {
                                  const act = ACTIVITIES.find(a => a.id === ev.activityId);
                                  const duration = (ev.endHour - ev.startHour + 24) % 24 || 24;
                                  return (
                                    <div 
                                      key={ev.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingEvent(ev);
                                        setIsEventModalOpen(true);
                                      }}
                                      className={cn(
                                        "h-full flex flex-col items-center justify-center text-center gap-2 rounded-xl p-3 text-[10px] font-semibold border transition-all hover:scale-[1.01] relative overflow-hidden group/ev",
                                        duration > 1 && "min-h-[120px]"
                                      )}
                                      style={{ 
                                        backgroundColor: `${GROUP_CONFIG[act?.group as keyof typeof GROUP_CONFIG]?.color || '#333'}20`, 
                                        color: GROUP_CONFIG[act?.group as keyof typeof GROUP_CONFIG]?.color || '#fff',
                                        borderColor: `${GROUP_CONFIG[act?.group as keyof typeof GROUP_CONFIG]?.color || '#333'}40`
                                      }}
                                    >
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="text-xl mb-1">{act?.icon}</span>
                                        <span className="leading-tight px-1">{ev.title || act?.name}</span>
                                      </div>
                                      
                                      {duration > 1 && (
                                        <div className="absolute bottom-2 left-0 right-0 text-[8px] opacity-60 font-mono tracking-tighter">
                                          {formatTimeRange(ev.startHour, ev.endHour)}
                                        </div>
                                      )}

                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteEvent(ev.id);
                                        }}
                                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-black/10 hover:bg-red-500 hover:text-white transition-all opacity-40 group-hover/ev:opacity-100"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

        {currentPage === 'perf' && (
          <PerformancePage 
            perfData={perfData} 
            setPerfData={setPerfData} 
            theme={theme}
            isFocusTimerRunning={isFocusTimerRunning}
            focusTime={focusTime}
            targetMins={targetMins}
            setTargetMins={setTargetMins}
            toggleFocusedTimer={toggleFocusedTimer}
            setIsLargeTimerOpen={setIsLargeTimerOpen}
            ambientSound={ambientSound}
            setAmbientSound={setAmbientSound}
            selectedSound={selectedSound}
            setSelectedSound={setSelectedSound}
          />
        )}
        {currentPage === 'list' && (
          <ListPage 
            perfData={perfData} 
            setPerfData={setPerfData} 
            isDarkMode={isDarkMode} 
            showToast={showToast}
          />
        )}
        {currentPage === '3v6r' && <ActionPage3v6R perfData={perfData} setPerfData={setPerfData} theme={theme} />}
        {currentPage === 'awards' && <AwardsPage perfData={perfData} isDarkMode={isDarkMode} theme={theme} />}
        {currentPage === 'settings' && <SettingsPage 
          themeKey={themeKey} 
          setThemeKey={setThemeKey} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          isFocusMode={isFocusMode}
          setIsFocusMode={setIsFocusMode}
          ambientSound={ambientSound}
          setAmbientSound={setAmbientSound}
          selectedSound={selectedSound}
          setSelectedSound={setSelectedSound}
          onStartFocusTimer={startFocusTimer}
          isFocusTimerRunning={isFocusTimerRunning}
          focusTime={focusTime}
          formatFocusTime={formatFocusTime}
          targetMins={targetMins}
          setTargetMins={setTargetMins}
          onToggleTimer={toggleFocusedTimer}
          onOpenLargeTimer={() => setIsLargeTimerOpen(true)}
          backups={backups}
          onCreateBackup={handleCreateBackup}
          onRestoreBackup={handleRestoreBackup}
          onClearData={() => {
            localStorage.clear();
            window.location.reload();
          }} 
        />}
      </div>
      
      {/* Footer System Status Bar */}
      <footer className={cn(
        "fixed bottom-0 left-0 right-0 backdrop-blur-md px-12 py-3 flex justify-between items-center text-[9px] uppercase tracking-[0.2em] border-t z-[60] transition-all duration-500",
        isDarkMode ? "bg-slate-950/80 text-slate-600 border-slate-800" : "bg-white/80 text-slate-400 border-slate-200",
        isFocusMode && "opacity-0 translate-y-full pointer-events-none"
      )}>
        <div className="flex items-center gap-2">
          System status: <span className="text-emerald-500 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Nominal</span>
        </div>
        <div className="flex gap-6">
          <span>Storage: Unified</span>
          <span>Security: DT-RSA-4096</span>
          <span className="hidden sm:inline">Engine: David Tung 2026 Core</span>
        </div>
      </footer>

      {/* Navigation - Minimalist Bento Style */}
      <div className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] border p-1 sm:p-2 rounded-[2rem] shadow-2xl backdrop-blur-xl transition-all duration-300 w-[95vw] sm:w-auto overflow-hidden",
        isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200 shadow-slate-200/50"
      )}>
        <div className="flex gap-1 sm:gap-2 justify-center">
          {[
            { id: 'home', icon: <Home size={20} />, label: 'Nodes' },
            { id: 'perf', icon: <Target size={20} />, label: 'Core' },
            { id: 'list', icon: <ClipboardList size={20} />, label: 'Matrix' },
            { id: '3v6r', icon: <Zap size={20} />, label: 'Pulse' },
            { id: 'awards', icon: <Trophy size={18} />, label: 'Contest' },
            { id: 'settings', icon: <Settings size={20} />, label: 'Configs' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setCurrentPage(item.id as any)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[1.5rem] px-2.5 sm:px-5 py-2 sm:py-3 transition-all active:scale-95 flex-1 sm:flex-initial min-w-0",
                currentPage === item.id 
                  ? (isDarkMode ? "bg-white text-black shadow-lg" : "bg-slate-900 text-white shadow-lg")
                  : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
              )}
            >
              <div className="flex flex-col items-center">
                {item.icon}
                <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-tighter leading-none mt-1 whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Reflection Archive Modal */}
      <AnimatePresence>
        {isReflectionArchiveOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] border overflow-hidden flex flex-col transition-colors duration-300 shadow-2xl",
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="p-8 border-b border-slate-800/20 flex justify-between items-center bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 text-white rounded-2xl">
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-bold uppercase tracking-[0.2em]", isDarkMode ? "text-white" : "text-slate-900")}>Matrix Archive</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Reviewing past reflections & growth nodes</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReflectionArchiveOpen(false)}
                  className="p-3 hover:bg-white/10 rounded-2xl transition-all"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {Object.keys(dailyData).length === 0 || !Object.values(dailyData as Record<string, DailyData>).some((d: DailyData) => d.r || d.g) ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic font-light">
                    <BookOpen size={40} className="mb-4 opacity-20" />
                    <p>No historical archives found in the matrix.</p>
                  </div>
                ) : (
                  Object.entries(dailyData as Record<string, DailyData>)
                    .filter(([, data]) => data.r || data.g)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([date, data]) => (
                      <div key={date} className={cn(
                        "group p-6 rounded-3xl border transition-all hover:scale-[1.01]",
                        isDarkMode ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                      )}>
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-xs font-mono font-bold text-white bg-white/10 px-3 py-1 rounded-full uppercase">
                            {format(new Date(date), 'MMMM dd, yyyy')}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
                              <Target size={12} /> 3v6R Performance
                            </div>
                            <div className={cn(
                              "p-4 rounded-2xl border grid grid-cols-2 gap-2",
                              isDarkMode ? "bg-black/20 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                            )}>
                              {(() => {
                                const log = perfData.dailyActivitiesLog?.[date] || { of: 0, p: 0, f: 0, c: 0, q: 0 };
                                return (
                                  <>
                                    <div className="text-[10px] text-slate-500">Sales: <span className="text-white font-bold">{log.of+log.p+log.f+log.c}</span></div>
                                    <div className="text-[10px] text-slate-500">QFYLP: <span className="text-yellow-500 font-bold">{formatNumber(log.q || 0)}</span></div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                              <Zap size={12} /> Elite Protocol
                            </div>
                            <div className={cn(
                              "p-4 rounded-2xl border text-[10px] space-y-1",
                              isDarkMode ? "bg-black/20 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-600 shadow-sm"
                            )}>
                              {(() => {
                                const details = (data as DailyData).protocolDetails || {};
                                const filled = Object.entries(details).filter(([, list]) => list.some(d => d.trim()));
                                if (filled.length === 0) return <div className="italic text-slate-600 underline">No protocol details logged.</div>;
                                return filled.map(([id, list]) => (
                                  <div key={id} className="break-words">
                                    • <span className="font-bold text-slate-500">{id.toUpperCase()}:</span> {list.filter(l => l.trim()).join(', ')}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Edit3 size={12} /> Reflection
                            </div>
                            <div className={cn(
                              "p-4 rounded-2xl text-[10px] leading-relaxed italic border min-h-[50px]",
                              isDarkMode ? "bg-black/20 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                            )}>
                              {(data as DailyData).r || "No reflection recorded."}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Modal - Bento Upgrade */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "w-full max-w-lg rounded-[2.5rem] border p-8 shadow-2xl transition-colors duration-300",
                isDarkMode ? "bg-slate-950 border-slate-800 shadow-white/10" : "bg-white border-slate-200 shadow-slate-200"
              )}
            >
              <div className="flex items-center gap-4 mb-8 p-4 rounded-[2rem] border transition-colors duration-300" 
                style={{ 
                  backgroundColor: isDarkMode ? `${theme.accent}15` : `${theme.accent}08`, 
                  borderColor: isDarkMode ? `${theme.accent}30` : `${theme.accent}20` 
                }}>
                <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.accent}30`, color: theme.accent }}><Plus size={20} /></div>
                <div>
                  <h3 className={cn("text-lg font-bold uppercase tracking-widest leading-tight transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>Tactical Insertion</h3>
                  <p className={cn("text-[9px] uppercase tracking-tighter italic font-medium leading-tight transition-colors", isDarkMode ? "text-slate-500" : "text-slate-400")}>"Precision in schedule leads to dominance in execution."</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">📌 具体事项 (Objective)</label>
                  <input 
                    id="modal-title" 
                    className={cn(
                      "w-full rounded-2xl border p-4 text-sm outline-none transition-all focus:border-white",
                      isDarkMode ? "border-slate-800 bg-slate-900/50 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                    )}
                    placeholder="Enter objective name..." 
                    defaultValue={editingEvent?.title || ''}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">🕒 开始时间 (Start)</label>
                    <select 
                      id="modal-start"
                      className={cn(
                        "w-full rounded-2xl border p-4 text-sm outline-none appearance-none transition-all focus:border-blue-500",
                        isDarkMode ? "border-slate-800 bg-slate-900/50 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                      )}
                      defaultValue={editingEvent?.startHour || selectedSlot?.hour || 9}
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <option key={h} value={h} className={isDarkMode ? "bg-slate-900" : "bg-white"}>{formatHour(h)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">🕒 结束时间 (End)</label>
                    <select 
                      id="modal-end"
                      className={cn(
                        "w-full rounded-2xl border p-4 text-sm outline-none appearance-none transition-all focus:border-blue-500",
                        isDarkMode ? "border-slate-800 bg-slate-900/50 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                      )}
                      defaultValue={editingEvent?.endHour || (selectedSlot?.hour ? selectedSlot.hour + 1 : 10)}
                    >
                      {Array.from({ length: 25 }).map((_, h) => (
                        <option key={h} value={h} className={isDarkMode ? "bg-slate-900" : "bg-white"}>{formatHour(h)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">🎨 活动类别 (Frequency Module)</label>
                  <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar p-1">
                    {ACTIVITIES.map(a => {
                      const isSelected = (editingEvent?.activityId === a.id);
                      const groupColor = GROUP_CONFIG[a.group as keyof typeof GROUP_CONFIG]?.color || '#333';
                      
                      return (
                        <button 
                          key={a.id} 
                          onClick={() => {
                            if (editingEvent) setEditingEvent({ ...editingEvent, activityId: a.id });
                            else {
                               const selector = document.getElementById('activity-selector');
                               if (selector) {
                                 selector.setAttribute('data-selected', a.id.toString());
                                 const btns = document.querySelectorAll('[data-activity-btn]');
                                 btns.forEach(b => b.classList.remove('ring-4', 'ring-blue-500/50', 'shadow-[0_0_15px_rgba(59,130,246,0.5)]'));
                                 const current = document.querySelector(`[data-id="${a.id}"]`);
                                 current?.classList.add('ring-4', 'ring-blue-500/50', 'shadow-[0_0_15px_rgba(59,130,246,0.5)]');
                               }
                            }
                          }}
                          data-id={a.id}
                          data-activity-btn
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-2xl p-3 text-[9px] transition-all hover:scale-110 border border-transparent",
                            isSelected && "ring-4 ring-white/50 shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-105"
                          )}
                          style={{ 
                            backgroundColor: isDarkMode ? `${groupColor}20` : `${groupColor}15`,
                            borderColor: `${groupColor}40`,
                          }}
                        >
                          <span className="text-xl" style={{ textShadow: isDarkMode ? `0 0 10px ${groupColor}40` : 'none' }}>{a.icon}</span>
                          <span className="text-center leading-tight font-bold" style={{ color: groupColor }}>{a.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div id="activity-selector" className="hidden" data-selected={editingEvent?.activityId || 1}></div>
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                   {editingEvent && (
                     <button 
                       onClick={() => {
                         handleDeleteEvent(editingEvent.id);
                         setIsEventModalOpen(false);
                         setEditingEvent(null);
                       }}
                       className="flex-1 min-w-[120px] rounded-2xl py-4 font-bold transition-all uppercase text-[10px] tracking-widest border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                     >
                       Delete
                     </button>
                   )}
                   <button 
                    onClick={() => {
                      setIsEventModalOpen(false);
                      setEditingEvent(null);
                    }} 
                    className={cn(
                      "flex-1 min-w-[120px] rounded-2xl py-4 font-bold transition-all uppercase text-[10px] tracking-widest border",
                      isDarkMode 
                       ? "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800" 
                       : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                    )}
                   >
                    Abort
                   </button>
                   <button 
                      onClick={() => {
                        const title = (document.getElementById('modal-title') as HTMLInputElement).value;
                        const sH = parseInt((document.getElementById('modal-start') as HTMLSelectElement).value);
                        const eH = parseInt((document.getElementById('modal-end') as HTMLSelectElement).value);
                        const actId = parseInt(document.getElementById('activity-selector')?.getAttribute('data-selected') || '1');

                        if (!title) return;
                        
                        if (editingEvent) {
                          handleUpdateEvent({ ...editingEvent, title, startHour: sH, endHour: eH, activityId: actId });
                        } else if (selectedSlot) {
                          handleAddEvent({
                            id: Math.random().toString(36).substr(2, 9),
                            title,
                            startHour: sH,
                            endHour: eH,
                            weekday: selectedSlot.day,
                            weekOffset: selectedSlot.offset,
                            activityId: actId
                          });
                        }
                        setIsEventModalOpen(false);
                        setEditingEvent(null);
                      }}
                      className={cn(
                        "flex-2 min-w-[160px] rounded-2xl py-4 font-bold transition-all active:scale-95 uppercase text-[10px] tracking-widest shadow-lg",
                        isDarkMode 
                         ? "bg-white text-black shadow-white/5 hover:bg-slate-100" 
                         : "bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800"
                      )}
                    >
                      Commit
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

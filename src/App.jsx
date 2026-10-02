import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ICONS,
  CalendarIcon,
  ClockIcon,
  ChartIcon,
  CheckSquareIcon,
  CopyIcon,
  DropletIcon,
  ExternalIcon,
  FitIcon,
  HeadphonesIcon,
  LinkIcon,
  MinusIcon,
  MoonIcon,
  NoteIcon,
  PlusIcon,
  QuoteIcon,
  RefreshIcon,
  RepeatIcon,
  ResetIcon,
  SlidersIcon,
  SproutIcon,
  StickyIcon,
  StopwatchIcon,
  SunIcon,
  TimerIcon,
  TodoistIcon,
  TrashIcon,
  XIcon,
} from './icons';

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                               */
/* ------------------------------------------------------------------ */

const KEYS = {
  settings: 'focus-canvas-settings-v3',
  widgets: 'focus-canvas-widgets-v3',
  notes: 'focus-canvas-notes-v3',
  tasks: 'focus-canvas-tasks-v3',
  habits: 'focus-canvas-habits-v3',
  water: 'focus-canvas-water-v3',
  links: 'focus-canvas-links-v3',
  countdown: 'focus-canvas-countdown-v3',
  sound: 'focus-canvas-sound-v3',
  stats: 'focus-canvas-stats-v3',
  todoist: 'focus-canvas-todoist-v3',
};

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;
const DEFAULT_VIEW = { scale: 1, x: 60, y: 60 };
const TODOIST_API = 'https://api.todoist.com/api/v1';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const todayKey = () => new Date().toISOString().slice(0, 10);

const readState = (key, fallback) => {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const useLocalStorageState = (key, initial) => {
  const [value, setValue] = useState(() => {
    const stored = readState(key, undefined);
    return stored === undefined ? initial : stored;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
};

const formatClock = (totalSeconds) => {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const formatStopwatch = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};

const countdownParts = (target) => {
  const diff = new Date(target).getTime() - Date.now();
  const forward = Math.max(0, diff);
  return {
    days: Math.floor(forward / 86400000),
    hours: Math.floor((forward % 86400000) / 3600000),
    minutes: Math.floor((forward % 3600000) / 60000),
    seconds: Math.floor((forward % 60000) / 1000),
    done: diff <= 0,
  };
};

const greeting = (hour) => {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/* ------------------------------------------------------------------ */
/*  Catalog                                                           */
/* ------------------------------------------------------------------ */

const WIDGET_CATALOG = [
  { key: 'timer', label: 'Focus', icon: TimerIcon, w: 260, h: 200 },
  { key: 'stopwatch', label: 'Stopwatch', icon: StopwatchIcon, w: 230, h: 180 },
  { key: 'pandora', label: 'Interval', icon: RepeatIcon, w: 250, h: 200 },
  { key: 'clock', label: 'Clock', icon: ClockIcon, w: 250, h: 170 },
  { key: 'countdown', label: 'Countdown', icon: CalendarIcon, w: 280, h: 200 },
  { key: 'tasks', label: 'Tasks', icon: CheckSquareIcon, w: 310, h: 250 },
  { key: 'habits', label: 'Habits', icon: SproutIcon, w: 340, h: 245 },
  { key: 'notes', label: 'Notes', icon: NoteIcon, w: 330, h: 230 },
  { key: 'water', label: 'Water', icon: DropletIcon, w: 250, h: 215 },
  { key: 'quote', label: 'Quote', icon: QuoteIcon, w: 340, h: 195 },
  { key: 'links', label: 'Links', icon: LinkIcon, w: 270, h: 220 },
  { key: 'sound', label: 'Sound', icon: HeadphonesIcon, w: 290, h: 230 },
  { key: 'stats', label: 'Today', icon: ChartIcon, w: 300, h: 220 },
  { key: 'sticky', label: 'Post-it', icon: StickyIcon, w: 250, h: 250 },
  { key: 'todoist', label: 'Todoist', icon: TodoistIcon, w: 340, h: 320 },
];

const CATALOG_MAP = Object.fromEntries(WIDGET_CATALOG.map((item) => [item.key, item]));

const STICKY_COLORS = ['#f7d64c', '#ffa07a', '#8fd3ff', '#9ae6b4', '#d9b8ff'];

const createWidget = (type, overrides = {}) => {
  const meta = CATALOG_MAP[type];
  return {
    id: uid(type),
    type,
    title: meta ? meta.label : type,
    visible: true,
    x: 120,
    y: 120,
    w: meta ? meta.w : 260,
    h: meta ? meta.h : 200,
    ...(type === 'sticky' ? { text: '', color: STICKY_COLORS[0] } : {}),
    ...overrides,
  };
};

const defaultSettings = {
  theme: 'dark',
  accent: '#0070f3',
  grid: true,
  gridStyle: 'dots',
  gridSize: 24,
  snap: false,
  scaleContent: true,
  zoomHud: true,
  hiddenPalette: [],
};
const GRID_SIZES = [16, 24, 32];
const ACCENT_PRESETS = ['#0070f3', '#ffffff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const QUOTES = [
  { text: 'Focus is the art of knowing what to ignore.', author: 'James Clear' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'The successful warrior is the average person with laser-like focus.', author: 'Bruce Lee' },
  { text: 'Starve your distractions, feed your focus.', author: 'Unknown' },
  { text: 'Concentrate all your thoughts upon the work at hand.', author: 'Alexander Graham Bell' },
  { text: 'Amateurs sit and wait for inspiration. The rest of us just get up and go to work.', author: 'Stephen King' },
  { text: 'It is not the daily increase but the daily decrease. Hack away at the unessential.', author: 'Bruce Lee' },
  { text: 'Little by little, a little becomes a lot.', author: 'Tanzanian proverb' },
];

const DEFAULT_TASKS = [
  { id: uid('task'), text: 'Block out your top priority', done: false },
  { id: uid('task'), text: 'Clear the inbox before the next cycle', done: false },
  { id: uid('task'), text: 'Take a real, screen-free break', done: false },
];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const DEFAULT_HABITS = [
  { id: uid('habit'), name: 'Deep work', days: new Array(7).fill(false) },
  { id: uid('habit'), name: 'Move your body', days: new Array(7).fill(false) },
  { id: uid('habit'), name: 'Read 20 minutes', days: new Array(7).fill(false) },
];

const DEFAULT_LINKS = [
  { id: uid('link'), label: 'Gmail', url: 'https://mail.google.com' },
  { id: uid('link'), label: 'Calendar', url: 'https://calendar.google.com' },
  { id: uid('link'), label: 'GitHub', url: 'https://github.com' },
];

const VALID_PROTOCOL = /^https?:\/\//i;
const normalizeUrl = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return VALID_PROTOCOL.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const SOUND_TYPES = [
  { key: 'white', label: 'White', cutoff: 9000 },
  { key: 'pink', label: 'Pink', cutoff: 1400 },
  { key: 'brown', label: 'Brown', cutoff: 700 },
  { key: 'rain', label: 'Rain', cutoff: 3200 },
];

/* ------------------------------------------------------------------ */
/*  Todoist helpers                                                   */
/* ------------------------------------------------------------------ */

const todoistList = (data) => (Array.isArray(data) ? data : data?.results ?? []);

const dayDiff = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

const dueLabel = (due) => {
  if (!due) return null;
  const raw = due.datetime || due.date;
  if (!raw) return due.string || null;
  const diff = dayDiff(raw);
  if (diff === null) return due.string || null;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff < 7) return new Date(raw).toLocaleDateString([], { weekday: 'long' });
  return new Date(raw).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/* ------------------------------------------------------------------ */
/*  Widget card                                                       */
/* ------------------------------------------------------------------ */

const CORNERS = ['nw', 'ne', 'sw', 'se'];

function WidgetCard({ widget, focused, mobile, scaleContent, onFocus, onRemove, onDuplicate, onDragStart, onResizeStart, onMobileResizeStart, children }) {
  const Icon = ICONS[widget.type] || TimerIcon;
  const meta = CATALOG_MAP[widget.type];
  const baseW = meta ? meta.w : widget.w;
  const baseH = meta ? meta.h : widget.h;
  const ws = !mobile && scaleContent ? Math.min(widget.w / baseW, widget.h / baseH) : 1;

  // Mobile: press and hold a widget to reveal a hint naming it (press again to dismiss).
  const [hintOpen, setHintOpen] = useState(false);
  const longPressRef = useRef(null);
  const pressRef = useRef(null);

  const beginLongPress = (event) => {
    if (!mobile) return;
    const target = event.target;
    if (target instanceof Element && target.closest('button, a, input, textarea, select, .widget-resize')) return;
    pressRef.current = { x: event.clientX, y: event.clientY };
    clearTimeout(longPressRef.current);
    longPressRef.current = setTimeout(() => {
      setHintOpen((open) => !open);
      pressRef.current = null;
    }, 450);
  };

  const moveLongPress = (event) => {
    if (!pressRef.current) return;
    if (Math.abs(event.clientX - pressRef.current.x) > 10 || Math.abs(event.clientY - pressRef.current.y) > 10) {
      clearTimeout(longPressRef.current);
      pressRef.current = null;
    }
  };

  const endLongPress = () => {
    clearTimeout(longPressRef.current);
    pressRef.current = null;
  };

  useEffect(() => () => clearTimeout(longPressRef.current), []);

  const cardStyle = mobile
    ? widget.mh
      ? { minHeight: `${widget.mh}px` }
      : undefined
    : { left: `${widget.x}px`, top: `${widget.y}px`, width: `${widget.w}px`, height: `${widget.h}px`, '--ws': `${ws}` };

  return (
    <section
      className={`widget ${mobile ? 'widget--flow' : ''} ${focused ? 'is-focused' : ''}`}
      style={cardStyle}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      onPointerDown={beginLongPress}
      onPointerMove={moveLongPress}
      onPointerUp={endLongPress}
      onPointerCancel={endLongPress}
      onPointerLeave={endLongPress}
    >
      {mobile && hintOpen && (
        <button type="button" className="widget-hint" onClick={() => setHintOpen(false)}>
          <Icon size={13} />
          {meta ? meta.label : widget.title}
        </button>
      )}
      <header className={`widget-header ${mobile ? 'static' : ''}`} onPointerDown={mobile ? undefined : onDragStart}>
        <span className="widget-title">
          <Icon size={15} />
          {widget.title}
        </span>
        <div className="widget-actions" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={onDuplicate} aria-label={`Duplicate ${widget.title}`}>
            <CopyIcon size={14} />
          </button>
          <button type="button" onClick={onRemove} aria-label={`Remove ${widget.title}`}>
            <XIcon size={14} />
          </button>
        </div>
      </header>
      <div className="widget-content">
        <div className="widget-scale">{children}</div>
      </div>
      {!mobile &&
        CORNERS.map((corner) => (
          <span
            key={corner}
            className={`handle handle--${corner}`}
            onPointerDown={(event) => onResizeStart(event, corner)}
            aria-hidden="true"
          />
        ))}
      {mobile && (
        <div className="widget-resize" onPointerDown={onMobileResizeStart} role="separator" aria-label="Resize widget">
          <span className="widget-resize-grip" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const viewportRef = useRef(null);

  const [settings, setSettings] = useLocalStorageState(KEYS.settings, defaultSettings);
  const prefs = useMemo(() => ({ ...defaultSettings, ...settings }), [settings]);
  const [widgets, setWidgets] = useLocalStorageState(KEYS.widgets, []);
  const [notesText, setNotesText] = useLocalStorageState(KEYS.notes, '');
  const [tasks, setTasks] = useLocalStorageState(KEYS.tasks, DEFAULT_TASKS);
  const [habits, setHabits] = useLocalStorageState(KEYS.habits, DEFAULT_HABITS);
  const [water, setWater] = useLocalStorageState(KEYS.water, { glasses: 0, goal: 8 });
  const [links, setLinks] = useLocalStorageState(KEYS.links, DEFAULT_LINKS);
  const [countdown, setCountdown] = useLocalStorageState(KEYS.countdown, {
    label: 'Next milestone',
    target: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const [sound, setSound] = useLocalStorageState(KEYS.sound, { playing: false, type: 'brown', volume: 0.35 });
  const [stats, setStats] = useLocalStorageState(KEYS.stats, { day: todayKey(), sessions: 0, focusMinutes: 0 });
  const [todoistToken, setTodoistToken] = useLocalStorageState(KEYS.todoist, '');
  const [todoist, setTodoist] = useState({ tasks: [], projects: [], status: 'idle', error: '' });
  const [todoistFilter, setTodoistFilter] = useState('today');
  const [todoistDraft, setTodoistDraft] = useState('');
  const [todoistTokenDraft, setTodoistTokenDraft] = useState('');
  const [todoistEditing, setTodoistEditing] = useState(false);
  const [todoistBusy, setTodoistBusy] = useState(null);

  const [newTask, setNewTask] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [linkDraft, setLinkDraft] = useState({ label: '', url: '' });
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const [timer, setTimer] = useState({ running: false, remaining: 25 * 60, preset: 25 * 60 });
  const [stopwatch, setStopwatch] = useState({ running: false, elapsed: 0 });
  const [pandora, setPandora] = useState({ running: false, remaining: 20 * 60, preset: 20 * 60 });

  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState(DEFAULT_VIEW);
  const [focusedId, setFocusedId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 820,
  );

  const audioRef = useRef({ ctx: null, gain: null, source: null, filter: null });
  const volumeRef = useRef(sound.volume);

  /* --- responsive --- */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* --- master tick --- */
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      setTimer((current) => (current.running ? { ...current, remaining: Math.max(0, current.remaining - 1) } : current));
      setStopwatch((current) => (current.running ? { ...current, elapsed: current.elapsed + 1 } : current));
      setPandora((current) => (current.running ? { ...current, remaining: Math.max(0, current.remaining - 1) } : current));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer.running && timer.remaining === 0) {
      setTimer((current) => ({ ...current, running: false }));
      setStats((current) => ({
        day: todayKey(),
        sessions: (current.day === todayKey() ? current.sessions : 0) + 1,
        focusMinutes: (current.day === todayKey() ? current.focusMinutes : 0) + Math.round(timer.preset / 60),
      }));
    }
  }, [timer, setStats]);

  useEffect(() => {
    if (pandora.running && pandora.remaining === 0) {
      setPandora((current) => ({ ...current, running: false }));
    }
  }, [pandora]);

  useEffect(() => {
    if (stats.day !== todayKey()) {
      setStats({ day: todayKey(), sessions: 0, focusMinutes: 0 });
    }
  }, [stats.day, setStats]);

  /* ------------------------------------------------------------------ */
  /*  Ambient audio                                                     */
  /* ------------------------------------------------------------------ */

  const stopSound = useCallback(() => {
    const audio = audioRef.current;
    if (audio.source) {
      try {
        audio.source.stop();
      } catch {
        /* already stopped */
      }
      audio.source.disconnect();
      audio.source = null;
    }
  }, []);

  const startSound = useCallback((type) => {
    const audio = audioRef.current;
    if (!audio.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio.ctx = new Ctx();
      audio.gain = audio.ctx.createGain();
      audio.filter = audio.ctx.createBiquadFilter();
      audio.filter.type = 'lowpass';
      audio.filter.connect(audio.gain);
      audio.gain.connect(audio.ctx.destination);
    }

    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    stopSound();

    const ctx = audio.ctx;
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.4;
      } else if (type === 'pink') {
        last = 0.96 * last + 0.04 * white;
        data[i] = last * 2.2;
      } else if (type === 'rain') {
        last = 0.6 * last + 0.4 * white;
        data[i] = Math.max(-1, Math.min(1, last * 1.4));
      } else {
        data[i] = white * 0.6;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const preset = SOUND_TYPES.find((item) => item.key === type) || SOUND_TYPES[0];
    audio.filter.frequency.value = preset.cutoff;
    audio.gain.gain.value = volumeRef.current;
    source.connect(audio.filter);
    source.start();
    audio.source = source;
  }, [stopSound]);

  useEffect(() => {
    if (sound.playing) startSound(sound.type);
    else stopSound();
    return () => stopSound();
  }, [sound.playing, sound.type, startSound, stopSound]);

  useEffect(() => {
    volumeRef.current = sound.volume;
    const audio = audioRef.current;
    if (audio.gain) audio.gain.gain.value = sound.volume;
  }, [sound.volume]);

  /* ------------------------------------------------------------------ */
  /*  Todoist                                                           */
  /* ------------------------------------------------------------------ */

  const todoistFetch = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${TODOIST_API}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${todoistToken}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      if (!response.ok) {
        let message = `Todoist request failed (${response.status}).`;
        if (response.status === 401 || response.status === 403) message = 'Invalid or expired API token.';
        else if (response.status === 429) message = 'Rate limited — try again in a moment.';
        throw new Error(message);
      }
      if (response.status === 204) return null;
      return response.json();
    },
    [todoistToken],
  );

  const loadTodoist = useCallback(async () => {
    if (!todoistToken) {
      setTodoist({ tasks: [], projects: [], status: 'idle', error: '' });
      return;
    }
    setTodoist((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const [tasksData, projectsData] = await Promise.all([
        todoistFetch('/tasks'),
        todoistFetch('/projects'),
      ]);
      setTodoist({ tasks: todoistList(tasksData), projects: todoistList(projectsData), status: 'ready', error: '' });
    } catch (error) {
      const message =
        error instanceof TypeError
          ? 'Network error — check your connection and try again.'
          : error.message || 'Could not reach Todoist.';
      setTodoist((current) => ({ ...current, status: 'error', error: message }));
    }
  }, [todoistFetch, todoistToken]);

  useEffect(() => {
    loadTodoist();
  }, [loadTodoist]);

  const todoistFiltered = useMemo(() => {
    const tasks = todoist.tasks;
    const diffOf = (task) => (task.due ? dayDiff(task.due.datetime || task.due.date) : null);
    if (todoistFilter === 'all') return tasks;
    if (todoistFilter === 'priority') return tasks.filter((task) => (task.priority || 1) >= 3).sort((a, b) => (b.priority || 1) - (a.priority || 1));
    if (todoistFilter === 'today') {
      return tasks
        .filter((task) => {
          const diff = diffOf(task);
          return diff !== null && diff <= 0;
        })
        .sort((a, b) => diffOf(a) - diffOf(b) || (b.priority || 1) - (a.priority || 1));
    }
    return tasks
      .filter((task) => {
        const diff = diffOf(task);
        return diff !== null && diff > 0 && diff <= 7;
      })
      .sort((a, b) => diffOf(a) - diffOf(b));
  }, [todoist.tasks, todoistFilter]);

  const completeTodoistTask = useCallback(
    async (task) => {
      setTodoistBusy(task.id);
      try {
        await todoistFetch(`/tasks/${task.id}/close`, { method: 'POST' });
        setTodoist((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id), error: '' }));
      } catch (error) {
        setTodoist((current) => ({ ...current, error: error.message }));
      } finally {
        setTodoistBusy(null);
      }
    },
    [todoistFetch],
  );

  const addTodoistTask = async (event) => {
    event.preventDefault();
    const content = todoistDraft.trim();
    if (!content) return;
    try {
      const created = await todoistFetch('/tasks', { method: 'POST', body: JSON.stringify({ content }) });
      if (created && created.id) setTodoist((current) => ({ ...current, tasks: [created, ...current.tasks], error: '' }));
      setTodoistDraft('');
    } catch (error) {
      setTodoist((current) => ({ ...current, error: error.message }));
    }
  };

  const saveTodoistToken = (event) => {
    event.preventDefault();
    const token = todoistTokenDraft.trim();
    if (!token) return;
    setTodoistToken(token);
    setTodoistTokenDraft('');
    setTodoistEditing(false);
  };

  const projectName = (id) => todoist.projects.find((project) => project.id === id)?.name || '';

  /* ------------------------------------------------------------------ */
  /*  Zoom & pan                                                        */
  /* ------------------------------------------------------------------ */

  const zoomAt = useCallback((factor, clientX, clientY) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    setView((current) => {
      const next = clamp(current.scale * factor, MIN_ZOOM, MAX_ZOOM);
      if (next === current.scale) return current;
      if (!rect) return { ...current, scale: next };
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const boardX = (px - current.x) / current.scale;
      const boardY = (py - current.y) / current.scale;
      return { scale: next, x: px - boardX * next, y: py - boardY * next };
    });
  }, []);

  const zoomBy = useCallback((factor) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [zoomAt]);

  const resetView = useCallback(() => setView(DEFAULT_VIEW), []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element || isMobile) return undefined;
    const onWheel = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [isMobile, zoomAt]);

  const startPan = (event) => {
    const target = event.target;
    const onBoard = target === viewportRef.current || (target instanceof Element && target.classList.contains('board'));
    if (!onBoard) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...view };

    const move = (moveEvent) => {
      setView({ ...origin, x: origin.x + (moveEvent.clientX - startX), y: origin.y + (moveEvent.clientY - startY) });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /* ------------------------------------------------------------------ */
  /*  Widget mutations                                                  */
  /* ------------------------------------------------------------------ */

  const visibleWidgets = useMemo(() => widgets.filter((widget) => widget.visible), [widgets]);

  const addWidget = useCallback((type) => {
    const meta = CATALOG_MAP[type];
    const rect = viewportRef.current?.getBoundingClientRect();
    const vw = rect?.width ?? 900;
    const vh = rect?.height ?? 640;
    const duplicates = widgets.filter((widget) => widget.type === type).length;
    const boardX = (vw / 2 - view.x) / view.scale - meta.w / 2 + duplicates * 28;
    const boardY = (vh / 2 - view.y) / view.scale - meta.h / 2 + duplicates * 28;
    setWidgets((current) => [...current, createWidget(type, { x: boardX, y: boardY })]);
  }, [setWidgets, view, widgets]);

  const removeWidget = useCallback((id) => {
    setWidgets((current) => current.filter((widget) => widget.id !== id));
  }, [setWidgets]);

  const duplicateWidget = useCallback((id) => {
    setWidgets((current) => {
      const source = current.find((widget) => widget.id === id);
      if (!source) return current;
      return [...current, { ...source, id: uid(source.type), x: source.x + 32, y: source.y + 32 }];
    });
  }, [setWidgets]);

  const updateWidget = useCallback((id, changes) => {
    setWidgets((current) => current.map((widget) => (widget.id === id ? { ...widget, ...changes } : widget)));
  }, [setWidgets]);

  const startDrag = useCallback((event, widgetId) => {
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = widget.x;
    const originY = widget.y;
    const scale = view.scale;
    const snap = prefs.snap;
    const step = prefs.gridSize;

    const move = (moveEvent) => {
      let nextX = originX + (moveEvent.clientX - startX) / scale;
      let nextY = originY + (moveEvent.clientY - startY) / scale;
      if (snap) {
        nextX = Math.round(nextX / step) * step;
        nextY = Math.round(nextY / step) * step;
      }
      updateWidget(widgetId, { x: nextX, y: nextY });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [widgets, view.scale, updateWidget, prefs.snap, prefs.gridSize]);

  const startResize = useCallback((event, widgetId, corner) => {
    event.stopPropagation();
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { x: widget.x, y: widget.y, w: widget.w, h: widget.h };
    const scale = view.scale;
    const snap = prefs.snap;
    const step = prefs.gridSize;
    const MIN_W = 180;
    const MIN_H = 120;

    const move = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      let { x, y, w, h } = origin;
      if (corner.includes('e')) w = Math.max(MIN_W, origin.w + dx);
      if (corner.includes('s')) h = Math.max(MIN_H, origin.h + dy);
      if (corner.includes('w')) {
        w = Math.max(MIN_W, origin.w - dx);
        x = origin.x + origin.w - w;
      }
      if (corner.includes('n')) {
        h = Math.max(MIN_H, origin.h - dy);
        y = origin.y + origin.h - h;
      }
      if (snap) {
        w = Math.max(MIN_W, Math.round(w / step) * step);
        h = Math.max(MIN_H, Math.round(h / step) * step);
        if (corner.includes('w')) x = origin.x + origin.w - w;
        if (corner.includes('n')) y = origin.y + origin.h - h;
      }
      updateWidget(widgetId, { x, y, w, h });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [widgets, view.scale, updateWidget, prefs.snap, prefs.gridSize]);

  const startMobileResize = useCallback((event, widgetId) => {
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget) return;
    const section = event.currentTarget.closest('.widget');
    const startY = event.clientY;
    const startH = section ? section.getBoundingClientRect().height : widget.mh || 240;

    const move = (moveEvent) => {
      const next = clamp(Math.round(startH + (moveEvent.clientY - startY)), 160, 1600);
      updateWidget(widgetId, { mh: next });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [widgets, updateWidget]);

  /* ------------------------------------------------------------------ */
  /*  Data helpers                                                      */
  /* ------------------------------------------------------------------ */

  const addTask = (event) => {
    event.preventDefault();
    const text = newTask.trim();
    if (!text) return;
    setTasks((current) => [...current, { id: uid('task'), text, done: false }]);
    setNewTask('');
  };

  const doneTasks = tasks.filter((task) => task.done).length;

  const addHabit = (event) => {
    event.preventDefault();
    const name = newHabit.trim();
    if (!name) return;
    setHabits((current) => [...current, { id: uid('habit'), name, days: new Array(7).fill(false) }]);
    setNewHabit('');
  };

  const toggleHabit = (id, dayIndex) => {
    setHabits((current) =>
      current.map((habit) =>
        habit.id === id
          ? { ...habit, days: habit.days.map((value, index) => (index === dayIndex ? !value : value)) }
          : habit,
      ),
    );
  };

  const addLink = (event) => {
    event.preventDefault();
    const url = normalizeUrl(linkDraft.url);
    const label = linkDraft.label.trim() || url.replace(/^https?:\/\//i, '').split('/')[0];
    if (!url || !label) return;
    setLinks((current) => [...current, { id: uid('link'), label, url }]);
    setLinkDraft({ label: '', url: '' });
  };

  const adjustWater = (delta) => {
    setWater((current) => ({ ...current, glasses: clamp(current.glasses + delta, 0, 30) }));
  };

  const clearCanvas = () => setWidgets([]);

  const togglePaletteItem = (key) => {
    setSettings((current) => {
      const hidden = current.hiddenPalette ?? [];
      return {
        ...current,
        hiddenPalette: hidden.includes(key) ? hidden.filter((item) => item !== key) : [...hidden, key],
      };
    });
  };

  /* ------------------------------------------------------------------ */
  /*  Widget bodies                                                     */
  /* ------------------------------------------------------------------ */

  const renderWidgetBody = (widget) => {
    switch (widget.type) {
      case 'timer':
        return (
          <div className="widget-body">
            <div className="big-number">{formatClock(timer.remaining)}</div>
            <div className="chip-row">
              {[15, 25, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`chip ${timer.preset === minutes * 60 ? 'active' : ''}`}
                  onClick={() => setTimer({ running: false, remaining: minutes * 60, preset: minutes * 60 })}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <div className="action-row">
              <button type="button" className="primary" onClick={() => setTimer((current) => ({ ...current, running: !current.running }))}>
                {timer.running ? 'Pause' : 'Start'}
              </button>
              <button type="button" onClick={() => setTimer({ running: false, remaining: timer.preset, preset: timer.preset })}>
                Reset
              </button>
            </div>
          </div>
        );

      case 'stopwatch':
        return (
          <div className="widget-body">
            <div className="big-number">{formatStopwatch(stopwatch.elapsed)}</div>
            <div className="action-row">
              <button type="button" className="primary" onClick={() => setStopwatch((current) => ({ ...current, running: !current.running }))}>
                {stopwatch.running ? 'Pause' : 'Start'}
              </button>
              <button type="button" onClick={() => setStopwatch({ running: false, elapsed: 0 })}>Reset</button>
            </div>
          </div>
        );

      case 'pandora':
        return (
          <div className="widget-body">
            <div className="big-number">{formatClock(pandora.remaining)}</div>
            <div className="chip-row">
              {[10, 20, 50].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`chip ${pandora.preset === minutes * 60 ? 'active' : ''}`}
                  onClick={() => setPandora({ running: false, remaining: minutes * 60, preset: minutes * 60 })}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <div className="action-row">
              <button type="button" className="primary" onClick={() => setPandora((current) => ({ ...current, running: !current.running }))}>
                {pandora.running ? 'Pause' : 'Start'}
              </button>
              <button type="button" onClick={() => setPandora({ running: false, remaining: pandora.preset, preset: pandora.preset })}>Reset</button>
            </div>
          </div>
        );

      case 'clock': {
        const date = new Date(now);
        return (
          <div className="widget-body clock-body">
            <div className="clock-time">
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <span className="clock-seconds">:{String(date.getSeconds()).padStart(2, '0')}</span>
            </div>
            <div className="clock-date">{date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="clock-greeting">{greeting(date.getHours())}</div>
          </div>
        );
      }

      case 'countdown': {
        const parts = countdownParts(countdown.target);
        return (
          <div className="widget-body">
            <div className="mini-heading">{countdown.label || 'Countdown'}</div>
            <div className="countdown-row">
              {[
                { value: parts.days, unit: 'days' },
                { value: parts.hours, unit: 'hrs' },
                { value: parts.minutes, unit: 'min' },
                { value: parts.seconds, unit: 'sec' },
              ].map((item) => (
                <div className="countdown-cell" key={item.unit}>
                  <strong>{String(item.value).padStart(2, '0')}</strong>
                  <span>{item.unit}</span>
                </div>
              ))}
            </div>
            <div className="field-grid">
              <label>
                Label
                <input
                  type="text"
                  value={countdown.label}
                  onChange={(event) => setCountdown((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Launch day"
                />
              </label>
              <label>
                Target date
                <input
                  type="date"
                  value={countdown.target.slice(0, 10)}
                  onChange={(event) => event.target.value && setCountdown((current) => ({ ...current, target: event.target.value }))}
                />
              </label>
            </div>
          </div>
        );
      }

      case 'tasks':
        return (
          <div className="widget-body">
            <div className="progress-line">
              <div className="progress-track">
                <span style={{ width: `${tasks.length ? (doneTasks / tasks.length) * 100 : 0}%` }} />
              </div>
              <span className="progress-label">{doneTasks}/{tasks.length}</span>
            </div>
            <div className="task-list scrollable">
              {tasks.length === 0 && <div className="hint">No tasks yet — add your first one below.</div>}
              {tasks.map((task) => (
                <div className={`task-item ${task.done ? 'done' : ''}`} key={task.id}>
                  <label className="task-main">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() =>
                        setTasks((current) =>
                          current.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)),
                        )
                      }
                    />
                    <span>{task.text}</span>
                  </label>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Delete task"
                    onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
                  >
                    <XIcon size={13} />
                  </button>
                </div>
              ))}
            </div>
            <form className="inline-form" onSubmit={addTask}>
              <input
                type="text"
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                placeholder="Add a task…"
                aria-label="New task"
              />
              <button type="submit" className="primary" disabled={!newTask.trim()}>
                <PlusIcon size={15} />
              </button>
            </form>
          </div>
        );

      case 'habits':
        return (
          <div className="widget-body">
            <div className="habit-head">
              <span />
              {DAY_LABELS.map((label, index) => (
                <span className="habit-day-label" key={`${label}-${index}`}>{label}</span>
              ))}
              <span />
            </div>
            <div className="habit-list scrollable">
              {habits.map((habit) => (
                <div className="habit-row" key={habit.id}>
                  <span className="habit-name" title={habit.name}>{habit.name}</span>
                  {habit.days.map((value, dayIndex) => (
                    <button
                      key={dayIndex}
                      type="button"
                      className={`habit-dot ${value ? 'on' : ''}`}
                      aria-label={`${habit.name} day ${dayIndex + 1}`}
                      onClick={() => toggleHabit(habit.id, dayIndex)}
                    />
                  ))}
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Remove habit"
                    onClick={() => setHabits((current) => current.filter((item) => item.id !== habit.id))}
                  >
                    <XIcon size={13} />
                  </button>
                </div>
              ))}
            </div>
            <form className="inline-form" onSubmit={addHabit}>
              <input
                type="text"
                value={newHabit}
                onChange={(event) => setNewHabit(event.target.value)}
                placeholder="New habit…"
                aria-label="New habit"
              />
              <button type="submit" className="primary" disabled={!newHabit.trim()}>
                <PlusIcon size={15} />
              </button>
            </form>
          </div>
        );

      case 'notes':
        return (
          <textarea
            className="notes-area"
            value={notesText}
            onChange={(event) => setNotesText(event.target.value)}
            placeholder="Write something…"
          />
        );

      case 'water': {
        const pct = Math.min(100, Math.round((water.glasses / Math.max(1, water.goal)) * 100));
        return (
          <div className="widget-body">
            <div className="water-top">
              <div className="water-count">
                <strong>{water.glasses}</strong>
                <span>/ {water.goal} glasses</span>
              </div>
              <div className="water-pct">{pct}%</div>
            </div>
            <div className="water-drops">
              {Array.from({ length: water.goal }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`water-drop ${index < water.glasses ? 'filled' : ''}`}
                  aria-label={`Glass ${index + 1}`}
                  onClick={() => setWater((current) => ({ ...current, glasses: index + 1 }))}
                />
              ))}
            </div>
            <div className="action-row">
              <button type="button" onClick={() => adjustWater(-1)} disabled={water.glasses === 0}>
                <MinusIcon size={15} />
              </button>
              <button type="button" className="primary" onClick={() => adjustWater(1)}>
                <PlusIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => setWater((current) => ({ ...current, goal: current.goal >= 12 ? 4 : current.goal + 1 }))}
              >
                Goal {water.goal}
              </button>
            </div>
          </div>
        );
      }

      case 'quote': {
        const quote = QUOTES[quoteIndex % QUOTES.length];
        return (
          <div className="widget-body quote-body">
            <QuoteIcon size={20} className="quote-glyph" />
            <p className="quote-text">{quote.text}</p>
            <p className="quote-author">— {quote.author}</p>
            <button
              type="button"
              className="text-btn"
              onClick={() => setQuoteIndex((current) => (current + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length)}
            >
              New quote
            </button>
          </div>
        );
      }

      case 'links':
        return (
          <div className="widget-body">
            <div className="link-list scrollable">
              {links.length === 0 && <div className="hint">Add shortcuts to your most-used tools.</div>}
              {links.map((link) => (
                <div className="link-row" key={link.id}>
                  <a className="link-pill" href={link.url} target="_blank" rel="noreferrer noopener">
                    <LinkIcon size={14} />
                    {link.label}
                  </a>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove ${link.label}`}
                    onClick={() => setLinks((current) => current.filter((item) => item.id !== link.id))}
                  >
                    <XIcon size={13} />
                  </button>
                </div>
              ))}
            </div>
            <form className="field-grid" onSubmit={addLink}>
              <input
                type="text"
                value={linkDraft.label}
                onChange={(event) => setLinkDraft((current) => ({ ...current, label: event.target.value }))}
                placeholder="Label"
                aria-label="Link label"
              />
              <input
                type="text"
                value={linkDraft.url}
                onChange={(event) => setLinkDraft((current) => ({ ...current, url: event.target.value }))}
                placeholder="example.com"
                aria-label="Link url"
              />
              <button type="submit" className="primary" disabled={!linkDraft.url.trim()}>Add link</button>
            </form>
          </div>
        );

      case 'sound':
        return (
          <div className="widget-body">
            <div className="chip-row">
              {SOUND_TYPES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`chip ${sound.type === item.key ? 'active' : ''}`}
                  onClick={() => setSound((current) => ({ ...current, type: item.key }))}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`sound-toggle ${sound.playing ? 'playing' : ''}`}
              onClick={() => setSound((current) => ({ ...current, playing: !current.playing }))}
            >
              <span className="sound-bars" aria-hidden="true">
                <i /><i /><i /><i />
              </span>
              {sound.playing ? 'Pause ambience' : 'Play ambience'}
            </button>
            <label className="slider-row">
              <span>Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sound.volume}
                onChange={(event) => setSound((current) => ({ ...current, volume: Number(event.target.value) }))}
              />
            </label>
          </div>
        );

      case 'stats': {
        const focusHours = (stats.focusMinutes / 60).toFixed(1);
        const taskPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
        return (
          <div className="widget-body">
            <div className="stat-grid">
              <div className="stat-cell">
                <strong>{stats.sessions}</strong>
                <span>Sessions</span>
              </div>
              <div className="stat-cell">
                <strong>{focusHours}h</strong>
                <span>Focused</span>
              </div>
              <div className="stat-cell">
                <strong>{taskPct}%</strong>
                <span>Tasks done</span>
              </div>
              <div className="stat-cell">
                <strong>{water.glasses}</strong>
                <span>Glasses</span>
              </div>
            </div>
            <div className="micro-copy">Resets each morning.</div>
          </div>
        );
      }

      case 'sticky':
        return (
          <div className="sticky" style={{ background: widget.color || STICKY_COLORS[0] }}>
            <textarea
              className="sticky-text"
              value={widget.text || ''}
              onChange={(event) => updateWidget(widget.id, { text: event.target.value })}
              placeholder="Write a note…"
              aria-label="Sticky note text"
            />
            <div className="sticky-colors" onPointerDown={(event) => event.stopPropagation()}>
              {STICKY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`sticky-swatch ${(widget.color || STICKY_COLORS[0]) === color ? 'active' : ''}`}
                  style={{ background: color }}
                  aria-label={`Sticky color ${color}`}
                  onClick={() => updateWidget(widget.id, { color })}
                />
              ))}
            </div>
          </div>
        );

      case 'todoist': {
        if (!todoistToken || todoistEditing) {
          return (
            <div className="widget-body todoist-body">
              <div className="todoist-intro">
                <strong>Connect Todoist</strong>
                <span>Paste your personal API token. It is stored only in this browser and never leaves it.</span>
              </div>
              <form className="field-grid" onSubmit={saveTodoistToken}>
                <input
                  type="password"
                  value={todoistTokenDraft}
                  onChange={(event) => setTodoistTokenDraft(event.target.value)}
                  placeholder="Paste API token…"
                  aria-label="Todoist API token"
                  autoComplete="off"
                />
                <div className="todoist-setup-actions">
                  <button type="submit" className="primary" disabled={!todoistTokenDraft.trim()}>
                    Save token
                  </button>
                  {todoistToken && (
                    <button type="button" onClick={() => setTodoistEditing(false)}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              <a
                className="todoist-help"
                href="https://todoist.com/app/settings/integrations/developer"
                target="_blank"
                rel="noreferrer noopener"
              >
                <ExternalIcon size={13} /> Todoist Settings → Integrations → Developer
              </a>
              {todoistToken && (
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    setTodoistToken('');
                    setTodoistEditing(false);
                  }}
                >
                  Remove saved token
                </button>
              )}
              {todoist.error && <div className="todoist-error">{todoist.error}</div>}
            </div>
          );
        }

        const loading = todoist.status === 'loading';
        return (
          <div className="widget-body todoist-body">
            <div className="todoist-head">
              <div className="todoist-counts">
                <strong>{todoist.tasks.length}</strong>
                <span>open {todoist.tasks.length === 1 ? 'task' : 'tasks'}</span>
              </div>
              <div className="todoist-head-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Refresh Todoist"
                  onClick={loadTodoist}
                  disabled={loading}
                >
                  <RefreshIcon size={14} />
                </button>
                <button type="button" className="icon-btn" aria-label="Edit Todoist token" onClick={() => setTodoistEditing(true)}>
                  <SlidersIcon size={14} />
                </button>
              </div>
            </div>

            <div className="chip-row todoist-filters">
              {[
                { key: 'today', label: 'Today' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'priority', label: 'Priority' },
                { key: 'all', label: 'All' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`chip ${todoistFilter === item.key ? 'active' : ''}`}
                  onClick={() => setTodoistFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="todoist-list scrollable">
              {loading && todoist.tasks.length === 0 && <div className="hint">Syncing with Todoist…</div>}
              {todoist.status === 'error' && <div className="todoist-error">{todoist.error}</div>}
              {!loading && todoist.status !== 'error' && todoistFiltered.length === 0 && (
                <div className="hint">
                  {todoistFilter === 'today' ? 'Nothing due today — clear skies.' : 'No tasks in this view.'}
                </div>
              )}
              {todoistFiltered.map((task) => {
                const diff = task.due ? dayDiff(task.due.datetime || task.due.date) : null;
                const due = dueLabel(task.due);
                const project = projectName(task.project_id);
                const priority = task.priority || 1;
                return (
                  <div className={`todoist-item ${todoistBusy === task.id ? 'busy' : ''}`} key={task.id}>
                    <button
                      type="button"
                      className="todoist-check"
                      aria-label={`Complete ${task.content}`}
                      onClick={() => completeTodoistTask(task)}
                      disabled={todoistBusy === task.id}
                    >
                      <CheckSquareIcon size={15} />
                    </button>
                    <div className="todoist-main">
                      <span className="todoist-text">{task.content}</span>
                      <div className="todoist-meta">
                        <span className={`prio prio-${priority}`} title={`Priority ${5 - priority}`} />
                        {due && (
                          <span className={`todoist-due ${diff !== null && diff < 0 ? 'overdue' : diff === 0 ? 'today' : ''}`}>
                            {due}
                          </span>
                        )}
                        {project && <span className="todoist-proj">{project}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form className="inline-form" onSubmit={addTodoistTask}>
              <input
                type="text"
                value={todoistDraft}
                onChange={(event) => setTodoistDraft(event.target.value)}
                placeholder="Add a task…"
                aria-label="New Todoist task"
              />
              <button type="submit" className="primary" disabled={!todoistDraft.trim()}>
                <PlusIcon size={15} />
              </button>
            </form>
          </div>
        );
      }

      default:
        return <div className="hint">Unknown widget</div>;
    }
  };

  const ThemeIcon = prefs.theme === 'dark' ? SunIcon : MoonIcon;

  return (
    <div className="app-shell" data-theme={prefs.theme} style={{ '--accent': prefs.accent }}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <span className="brand-name">Focus Canvas</span>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Toggle theme"
            onClick={() => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }))}
          >
            <ThemeIcon size={16} />
          </button>
          <button type="button" className="icon-button" aria-label="Customize" onClick={() => setSettingsOpen((open) => !open)}>
            <SlidersIcon size={16} />
          </button>
        </div>
      </header>

      {isMobile ? (
        <div className="widget-stack">
          {visibleWidgets.length === 0 && (
            <div className="empty-card">
              <p>Your canvas is empty.</p>
              <span>Pick a widget from the bar below to get started.</span>
            </div>
          )}
          {visibleWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              mobile
              focused={focusedId === widget.id}
              onFocus={() => setFocusedId(widget.id)}
              onRemove={() => removeWidget(widget.id)}
              onDuplicate={() => duplicateWidget(widget.id)}
              scaleContent={prefs.scaleContent}
              onMobileResizeStart={(event) => startMobileResize(event, widget.id)}
            >
              {renderWidgetBody(widget)}
            </WidgetCard>
          ))}
        </div>
      ) : (
        <div
          className="canvas-viewport"
          ref={viewportRef}
          onPointerDown={startPan}
          style={{
            backgroundImage: prefs.grid
              ? prefs.gridStyle === 'lines'
                ? 'linear-gradient(var(--dot) 1px, transparent 1px), linear-gradient(90deg, var(--dot) 1px, transparent 1px)'
                : 'radial-gradient(circle, var(--dot) 1.3px, transparent 1.3px)'
              : 'none',
            backgroundSize: `${prefs.gridSize * view.scale}px ${prefs.gridSize * view.scale}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
        >
          <div className="board" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
            {visibleWidgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                focused={focusedId === widget.id}
                scaleContent={prefs.scaleContent}
                onFocus={() => setFocusedId(widget.id)}
                onRemove={() => removeWidget(widget.id)}
                onDuplicate={() => duplicateWidget(widget.id)}
                onDragStart={(event) => startDrag(event, widget.id)}
                onResizeStart={(event, corner) => startResize(event, widget.id, corner)}
              >
                {renderWidgetBody(widget)}
              </WidgetCard>
            ))}
          </div>

          {visibleWidgets.length === 0 && (
            <div className="canvas-empty">
              <p>An empty canvas.</p>
              <span>Add a widget from the toolbar below — drag to move, resize from any corner, and pan the board by dragging.</span>
            </div>
          )}

          {prefs.zoomHud && (
            <div className="zoom-hud">
              <button type="button" className="icon-button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.2)}>
                <MinusIcon size={15} />
              </button>
              <span className="zoom-level">{Math.round(view.scale * 100)}%</span>
              <button type="button" className="icon-button" aria-label="Zoom in" onClick={() => zoomBy(1.2)}>
                <PlusIcon size={15} />
              </button>
              <button type="button" className="icon-button" aria-label="Reset view" onClick={resetView}>
                <FitIcon size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      <nav className="toolbar">
        <div className="toolbar-palette">
          {WIDGET_CATALOG.filter((item) => !prefs.hiddenPalette.includes(item.key)).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} type="button" className="palette-item" onClick={() => addWidget(item.key)} title={`Add ${item.label}`}>
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
          {WIDGET_CATALOG.every((item) => prefs.hiddenPalette.includes(item.key)) && (
            <span className="palette-empty">All widgets hidden</span>
          )}
        </div>
        <div className="toolbar-end">
          <button type="button" className="palette-text" onClick={clearCanvas} disabled={visibleWidgets.length === 0}>
            <TrashIcon size={15} />
            <span>Clear</span>
          </button>
        </div>
      </nav>

      <aside className={`settings-panel ${settingsOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>Customize</h3>
          <button type="button" className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">
            <XIcon size={15} />
          </button>
        </div>

        <div className="field">
          <span className="field-label">Appearance</span>
          <div className="segmented">
            {[
              { key: 'dark', label: 'Dark' },
              { key: 'light', label: 'Light' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`seg ${prefs.theme === item.key ? 'active' : ''}`}
                onClick={() => setSettings((current) => ({ ...current, theme: item.key }))}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Accent</span>
          <div className="swatch-row">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch ${prefs.accent.toLowerCase() === color ? 'active' : ''}`}
                style={{ background: color }}
                aria-label={`Accent ${color}`}
                onClick={() => setSettings((current) => ({ ...current, accent: color }))}
              />
            ))}
            <input
              type="color"
              value={prefs.accent}
              onChange={(event) => setSettings((current) => ({ ...current, accent: event.target.value }))}
              aria-label="Custom accent color"
            />
          </div>
        </div>

        <label className="toggle-row">
          <span>Grid</span>
          <input
            type="checkbox"
            checked={prefs.grid}
            onChange={(event) => setSettings((current) => ({ ...current, grid: event.target.checked }))}
          />
        </label>

        <div className="field">
          <span className="field-label">Grid pattern</span>
          <div className="segmented">
            {[
              { key: 'dots', label: 'Dots' },
              { key: 'lines', label: 'Lines' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`seg ${prefs.gridStyle === item.key ? 'active' : ''}`}
                onClick={() => setSettings((current) => ({ ...current, gridStyle: item.key }))}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Grid size</span>
          <div className="segmented">
            {GRID_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className={`seg ${prefs.gridSize === size ? 'active' : ''}`}
                onClick={() => setSettings((current) => ({ ...current, gridSize: size }))}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        <label className="toggle-row">
          <span>Snap to grid</span>
          <input
            type="checkbox"
            checked={prefs.snap}
            onChange={(event) => setSettings((current) => ({ ...current, snap: event.target.checked }))}
          />
        </label>

        <label className="toggle-row">
          <span>Scale widget contents</span>
          <input
            type="checkbox"
            checked={prefs.scaleContent}
            onChange={(event) => setSettings((current) => ({ ...current, scaleContent: event.target.checked }))}
          />
        </label>

        <label className="toggle-row">
          <span>Show zoom controls</span>
          <input
            type="checkbox"
            checked={prefs.zoomHud}
            onChange={(event) => setSettings((current) => ({ ...current, zoomHud: event.target.checked }))}
          />
        </label>

        <div className="field">
          <span className="field-label">Bottom bar widgets</span>
          <div className="palette-toggles">
            {WIDGET_CATALOG.map((item) => {
              const Icon = item.icon;
              return (
                <label className="palette-toggle" key={item.key}>
                  <span className="palette-toggle-name">
                    <Icon size={14} />
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={!prefs.hiddenPalette.includes(item.key)}
                    onChange={() => togglePaletteItem(item.key)}
                    aria-label={`Show ${item.label} in the bottom bar`}
                  />
                </label>
              );
            })}
          </div>
          {prefs.hiddenPalette.length > 0 && (
            <button
              type="button"
              className="text-btn"
              onClick={() => setSettings((current) => ({ ...current, hiddenPalette: [] }))}
            >
              Show all widgets
            </button>
          )}
        </div>

        <div className="panel-divider" />

        <button type="button" className="panel-button" onClick={resetView}>
          <ResetIcon size={15} />
          Reset zoom &amp; position
        </button>
        <button type="button" className="panel-button" onClick={() => setSettings(defaultSettings)}>
          <SlidersIcon size={15} />
          Reset preferences
        </button>
        <button type="button" className="panel-button danger" onClick={clearCanvas} disabled={visibleWidgets.length === 0}>
          <TrashIcon size={15} />
          Clear canvas
        </button>
      </aside>

      <div className={`backdrop ${settingsOpen ? 'open' : ''}`} onClick={() => setSettingsOpen(false)} role="presentation" />
    </div>
  );
}

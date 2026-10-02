import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ICONS,
  ArrowIcon,
  CircleShapeIcon,
  BoardIcon,
  BreathIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  ChartIcon,
  CheckSquareIcon,
  CloudIcon,
  CommandIcon,
  CopyIcon,
  EraserIcon,
  ExpandIcon,
  FitIcon,
  FlashcardIcon,
  HandIcon,
  HeadphonesIcon,
  HighlighterIcon,
  ImageIcon,
  LayersIcon,
  LineIcon,
  LockIcon,
  MinimizeIcon,
  MinusIcon,
  MoonIcon,
  MoveIcon,
  NoteIcon,
  PencilIcon,
  PenIcon,
  RectangleIcon,
  TextToolIcon,
  PlusIcon,
  RainIcon,
  RedoIcon,
  RepeatIcon,
  ResetIcon,
  SlidersIcon,
  SnowIcon,
  SproutIcon,
  StickyIcon,
  StopwatchIcon,
  StormIcon,
  SunIcon,
  TimerIcon,
  TodoistIcon,
  TrashIcon,
  UndoIcon,
  UnlockIcon,
  XIcon,
} from './icons';
import { SelectionOutline, Stroke, TextEditor } from './DrawLayer';
import { constrainPoint, isShapeTool, squarePoint, strokeHit, strokesBounds, strokesToSvg, translateStroke } from './draw';
import { BREAK_SECONDS, DEFAULT_VIEW, KEYS, MAX_ZOOM, MIN_ZOOM, TODOIST_API, defaultSettings } from './constants';
import {
  clamp,
  uid,
  todayKey,
  readState,
  useLocalStorageState,
  formatClock,
  formatStopwatch,
  breathPhase,
  VALID_PROTOCOL,
  normalizeUrl,
  addDays,
  fillNoise,
  SOUND_SECONDS,
} from './lib/utils';
import { todoistList, dayDiff } from './lib/todoist';
import {
  ACCENT_PRESETS,
  CATEGORY_MAP,
  CATALOG_MAP,
  CORNERS,
  DEFAULT_HABITS,
  DEFAULT_LINKS,
  DEFAULT_TASKS,
  DRAW_COLORS,
  DRAW_SIZES,
  DRAW_TOOLS,
  GRID_SIZES,
  QUOTES,
  SOUND_TYPES,
  TEMPLATES,
  WIDGET_CATALOG,
  WIDGET_CATEGORIES,
  WS_COLORS,
  createWidget,
  makeWorkspace,
  seedWorkspaces,
  widgetSize,
} from './data/catalog';
import WidgetCard from './components/WidgetCard';
import renderWidgetBody from './widgets/renderWidgetBody';
/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const viewportRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);

  const [settings, setSettings] = useLocalStorageState(KEYS.settings, defaultSettings);
  const prefs = useMemo(() => ({ ...defaultSettings, ...settings }), [settings]);

  // Workspaces own the canvas (widgets + drawing) so each board stays separate.
  const [workspaces, setWorkspaces] = useLocalStorageState(KEYS.workspaces, seedWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useLocalStorageState(KEYS.activeWorkspace, '');
  const [wsOpen, setWsOpen] = useState(false);
  const [renamingWorkspaceId, setRenamingWorkspaceId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || workspaces[0] || null,
    [workspaces, activeWorkspaceId],
  );
  const activeId = activeWorkspace ? activeWorkspace.id : '';

  const setWidgets = useCallback(
    (updater) =>
      setWorkspaces((current) =>
        current.map((workspace) =>
          workspace.id === activeId
            ? { ...workspace, widgets: typeof updater === 'function' ? updater(workspace.widgets) : updater }
            : workspace,
        ),
      ),
    [activeId, setWorkspaces],
  );

  const setStrokes = useCallback(
    (updater) =>
      setWorkspaces((current) =>
        current.map((workspace) =>
          workspace.id === activeId
            ? { ...workspace, strokes: typeof updater === 'function' ? updater(workspace.strokes) : updater }
            : workspace,
        ),
      ),
    [activeId, setWorkspaces],
  );

  const widgets = activeWorkspace ? activeWorkspace.widgets : [];
  const strokes = activeWorkspace ? activeWorkspace.strokes : [];

  const [notesText, setNotesText] = useLocalStorageState(KEYS.notes, '');
  const [tasks, setTasks] = useLocalStorageState(KEYS.tasks, DEFAULT_TASKS);
  const [habits, setHabits] = useLocalStorageState(KEYS.habits, DEFAULT_HABITS);
  const [water, setWater] = useLocalStorageState(KEYS.water, { glasses: 0, goal: 8 });
  const [links, setLinks] = useLocalStorageState(KEYS.links, DEFAULT_LINKS);
  const [countdown, setCountdown] = useLocalStorageState(KEYS.countdown, {
    label: 'Next milestone',
    target: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const [sound, setSound] = useLocalStorageState(KEYS.sound, { type: 'brown', volume: 0.35 });
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [stats, setStats] = useLocalStorageState(KEYS.stats, { day: todayKey(), sessions: 0, focusMinutes: 0 });
  const [todoistToken, setTodoistToken] = useLocalStorageState(KEYS.todoist, '');
  const [todoist, setTodoist] = useState({ tasks: [], projects: [], completedToday: null, status: 'idle', error: '' });
  const [todoistFilter, setTodoistFilter] = useState('today');
  const [todoistDraft, setTodoistDraft] = useState('');
  const [todoistTokenDraft, setTodoistTokenDraft] = useState('');
  const [todoistEditing, setTodoistEditing] = useState(false);
  const [todoistBusy, setTodoistBusy] = useState(null);
  const [todoistSort, setTodoistSort] = useState('due');
  const [todoistComposer, setTodoistComposer] = useState({ priority: 1, projectId: '', due: '' });

  const [weatherLocation, setWeatherLocation] = useLocalStorageState(KEYS.weather, { place: '', latitude: null, longitude: null });
  const [weather, setWeather] = useState({ status: 'idle', data: null, error: '' });
  const [weatherQuery, setWeatherQuery] = useState('');
  const [weatherEditing, setWeatherEditing] = useState(false);
  const [weatherBusy, setWeatherBusy] = useState(false);
  const [unit, setUnit] = useLocalStorageState(`${KEYS.settings}-unit`, 'c');

  // Widget-local weather unit (falls back to the global preference).
  const unitFor = (widget) => widget.unit || unit;

  const [strokeDraft, setStrokeDraft] = useState(null);
  const [selection, setSelection] = useState([]);
  const [editingText, setEditingText] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [newTask, setNewTask] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [linkDraft, setLinkDraft] = useState({ label: '', url: '' });
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [quoteCopied, setQuoteCopied] = useState(false);

  const [timer, setTimer] = useState({ running: false, remaining: 25 * 60, preset: 25 * 60, mode: 'focus', endAt: 0 });
  const [stopwatch, setStopwatch] = useState({ running: false, elapsed: 0, startedAt: 0, base: 0, laps: [] });
  const [pandora, setPandora] = useState({
    running: false,
    phase: 'focus',
    remaining: 20 * 60,
    endAt: 0,
    focus: 20 * 60,
    breakLen: 5 * 60,
    longBreak: 15 * 60,
    rounds: 4,
    completed: 0,
  });

  // Length of the phase that is about to start — a long break lands every
  // `rounds` completed focus sessions.
  const pandoraLengthFor = useCallback(
    (state, phase) =>
      phase === 'focus'
        ? state.focus
        : state.rounds > 0 && state.completed > 0 && state.completed % state.rounds === 0
          ? state.longBreak
          : state.breakLen,
    [],
  );

  // Move the interval timer to its next focus/break phase.
  const advancePandora = useCallback((current, autoStart) => {
    const start = (phase, length, extra) => ({
      ...current,
      phase,
      remaining: length,
      running: autoStart,
      endAt: autoStart ? Date.now() + length * 1000 : 0,
      ...extra,
    });
    if (current.phase === 'focus') {
      const completed = current.completed + 1;
      const isLong = current.rounds > 0 && completed % current.rounds === 0;
      return start('break', isLong ? current.longBreak : current.breakLen, { completed });
    }
    return start('focus', current.focus, {});
  }, []);
  const [breath, setBreath] = useState({ running: false, startedAt: 0 });
  const [pickerState, setPickerState] = useState({});

  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState(DEFAULT_VIEW);
  const [focusedId, setFocusedId] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [guides, setGuides] = useState([]);
  const [fullscreenId, setFullscreenId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 820,
  );
  const [openCategory, setOpenCategory] = useState(null);

  // App-style confirmations: a small strip with an optional Undo action.
  const toastIdRef = useRef(0);
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message, action) => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((current) => [...current.slice(-2), { id, message, action }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, action ? 8000 : 3200);
  }, []);

  // A quiet autosave pulse so it is obvious the board is being stored.
  const [savePulse, setSavePulse] = useState(false);
  const firstSaveRef = useRef(true);
  useEffect(() => {
    if (firstSaveRef.current) {
      firstSaveRef.current = false;
      return undefined;
    }
    setSavePulse(true);
    const timer = window.setTimeout(() => setSavePulse(false), 1400);
    return () => window.clearTimeout(timer);
  }, [workspaces, settings]);

  const audioRef = useRef({ ctx: null, gain: null, source: null, filter: null });
  const volumeRef = useRef(sound.volume);

  // A short two-note chime, reusing the ambient audio graph.
  const playChime = useCallback(
    (kind) => {
      if (!prefs.chime) return;
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
      const ctx = audio.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const notes = kind === 'break' ? [659, 523] : [784, 1047];
      const start = ctx.currentTime + 0.02;
      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        const at = start + index * 0.2;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.26, at + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.45);
      });
    },
    [prefs.chime],
  );

  /* --- responsive --- */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* --- master tick (timers derive from timestamps so background tabs stay accurate) --- */
  useEffect(() => {
    const tick = () => {
      const stamp = Date.now();
      setNow(stamp);
      setTimer((current) => {
        if (!current.running || !current.endAt) return current;
        const remaining = Math.max(0, Math.ceil((current.endAt - stamp) / 1000));
        return remaining === current.remaining ? current : { ...current, remaining };
      });
      setPandora((current) => {
        if (!current.running || !current.endAt) return current;
        const remaining = Math.max(0, Math.ceil((current.endAt - stamp) / 1000));
        return remaining === current.remaining ? current : { ...current, remaining };
      });
      setStopwatch((current) => {
        if (!current.running || !current.startedAt) return current;
        const elapsed = Math.floor((stamp - current.startedAt) / 1000) + current.base;
        return elapsed === current.elapsed ? current : { ...current, elapsed };
      });
    };
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!timer.running || timer.remaining > 0) return;
    playChime(timer.mode);
    if (timer.mode === 'focus') {
      setStats((current) => ({
        day: todayKey(),
        sessions: (current.day === todayKey() ? current.sessions : 0) + 1,
        focusMinutes: (current.day === todayKey() ? current.focusMinutes : 0) + Math.round(timer.preset / 60),
      }));
    }
    if (prefs.autoNext) {
      const nextMode = timer.mode === 'focus' ? 'break' : 'focus';
      const nextRemaining = nextMode === 'break' ? BREAK_SECONDS : timer.preset;
      setTimer({
        running: true,
        remaining: nextRemaining,
        preset: timer.preset,
        mode: nextMode,
        endAt: Date.now() + nextRemaining * 1000,
      });
    } else {
      setTimer((current) => ({ ...current, running: false, endAt: 0 }));
    }
  }, [timer, prefs.autoNext, playChime, setStats]);

  // Interval timer: chime at each phase end, count focus sessions, and roll
  // straight into the next focus/break phase (auto-starting when enabled).
  useEffect(() => {
    if (!pandora.running || pandora.remaining > 0) return;
    playChime(pandora.phase === 'focus' ? 'break' : 'focus');
    if (pandora.phase === 'focus') {
      setStats((current) => ({
        day: todayKey(),
        sessions: (current.day === todayKey() ? current.sessions : 0) + 1,
        focusMinutes: (current.day === todayKey() ? current.focusMinutes : 0) + Math.round(pandora.focus / 60),
      }));
    }
    setPandora((current) => advancePandora(current, prefs.autoNext));
  }, [pandora, prefs.autoNext, playChime, setStats, advancePandora]);

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
    if (!audio.source || !audio.ctx) return;
    const source = audio.source;
    audio.source = null;
    const now = audio.ctx.currentTime;
    try {
      audio.gain.gain.cancelScheduledValues(now);
      audio.gain.gain.setValueAtTime(audio.gain.gain.value, now);
      audio.gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    } catch {
      /* ignore */
    }
    try {
      source.stop(now + 0.45);
    } catch {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    // Let the fade finish before tearing the node down.
    setTimeout(() => {
      try {
        source.disconnect();
      } catch {
        /* ignore */
      }
    }, 600);
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
    const length = Math.floor(ctx.sampleRate * SOUND_SECONDS);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    fillNoise(buffer.getChannelData(0), type, ctx.sampleRate);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const preset = SOUND_TYPES.find((item) => item.key === type) || SOUND_TYPES[0];
    audio.filter.frequency.setValueAtTime(preset.cutoff, ctx.currentTime);
    audio.filter.Q.value = 0.6;
    // Ease the ambience in so it never clicks on.
    audio.gain.gain.cancelScheduledValues(ctx.currentTime);
    audio.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    audio.gain.gain.linearRampToValueAtTime(volumeRef.current, ctx.currentTime + 0.9);
    source.connect(audio.filter);
    source.start();
    audio.source = source;
  }, [stopSound]);

  useEffect(() => {
    if (soundPlaying) startSound(sound.type);
    else stopSound();
    return () => stopSound();
  }, [soundPlaying, sound.type, startSound, stopSound]);

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

  // Today's completed tasks, for the Today widget. The endpoint is newer, so a
  // failure here (or an older token) never blocks the rest of the sync.
  const completedTodayParams = () => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const until = new Date();
    until.setHours(23, 59, 59, 999);
    return `since=${since.toISOString()}&until=${until.toISOString()}&limit=200`;
  };

  const countCompleted = (data) => {
    const list = Array.isArray(data) ? data : data?.results || data?.items || [];
    return list.length;
  };

  const loadTodoist = useCallback(async () => {
    if (!todoistToken) {
      setTodoist({ tasks: [], projects: [], completedToday: null, status: 'idle', error: '' });
      return;
    }
    setTodoist((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const [tasksData, projectsData, completedData] = await Promise.all([
        todoistFetch('/tasks'),
        todoistFetch('/projects'),
        todoistFetch(`/tasks/completed/by_completion_date?${completedTodayParams()}`).catch(() => null),
      ]);
      setTodoist({
        tasks: todoistList(tasksData),
        projects: todoistList(projectsData),
        completedToday: completedData ? countCompleted(completedData) : null,
        status: 'ready',
        error: '',
      });
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
    const prio = (task) => task.priority || 1;
    // Tasks without a date sort last rather than counting as "today".
    const dueKey = (task) => {
      const diff = diffOf(task);
      return diff === null ? Number.POSITIVE_INFINITY : diff;
    };
    const projName = (id) => todoist.projects.find((project) => project.id === id)?.name || '';

    let list = tasks;
    if (todoistFilter === 'today') {
      list = tasks.filter((task) => {
        const diff = diffOf(task);
        return diff !== null && diff <= 0;
      });
    } else if (todoistFilter === 'upcoming') {
      list = tasks.filter((task) => {
        const diff = diffOf(task);
        return diff !== null && diff > 0 && diff <= 7;
      });
    } else if (todoistFilter === 'priority') {
      list = tasks.filter((task) => prio(task) >= 3);
    }

    const sorted = [...list];
    if (todoistSort === 'priority') {
      sorted.sort((a, b) => prio(b) - prio(a) || dueKey(a) - dueKey(b));
    } else if (todoistSort === 'name') {
      sorted.sort((a, b) => a.content.localeCompare(b.content));
    } else if (todoistSort === 'project') {
      sorted.sort((a, b) => projName(a.project_id).localeCompare(projName(b.project_id)) || dueKey(a) - dueKey(b));
    } else {
      sorted.sort((a, b) => dueKey(a) - dueKey(b) || prio(b) - prio(a));
    }
    return sorted;
  }, [todoist.tasks, todoist.projects, todoistFilter, todoistSort]);

  const completeTodoistTask = useCallback(
    async (task) => {
      setTodoistBusy(task.id);
      try {
        await todoistFetch(`/tasks/${task.id}/close`, { method: 'POST' });
        setTodoist((current) => ({
          ...current,
          tasks: current.tasks.filter((item) => item.id !== task.id),
          completedToday: current.completedToday != null ? current.completedToday + 1 : current.completedToday,
          error: '',
        }));
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
    const payload = { content };
    if (todoistComposer.priority > 1) payload.priority = todoistComposer.priority;
    if (todoistComposer.projectId) payload.project_id = todoistComposer.projectId;
    if (todoistComposer.due) payload.due_date = todoistComposer.due;
    try {
      const created = await todoistFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      if (created && created.id) setTodoist((current) => ({ ...current, tasks: [created, ...current.tasks], error: '' }));
      setTodoistDraft('');
      setTodoistComposer((current) => ({ ...current, due: '' }));
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
  /*  Weather (Open-Meteo)                                              */
  /* ------------------------------------------------------------------ */

  const hasWeatherLocation = weatherLocation.latitude != null && weatherLocation.longitude != null;

  const loadWeather = useCallback(async () => {
    if (weatherLocation.latitude == null || weatherLocation.longitude == null) {
      setWeather({ status: 'idle', data: null, error: '' });
      return;
    }
    setWeather((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${weatherLocation.latitude}&longitude=${weatherLocation.longitude}` +
        '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Forecast service is unavailable right now.');
      const data = await response.json();
      setWeather({ status: 'ready', data, error: '' });
    } catch (error) {
      const message =
        error instanceof TypeError ? 'Network error — check your connection.' : error.message || 'Could not load the forecast.';
      setWeather((current) => ({ ...current, status: 'error', error: message }));
    }
  }, [weatherLocation.latitude, weatherLocation.longitude]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const searchWeatherCity = async (event) => {
    event.preventDefault();
    const query = weatherQuery.trim();
    if (!query) return;
    setWeatherBusy(true);
    setWeather((current) => ({ ...current, error: '' }));
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
      );
      if (!response.ok) throw new Error('City lookup failed.');
      const data = await response.json();
      const match = data?.results?.[0];
      if (!match) {
        setWeather((current) => ({ ...current, error: 'No city found with that name.' }));
        return;
      }
      setWeatherLocation({
        place: [match.name, match.country_code].filter(Boolean).join(', '),
        latitude: match.latitude,
        longitude: match.longitude,
      });
      setWeatherQuery('');
      setWeatherEditing(false);
    } catch (error) {
      const message =
        error instanceof TypeError ? 'Network error — check your connection.' : error.message || 'City lookup failed.';
      setWeather((current) => ({ ...current, error: message }));
    } finally {
      setWeatherBusy(false);
    }
  };

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setWeather((current) => ({ ...current, error: 'Location is not available in this browser.' }));
      return;
    }
    setWeatherBusy(true);
    setWeather((current) => ({ ...current, error: '' }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setWeatherLocation({
          place: 'My location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setWeatherBusy(false);
        setWeatherEditing(false);
      },
      () => {
        setWeather((current) => ({ ...current, error: 'Could not read your location.' }));
        setWeatherBusy(false);
      },
    );
  };

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
      const target = event.target;
      const zooming = event.ctrlKey || event.metaKey;
      // Let text areas and scrollable widget lists scroll themselves.
      if (!zooming && target instanceof Element && target.closest('.scrollable, textarea')) return;
      event.preventDefault();
      // Pinch or Ctrl/Cmd + wheel zooms around the pointer…
      if (zooming) {
        zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY);
        return;
      }
      // …while a plain two-finger scroll pans the board, so you can move and
      // zoom the canvas at the same time.
      setView((current) => ({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY }));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [isMobile, zoomAt]);

  /* --- two-finger pinch to zoom (tablets and touch screens) --- */
  useEffect(() => {
    const element = viewportRef.current;
    if (!element || isMobile) return undefined;
    const pointers = pointersRef.current;

    const distanceBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse') return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const [a, b] = pointers.values();
        pinchRef.current = { distance: distanceBetween(a, b), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      }
    };

    const onPointerMove = (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size < 2 || !pinchRef.current) return;
      const [a, b] = pointers.values();
      const nextDistance = distanceBetween(a, b);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const previous = pinchRef.current;
      if (previous.distance > 0 && nextDistance > 0) {
        zoomAt(nextDistance / previous.distance, cx, cy);
      }
      // Two fingers also drag the board, so zooming and moving happen together.
      const dx = cx - previous.cx;
      const dy = cy - previous.cy;
      if (dx || dy) setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
      pinchRef.current = { distance: nextDistance, cx, cy };
    };

    const release = (event) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchRef.current = null;
    };

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', release);
      element.removeEventListener('pointercancel', release);
      pointers.clear();
      pinchRef.current = null;
    };
  }, [isMobile, zoomAt]);

  /* --- clicking outside any widget clears the selection --- */
  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.widget')) return;
      setFocusedId(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  /* --- keep the active workspace pointing at a real workspace --- */
  useEffect(() => {
    if (!workspaces.length) {
      setWorkspaces([makeWorkspace('Home', '#0070f3')]);
      return;
    }
    if (!workspaces.some((workspace) => workspace.id === activeWorkspaceId)) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspaceId, setWorkspaces]);

  /* --- close the workspace menu on an outside click --- */
  useEffect(() => {
    if (!wsOpen) return undefined;
    const onPointerDown = (event) => {
      if (event.target instanceof Element && event.target.closest('.ws-switcher')) return;
      setWsOpen(false);
      setRenamingWorkspaceId(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [wsOpen]);

  /* --- close a category drop-up on an outside click or Escape --- */
  useEffect(() => {
    if (!openCategory) return undefined;
    const onPointerDown = (event) => {
      if (event.target instanceof Element && event.target.closest('.palette-group')) return;
      setOpenCategory(null);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpenCategory(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openCategory]);

  // Losing the bar (whiteboard, collapsed) should not leave a menu hanging.
  useEffect(() => {
    if (prefs.whiteboard || !prefs.barOpen) setOpenCategory(null);
  }, [prefs.whiteboard, prefs.barOpen]);

  const startPan = (event) => {
    const target = event.target;
    const onBoard = target === viewportRef.current || (target instanceof Element && target.classList.contains('board'));
    if (!onBoard) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...view };

    const move = (moveEvent) => {
      // While two fingers are down the gesture is a pinch, not a pan.
      if (pointersRef.current.size >= 2) return;
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
  /*  Drawing & whiteboard                                              */
  /* ------------------------------------------------------------------ */

  const boardPoint = useCallback(
    (clientX, clientY) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return { x: (clientX - rect.left - view.x) / view.scale, y: (clientY - rect.top - view.y) / view.scale };
    },
    [view],
  );

  const pushPast = useCallback((snapshot) => {
    setPast((previous) => [...previous.slice(-59), snapshot]);
    setFuture([]);
  }, []);

  /* --- select & move --- */

  const moveSelection = useCallback(
    (event, selectedIds) => {
      const start = boardPoint(event.clientX, event.clientY);
      if (!start) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      const snapshot = strokes;
      let moved = false;
      let last = start;
      const move = (moveEvent) => {
        const point = boardPoint(moveEvent.clientX, moveEvent.clientY);
        if (!point) return;
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        if (!moved && Math.hypot(point.x - start.x, point.y - start.y) < 2) return;
        moved = true;
        last = point;
        setStrokes((current) =>
          current.map((stroke) => (selectedIds.includes(stroke.id) ? translateStroke(stroke, dx, dy) : stroke)),
        );
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (moved) pushPast(snapshot);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },
    [boardPoint, strokes, setStrokes, pushPast],
  );

  const addTextStroke = useCallback(
    (anchor) => {
      const stroke = {
        id: uid('stroke'),
        tool: 'text',
        color: prefs.drawColor,
        size: Math.max(14, prefs.drawSize * 6),
        points: [anchor],
        text: '',
      };
      pushPast(strokes);
      setStrokes((current) => [...current, stroke]);
      setEditingText(stroke.id);
    },
    [prefs.drawColor, prefs.drawSize, strokes, setStrokes, pushPast],
  );

  const startDraw = useCallback(
    (event) => {
      const target = event.target;
      const onBoard =
        target === viewportRef.current ||
        (target instanceof Element && (target.classList.contains('board') || target.classList.contains('draw-layer')));
      if (!onBoard) return false;
      if (event.pointerType === 'mouse' && event.button !== 0) return false;
      if (pointersRef.current.size >= 2) return false;
      const origin = boardPoint(event.clientX, event.clientY);
      if (!origin) return false;
      if (event.button === 1 || prefs.drawTool === 'pan') return false;
      event.preventDefault();

      const tool = event.altKey ? 'eraser' : prefs.drawTool;
      const color = prefs.drawColor;
      const size = prefs.drawSize;

      if (tool === 'select') {
        const hit = [...strokes].reverse().find((stroke) => strokeHit(stroke, origin, size * 2 + 6));
        if (!hit) {
          setSelection([]);
          return false;
        }
        setSelection([hit.id]);
        moveSelection(event, [hit.id]);
        return true;
      }

      if (tool === 'text') {
        addTextStroke(origin);
        return true;
      }

      if (tool === 'eraser') {
        const snapshot = strokes;
        let working = strokes;
        const eraseAt = (point) => {
          const radius = size * 2 + 8;
          working = working.filter((stroke) => !strokeHit(stroke, point, radius));
        };
        eraseAt(origin);
        setStrokes(working);
        let aborted = false;
        const move = (moveEvent) => {
          if (pointersRef.current.size >= 2) {
            aborted = true;
            return;
          }
          const point = boardPoint(moveEvent.clientX, moveEvent.clientY);
          if (!point) return;
          eraseAt(point);
          setStrokes(working);
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          if (aborted) setStrokes(snapshot);
          else if (working.length !== snapshot.length) pushPast(snapshot);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        return true;
      }

      const draft = { id: uid('stroke'), tool, color, size, fill: prefs.drawFill, points: [origin, origin] };
      setStrokeDraft(draft);
      let aborted = false;
      const move = (moveEvent) => {
        if (pointersRef.current.size >= 2) {
          aborted = true;
          return;
        }
        let point = boardPoint(moveEvent.clientX, moveEvent.clientY);
        if (!point) return;
        if (isShapeTool(tool)) {
          // Shift snaps lines to 45° and shapes to a square.
          if (moveEvent.shiftKey) {
            point =
              tool === 'rect' || tool === 'ellipse' ? squarePoint(origin, point) : constrainPoint(origin, point);
          }
          setStrokeDraft({ ...draft, points: [origin, point] });
          return;
        }
        const last = draft.points[draft.points.length - 1];
        if (Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
        draft.points = [...draft.points, point];
        setStrokeDraft({ ...draft });
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        setStrokeDraft(null);
        if (aborted) return;
        if (isShapeTool(tool)) {
          const [start, end] = draft.points;
          if (Math.hypot(end.x - start.x, end.y - start.y) < 4) return;
        } else if (draft.points.length < 2) {
          return;
        }
        pushPast(strokes);
        setStrokes((current) => [...current, draft]);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      return true;
    },
    [
      boardPoint,
      prefs.drawTool,
      prefs.drawColor,
      prefs.drawSize,
      prefs.drawFill,
      strokes,
      setStrokes,
      pushPast,
      moveSelection,
      addTextStroke,
    ],
  );

  const onViewportPointerDown = (event) => {
    // Clicking away from the text tool finishes what is being typed.
    if (editingText) {
      commitText(editingText, strokes.find((stroke) => stroke.id === editingText)?.text || '');
      return;
    }
    if (prefs.drawMode && !isMobile && prefs.drawTool !== 'pan' && startDraw(event)) return;
    startPan(event);
  };

  const undoDraw = useCallback(() => {
    if (!past.length) return;
    setFuture([strokes, ...future]);
    setStrokes(past[past.length - 1]);
    setPast(past.slice(0, -1));
  }, [past, future, strokes, setStrokes]);

  const redoDraw = useCallback(() => {
    if (!future.length) return;
    setPast([...past, strokes]);
    setStrokes(future[0]);
    setFuture(future.slice(1));
  }, [past, future, strokes, setStrokes]);

  const clearDrawing = useCallback(() => {
    if (!strokes.length) return;
    pushPast(strokes);
    setStrokes([]);
    setSelection([]);
  }, [strokes, pushPast, setStrokes]);

  const deleteSelection = useCallback(() => {
    if (!selection.length) return;
    pushPast(strokes);
    setStrokes((current) => current.filter((stroke) => !selection.includes(stroke.id)));
    setSelection([]);
  }, [selection, strokes, pushPast, setStrokes]);

  const duplicateSelection = useCallback(() => {
    if (!selection.length) return;
    pushPast(strokes);
    const copies = strokes
      .filter((stroke) => selection.includes(stroke.id))
      .map((stroke) => translateStroke({ ...stroke, id: uid('stroke') }, 24, 24));
    setStrokes((current) => [...current, ...copies]);
    setSelection(copies.map((stroke) => stroke.id));
  }, [selection, strokes, pushPast, setStrokes]);

  const commitText = useCallback(
    (id, value) => {
      const text = value.replace(/\s+$/, '');
      setStrokes((current) =>
        text
          ? current.map((stroke) => (stroke.id === id ? { ...stroke, text } : stroke))
          : current.filter((stroke) => stroke.id !== id),
      );
      setEditingText(null);
    },
    [setStrokes],
  );

  const downloadBlob = useCallback((blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportDrawing = useCallback(() => {
    if (!strokes.length) return;
    const pad = 48;
    const box = strokesBounds(strokes, pad);
    if (!box) return;
    const background = prefs.theme === 'dark' && !prefs.whiteboard ? '#000000' : '#ffffff';
    const svg = strokesToSvg(strokes, { background, pad });
    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(box.width * scale);
      canvas.height = Math.ceil(box.height * scale);
      const context = canvas.getContext('2d');
      context.scale(scale, scale);
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        downloadBlob(blob, `focus-canvas-${todayKey()}.png`);
      });
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [strokes, prefs.theme, prefs.whiteboard, downloadBlob]);

  const exportDrawingSvg = useCallback(() => {
    if (!strokes.length) return;
    const background = prefs.theme === 'dark' && !prefs.whiteboard ? '#000000' : '#ffffff';
    const svg = strokesToSvg(strokes, { background, pad: 48 });
    if (!svg) return;
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `focus-canvas-${todayKey()}.svg`);
  }, [strokes, prefs.theme, prefs.whiteboard, downloadBlob]);

  const copyDrawing = useCallback(async () => {
    if (!strokes.length) return;
    const background = prefs.theme === 'dark' && !prefs.whiteboard ? '#000000' : '#ffffff';
    const svg = strokesToSvg(strokes, { background, pad: 48 });
    if (!svg) return;
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/svg+xml': blob })]);
      } else {
        await navigator.clipboard.writeText(svg);
      }
      pushToast('Drawing copied to the clipboard');
    } catch {
      pushToast('Copying is blocked in this browser');
    }
  }, [strokes, prefs.theme, prefs.whiteboard, pushToast]);

  const selectAllStrokes = useCallback(() => setSelection(strokes.map((stroke) => stroke.id)), [strokes]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (!prefs.drawMode) return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redoDraw();
        else undoDraw();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // Single-key tool switching, like a real drawing app.
      const shortcut = DRAW_TOOLS.find((item) => item.shortcut === key);
      if (shortcut) {
        event.preventDefault();
        setSettings((current) => ({ ...current, drawTool: shortcut.key }));
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [prefs.drawMode, undoDraw, redoDraw, deleteSelection, setSettings]);

  /* ------------------------------------------------------------------ */
  /*  Widget mutations                                                  */
  /* ------------------------------------------------------------------ */

  const visibleWidgets = useMemo(() => widgets.filter((widget) => widget.visible), [widgets]);

  // Whiteboard mode clears the widgets off the board, leaving a clean surface to draw on.
  const shownWidgets = useMemo(
    () => (prefs.drawMode && prefs.whiteboard ? [] : visibleWidgets),
    [prefs.drawMode, prefs.whiteboard, visibleWidgets],
  );

  const addWidget = useCallback((type) => {
    const size = widgetSize(type);
    const rect = viewportRef.current?.getBoundingClientRect();
    const vw = rect?.width ?? 900;
    const vh = rect?.height ?? 640;
    const duplicates = widgets.filter((widget) => widget.type === type).length;
    const boardX = (vw / 2 - view.x) / view.scale - size.w / 2 + duplicates * 28;
    const boardY = (vh / 2 - view.y) / view.scale - size.h / 2 + duplicates * 28;
    setWidgets((current) => [...current, createWidget(type, { x: boardX, y: boardY })]);
  }, [setWidgets, view, widgets]);

  const removeWidget = useCallback(
    (id) => {
      const index = widgets.findIndex((widget) => widget.id === id);
      const removed = index >= 0 ? widgets[index] : null;
      setWidgets((current) => current.filter((widget) => widget.id !== id));
      if (removed) {
        pushToast(`Removed ${removed.title}`, {
          label: 'Undo',
          run: () =>
            setWidgets((current) => {
              if (current.some((widget) => widget.id === removed.id)) return current;
              const next = [...current];
              next.splice(Math.min(index, next.length), 0, removed);
              return next;
            }),
        });
      }
    },
    [widgets, setWidgets, pushToast],
  );

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

  const toggleLock = useCallback((id) => {
    setWidgets((current) => current.map((widget) => (widget.id === id ? { ...widget, locked: !widget.locked } : widget)));
  }, [setWidgets]);

  const startDrag = useCallback((event, widgetId) => {
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget || widget.locked) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = widget.x;
    const originY = widget.y;
    const scale = view.scale;
    const snap = prefs.snap;
    const step = prefs.gridSize;
    const guideSnap = prefs.snapGuides;
    const THRESHOLD = 7 / scale;

    // Alignment targets from every other widget's edges and centers.
    const others = widgets.filter((item) => item.id !== widgetId && item.visible);
    const xLines = [];
    const yLines = [];
    others.forEach((item) => {
      xLines.push(item.x, item.x + item.w / 2, item.x + item.w);
      yLines.push(item.y, item.y + item.h / 2, item.y + item.h);
    });
    const edgeXs = (x) => [x, x + widget.w / 2, x + widget.w];
    const edgeYs = (y) => [y, y + widget.h / 2, y + widget.h];

    const move = (moveEvent) => {
      let nextX = originX + (moveEvent.clientX - startX) / scale;
      let nextY = originY + (moveEvent.clientY - startY) / scale;
      if (snap) {
        nextX = Math.round(nextX / step) * step;
        nextY = Math.round(nextY / step) * step;
      }
      const nextGuides = [];
      if (guideSnap) {
        // Snap this widget's nearest edge/centre to the closest alignment line.
        const snapAxis = (value, lines, edges) => {
          let best = null;
          edges(value).forEach((edge) => {
            lines.forEach((line) => {
              const delta = line - edge;
              if (Math.abs(delta) <= THRESHOLD && (!best || Math.abs(delta) < Math.abs(best.delta))) {
                best = { delta, line };
              }
            });
          });
          return best;
        };
        const gx = snapAxis(nextX, xLines, edgeXs);
        if (gx) {
          nextX += gx.delta;
          nextGuides.push({ axis: 'x', pos: gx.line });
        }
        const gy = snapAxis(nextY, yLines, edgeYs);
        if (gy) {
          nextY += gy.delta;
          nextGuides.push({ axis: 'y', pos: gy.line });
        }
      }
      setGuides(nextGuides);
      updateWidget(widgetId, { x: nextX, y: nextY });
    };
    const up = () => {
      setGuides([]);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [widgets, view.scale, updateWidget, prefs.snap, prefs.gridSize, prefs.snapGuides]);

  const startResize = useCallback((event, widgetId, corner) => {
    event.stopPropagation();
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget || widget.locked) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { x: widget.x, y: widget.y, w: widget.w, h: widget.h };
    const scale = view.scale;
    const snap = prefs.snap;
    const step = prefs.gridSize;
    const MIN_W = 180;
    const MIN_H = 120;
    const MAX_W = 1000;
    const MAX_H = 800;

    const move = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      let { x, y, w, h } = origin;
      if (corner.includes('e')) w = origin.w + dx;
      if (corner.includes('s')) h = origin.h + dy;
      if (corner.includes('w')) w = origin.w - dx;
      if (corner.includes('n')) h = origin.h - dy;
      if (snap) {
        w = Math.round(w / step) * step;
        h = Math.round(h / step) * step;
      }
      w = clamp(w, MIN_W, MAX_W);
      h = clamp(h, MIN_H, MAX_H);
      if (corner.includes('w')) x = origin.x + origin.w - w;
      if (corner.includes('n')) y = origin.y + origin.h - h;
      updateWidget(widgetId, { x, y, w, h });
      setResizing({ id: widgetId, w, h });
    };
    setResizing({ id: widgetId, w: origin.w, h: origin.h });
    const up = () => {
      setResizing(null);
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
    if (!widget || widget.locked) return;
    const section = event.currentTarget.closest('.widget');
    const startY = event.clientY;
    const startH = section ? section.getBoundingClientRect().height : widget.mh || 240;

    const move = (moveEvent) => {
      const next = clamp(Math.round(startH + (moveEvent.clientY - startY)), 160, 1600);
      updateWidget(widgetId, { mh: next });
      setResizing({ id: widgetId, w: null, h: next });
    };
    setResizing({ id: widgetId, w: null, h: Math.round(startH) });
    const up = () => {
      setResizing(null);
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

  const clearCanvas = () => {
    if (!widgets.length) return;
    const snapshot = widgets;
    setWidgets([]);
    pushToast(`Cleared ${snapshot.length} widget${snapshot.length === 1 ? '' : 's'}`, {
      label: 'Undo',
      run: () => setWidgets(snapshot),
    });
  };

  const togglePaletteItem = (key) => {
    setSettings((current) => {
      const hidden = current.hiddenPalette ?? [];
      return {
        ...current,
        hiddenPalette: hidden.includes(key) ? hidden.filter((item) => item !== key) : [...hidden, key],
      };
    });
  };

  /* --- workspaces --- */

  const switchWorkspace = useCallback(
    (id) => {
      setActiveWorkspaceId(id);
      setFocusedId(null);
      setRenamingWorkspaceId(null);
      setWsOpen(false);
      // Drawing history belongs to the workspace we just left.
      setPast([]);
      setFuture([]);
    },
    [setActiveWorkspaceId],
  );

  const addWorkspace = useCallback(() => {
    const workspace = makeWorkspace(
      `Workspace ${workspaces.length + 1}`,
      WS_COLORS[workspaces.length % WS_COLORS.length],
    );
    setWorkspaces((current) => [...current, workspace]);
    setActiveWorkspaceId(workspace.id);
    setFocusedId(null);
    setRenamingWorkspaceId(null);
    setWsOpen(false);
    setPast([]);
    setFuture([]);
  }, [workspaces.length, setWorkspaces, setActiveWorkspaceId]);

  const renameWorkspace = useCallback(
    (id, name) => {
      const trimmed = (name || '').trim();
      if (trimmed) {
        setWorkspaces((current) =>
          current.map((workspace) => (workspace.id === id ? { ...workspace, name: trimmed } : workspace)),
        );
      }
      setRenamingWorkspaceId(null);
    },
    [setWorkspaces],
  );

  const setWorkspaceColor = useCallback(
    (id, color) =>
      setWorkspaces((current) =>
        current.map((workspace) => (workspace.id === id ? { ...workspace, color } : workspace)),
      ),
    [setWorkspaces],
  );

  const deleteWorkspace = useCallback(
    (id) => {
      if (workspaces.length <= 1) return;
      const next = workspaces.filter((workspace) => workspace.id !== id);
      setWorkspaces(next);
      if (id === activeId) setActiveWorkspaceId(next[0].id);
      setFocusedId(null);
      setRenamingWorkspaceId(null);
    },
    [workspaces, activeId, setWorkspaces, setActiveWorkspaceId],
  );

  /* --- timers --- */

  const toggleTimer = () => {
    setTimer((current) => {
      if (current.running) {
        const remaining = current.endAt ? Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000)) : current.remaining;
        return { ...current, running: false, remaining, endAt: 0 };
      }
      const remaining = current.remaining > 0 ? current.remaining : current.mode === 'break' ? BREAK_SECONDS : current.preset;
      return { ...current, running: true, remaining, endAt: Date.now() + remaining * 1000 };
    });
  };

  const resetTimer = () => {
    setTimer((current) => ({
      ...current,
      running: false,
      endAt: 0,
      remaining: current.mode === 'break' ? BREAK_SECONDS : current.preset,
    }));
  };

  const switchTimerMode = (mode) => {
    setTimer((current) => ({
      ...current,
      mode,
      running: false,
      endAt: 0,
      remaining: mode === 'break' ? BREAK_SECONDS : current.preset,
    }));
  };

  const toggleStopwatch = () => {
    setStopwatch((current) => {
      if (current.running) {
        const elapsed = current.startedAt
          ? Math.floor((Date.now() - current.startedAt) / 1000) + current.base
          : current.elapsed;
        return { ...current, running: false, elapsed, startedAt: 0, base: 0 };
      }
      return { ...current, running: true, elapsed: current.elapsed, startedAt: Date.now(), base: current.elapsed };
    });
  };

  const resetStopwatch = () => setStopwatch({ running: false, elapsed: 0, startedAt: 0, base: 0, laps: [] });

  const addLap = () =>
    setStopwatch((current) => {
      if (!current.running || current.elapsed === 0) return current;
      return { ...current, laps: [current.elapsed, ...(current.laps || [])].slice(0, 8) };
    });

  const togglePandora = () => {
    setPandora((current) => {
      if (current.running) {
        const remaining = current.endAt ? Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000)) : current.remaining;
        return { ...current, running: false, remaining, endAt: 0 };
      }
      const remaining = current.remaining > 0 ? current.remaining : pandoraLengthFor(current, current.phase);
      return { ...current, running: true, remaining, endAt: Date.now() + remaining * 1000 };
    });
  };

  const resetPandora = () =>
    setPandora((current) => ({ ...current, running: false, endAt: 0, phase: 'focus', completed: 0, remaining: current.focus }));

  const skipPandora = () => setPandora((current) => advancePandora(current, current.running));

  /* --- picker --- */

  const pickRandom = (widget) => {
    const names = (widget.names || '')
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean);
    if (!names.length) return;
    setPickerState((current) => {
      const previous = current[widget.id] || { used: [], current: '' };
      let pool = names.filter((name) => !previous.used.includes(name));
      let used = previous.used;
      if (pool.length === 0) {
        pool = names;
        used = [];
      }
      const choice = pool[Math.floor(Math.random() * pool.length)];
      return { ...current, [widget.id]: { used: [...used, choice], current: choice } };
    });
  };

  const resetPicker = (widget) =>
    setPickerState((current) => ({ ...current, [widget.id]: { used: [], current: '' } }));

  /* --- quote & flashcards --- */

  const copyQuote = async (quote) => {
    try {
      await navigator.clipboard.writeText(`“${quote.text}” — ${quote.author}`);
      setQuoteCopied(true);
      setTimeout(() => setQuoteCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const shuffleDeck = (widget, count) => {
    const order = Array.from({ length: count }, (_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    updateWidget(widget.id, { order, cardIndex: 0, flipped: false });
  };

  /* --- templates & navigation --- */

  const applyTemplate = useCallback(
    (template) => {
      setWidgets(
        template.items.map(([type, x, y]) => {
          const meta = CATALOG_MAP[type];
          return createWidget(type, { x, y, w: meta ? meta.w : 260, h: meta ? meta.h : 200 });
        }),
      );
      setView(DEFAULT_VIEW);
      setPaletteOpen(false);
      setSettingsOpen(false);
      if (template.items.length) pushToast(`${template.label} board ready`);
    },
    [setWidgets, pushToast],
  );

  const focusWidget = useCallback(
    (widget) => {
      setFocusedId(widget.id);
      if (isMobile) {
        const element = typeof document !== 'undefined' ? document.getElementById(`widget-${widget.id}`) : null;
        if (element) element.scrollIntoView({ behavior: prefs.reduceMotion ? 'auto' : 'smooth', block: 'center' });
        return;
      }
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setView((current) => ({
        scale: current.scale,
        x: rect.width / 2 - (widget.x + widget.w / 2) * current.scale,
        y: rect.height / 2 - (widget.y + widget.h / 2) * current.scale,
      }));
    },
    [isMobile, prefs.reduceMotion],
  );

  /* --- command palette --- */

  const paletteCommands = useMemo(() => {
    const commands = [];
    WIDGET_CATALOG.forEach((item) => {
      commands.push({
        id: `add:${item.key}`,
        group: 'Add widget',
        label: `Add ${item.label}`,
        icon: item.icon,
        run: () => addWidget(item.key),
      });
    });
    TEMPLATES.forEach((template) => {
      commands.push({
        id: `template:${template.key}`,
        group: 'Template',
        label: `Use template: ${template.label}`,
        icon: template.icon,
        run: () => applyTemplate(template),
      });
    });
    visibleWidgets.forEach((widget) => {
      commands.push({
        id: `go:${widget.id}`,
        group: 'Go to widget',
        label: widget.title,
        icon: ICONS[widget.type] || TimerIcon,
        run: () => focusWidget(widget),
      });
    });
    workspaces.forEach((workspace) => {
      commands.push({
        id: `ws:${workspace.id}`,
        group: 'Workspace',
        label: `Switch to ${workspace.name}`,
        icon: LayersIcon,
        run: () => switchWorkspace(workspace.id),
      });
    });
    commands.push(
      { id: 'action:reset', group: 'Action', label: 'Reset zoom & position', icon: FitIcon, run: resetView },
      {
        id: 'action:theme',
        group: 'Action',
        label: 'Toggle theme',
        icon: prefs.theme === 'dark' ? SunIcon : MoonIcon,
        run: () => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' })),
      },
      {
        id: 'action:grid',
        group: 'Action',
        label: 'Toggle grid',
        icon: ChartIcon,
        run: () => setSettings((current) => ({ ...current, grid: !current.grid })),
      },
      { id: 'action:settings', group: 'Action', label: 'Open customize', icon: SlidersIcon, run: () => setSettingsOpen(true) },
      { id: 'action:clear', group: 'Action', label: 'Clear canvas', icon: TrashIcon, run: clearCanvas },
      {
        id: 'action:bar',
        group: 'Action',
        label: prefs.barOpen ? 'Hide widget bar' : 'Show widget bar',
        icon: LayersIcon,
        run: () => setSettings((current) => ({ ...current, barOpen: !current.barOpen })),
      },
      { id: 'ws:new', group: 'Workspace', label: 'New workspace', icon: PlusIcon, run: addWorkspace },
      {
        id: 'draw:toggle',
        group: 'Draw',
        label: prefs.drawMode ? 'Exit drawing mode' : 'Draw on the board',
        icon: PenIcon,
        run: () => setSettings((current) => ({ ...current, drawMode: !current.drawMode, whiteboard: false })),
      },
      {
        id: 'draw:whiteboard',
        group: 'Draw',
        label: prefs.whiteboard ? 'Bring widgets back' : 'Turn into a whiteboard',
        icon: BoardIcon,
        run: () => setSettings((current) => ({ ...current, drawMode: true, whiteboard: !current.whiteboard })),
      },
      { id: 'draw:undo', group: 'Draw', label: 'Undo stroke', icon: UndoIcon, run: undoDraw },
      { id: 'draw:redo', group: 'Draw', label: 'Redo stroke', icon: RedoIcon, run: redoDraw },
      { id: 'draw:selectAll', group: 'Draw', label: 'Select all strokes', icon: MoveIcon, run: selectAllStrokes },
      { id: 'draw:duplicate', group: 'Draw', label: 'Duplicate selected strokes', icon: CopyIcon, run: duplicateSelection },
      { id: 'draw:delete', group: 'Draw', label: 'Delete selected strokes', icon: TrashIcon, run: deleteSelection },
      { id: 'draw:clear', group: 'Draw', label: 'Clear drawing', icon: TrashIcon, run: clearDrawing },
      { id: 'draw:export', group: 'Draw', label: 'Export drawing as PNG', icon: ImageIcon, run: exportDrawing },
      { id: 'draw:exportSvg', group: 'Draw', label: 'Export drawing as SVG', icon: ImageIcon, run: exportDrawingSvg },
      { id: 'draw:copy', group: 'Draw', label: 'Copy drawing', icon: CopyIcon, run: copyDrawing },
      {
        id: 'draw:fill',
        group: 'Draw',
        label: prefs.drawFill ? 'Shapes: outline only' : 'Shapes: filled',
        icon: RectangleIcon,
        run: () => setSettings((current) => ({ ...current, drawFill: !current.drawFill })),
      },
      {
        id: 'unit',
        group: 'Action',
        label: unit === 'c' ? 'Weather in Fahrenheit' : 'Weather in Celsius',
        icon: CloudIcon,
        run: () => setUnit((current) => (current === 'c' ? 'f' : 'c')),
      },
    );
    const query = paletteQuery.trim().toLowerCase();
    if (!query) return commands;
    return commands.filter(
      (command) => command.label.toLowerCase().includes(query) || command.group.toLowerCase().includes(query),
    );
  }, [
    paletteQuery,
    visibleWidgets,
    workspaces,
    addWorkspace,
    switchWorkspace,
    addWidget,
    applyTemplate,
    focusWidget,
    resetView,
    prefs.theme,
    prefs.drawMode,
    prefs.whiteboard,
    prefs.barOpen,
    prefs.drawFill,
    clearCanvas,
    undoDraw,
    redoDraw,
    clearDrawing,
    exportDrawing,
    exportDrawingSvg,
    copyDrawing,
    selectAllStrokes,
    duplicateSelection,
    deleteSelection,
    unit,
    setUnit,
    setSettings,
    setWidgets,
  ]);

  const runCommand = (command) => {
    command.run();
    setPaletteOpen(false);
    setPaletteQuery('');
    setPaletteIndex(0);
  };

  const onPaletteKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setPaletteIndex((index) => Math.min(index + 1, Math.max(0, paletteCommands.length - 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setPaletteIndex((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = paletteCommands[paletteIndex];
      if (command) runCommand(command);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        setPaletteQuery('');
        setPaletteIndex(0);
      } else if (event.key === 'Escape') {
        setPaletteOpen(false);
        setFullscreenId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Full-screen a single widget, or the whole board via the browser API.
  const toggleAppFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  const renderWelcome = (flow) => (
    <div className={`canvas-welcome ${flow ? 'canvas-welcome--flow' : ''}`}>
      <div className="welcome-copy">
        <h2>Build your workspace</h2>
        <p>
          Start from a template or add any widget from the bar below. Drag widgets to move them, resize from the corners,
          and pan the board freely.
        </p>
      </div>
      <div className="template-grid">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <button key={template.key} type="button" className="template-card" onClick={() => applyTemplate(template)}>
              <span className="template-icon">
                <Icon size={16} />
              </span>
              <span className="template-name">{template.label}</span>
              <span className="template-blurb">{template.blurb}</span>
            </button>
          );
        })}
      </div>
      <div className="welcome-hint">
        Tip: press <kbd>⌘</kbd> <kbd>K</kbd> to search widgets and actions.
      </div>
    </div>
  );

  const activePaletteIndex = Math.min(paletteIndex, Math.max(0, paletteCommands.length - 1));

  // Widget bar: one button per category, each opening a drop-up of its widgets.
  const paletteGroups = useMemo(
    () =>
      WIDGET_CATEGORIES.map((category) => ({
        ...category,
        items: WIDGET_CATALOG.filter(
          (item) => item.category === category.key && !prefs.hiddenPalette.includes(item.key),
        ),
      })).filter((category) => category.items.length > 0),
    [prefs.hiddenPalette],
  );

  const ThemeIcon = prefs.theme === 'dark' ? SunIcon : MoonIcon;
  const fullscreenWidget = fullscreenId ? widgets.find((widget) => widget.id === fullscreenId) : null;

  // Date and time shown in the top bar, reusing the master tick.
  const clockNow = new Date(now);
  const clockDate = clockNow.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const clockTime = clockNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Everything a widget body needs to render, gathered once so
  // `renderWidgetBody` stays a plain function (see src/widgets/renderWidgetBody.jsx).
  const widgetApp = {
    timer, setTimer, toggleTimer, resetTimer, switchTimerMode,
    stats,
    stopwatch, toggleStopwatch, addLap, resetStopwatch,
    pandora, setPandora, togglePandora, resetPandora, skipPandora,
    now, prefs, updateWidget,
    countdown, setCountdown,
    tasks, doneTasks, setTasks, newTask, setNewTask, addTask,
    habits, toggleHabit, setHabits, newHabit, setNewHabit, addHabit,
    notesText, setNotesText,
    water, setWater, adjustWater,
    quoteIndex, setQuoteIndex, copyQuote, quoteCopied,
    links, setLinks, addLink, linkDraft, setLinkDraft,
    sound, setSound, soundPlaying, setSoundPlaying,
    shuffleDeck,
    pickerState, pickRandom, resetPicker,
    breath, setBreath,
    weather, unitFor, setUnit, hasWeatherLocation, weatherEditing, setWeatherEditing,
    searchWeatherCity, weatherQuery, setWeatherQuery, weatherBusy, useMyLocation, weatherLocation, loadWeather,
    todoistToken, todoistEditing, setTodoistEditing, saveTodoistToken, todoistTokenDraft, setTodoistTokenDraft, setTodoistToken,
    todoist, loadTodoist, todoistFilter, setTodoistFilter, todoistFiltered, projectName, completeTodoistTask, todoistBusy,
    todoistSort, setTodoistSort, todoistComposer, setTodoistComposer,
    addTodoistTask, todoistDraft, setTodoistDraft,
  };

  return (
    <div
      className="app-shell"
      data-theme={prefs.theme}
      data-motion={prefs.reduceMotion ? 'reduced' : 'full'}
      style={{ '--accent': prefs.accent }}
    >
      <header className="topbar">
        <div className="ws-switcher">
          <button
            type="button"
            className={`ws-button ${wsOpen ? 'open' : ''}`}
            onClick={() => setWsOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={wsOpen}
            title="Workspaces"
          >
            <span className="ws-dot" style={{ background: activeWorkspace?.color || 'var(--accent)' }} />
            <span className="ws-name">{activeWorkspace?.name || 'Workspace'}</span>
            <span className="ws-count">{workspaces.length}</span>
            <ChevronDownIcon size={14} className="ws-caret" />
          </button>
          {wsOpen && (
            <div className="ws-menu" role="menu">
              <div className="ws-menu-head">Workspaces</div>
              <div className="ws-list">
                {workspaces.map((workspace) => {
                  const isActive = workspace.id === activeId;
                  const isRenaming = renamingWorkspaceId === workspace.id;
                  return (
                    <div className={`ws-row ${isActive ? 'active' : ''}`} key={workspace.id}>
                      {isRenaming ? (
                        <>
                          <form
                            className="ws-rename"
                            onSubmit={(event) => {
                              event.preventDefault();
                              renameWorkspace(workspace.id, renameDraft);
                            }}
                          >
                            <input
                              autoFocus
                              type="text"
                              value={renameDraft}
                              maxLength={32}
                              onChange={(event) => setRenameDraft(event.target.value)}
                              onBlur={() => renameWorkspace(workspace.id, renameDraft)}
                              aria-label="Workspace name"
                            />
                          </form>
                          <div className="ws-colors">
                            {WS_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`ws-color ${workspace.color === color ? 'active' : ''}`}
                                style={{ background: color }}
                                aria-label={`Workspace color ${color}`}
                                onClick={() => setWorkspaceColor(workspace.id, color)}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <button type="button" className="ws-select" onClick={() => switchWorkspace(workspace.id)}>
                            <span className="ws-dot" style={{ background: workspace.color }} />
                            <span className="ws-name">{workspace.name}</span>
                            {isActive && <CheckSquareIcon size={13} className="ws-check" />}
                          </button>
                          <div className="ws-row-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              aria-label={`Rename ${workspace.name}`}
                              onClick={() => {
                                setRenamingWorkspaceId(workspace.id);
                                setRenameDraft(workspace.name);
                              }}
                            >
                              <PencilIcon size={13} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              aria-label={`Delete ${workspace.name}`}
                              disabled={workspaces.length <= 1}
                              onClick={() => deleteWorkspace(workspace.id)}
                            >
                              <TrashIcon size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" className="ws-new" onClick={addWorkspace}>
                <PlusIcon size={14} />
                <span>New workspace</span>
              </button>
            </div>
          )}
        </div>

        <div className="topbar-actions">
          <span
            className={`save-chip ${savePulse ? 'is-live' : ''}`}
            aria-live="polite"
            title={savePulse ? 'Saved' : 'Autosave'}
          >
            <span className="save-dot" aria-hidden="true" />
          </span>
          {!isMobile && (
            <button
              type="button"
              className={`icon-button ${prefs.drawMode ? 'is-active' : ''}`}
              aria-label={prefs.drawMode ? 'Exit drawing' : 'Draw on the board'}
              title={prefs.drawMode ? 'Exit drawing' : 'Draw on the board'}
              onClick={() => setSettings((current) => ({ ...current, drawMode: !current.drawMode, whiteboard: false }))}
            >
              <PenIcon size={16} />
            </button>
          )}
          <button
            type="button"
            className="icon-button"
            aria-label="Search and commands"
            onClick={() => {
              setPaletteOpen(true);
              setPaletteQuery('');
              setPaletteIndex(0);
            }}
          >
            <CommandIcon size={16} />
          </button>
          {!isMobile && (
            <button
              type="button"
              className="icon-button"
              aria-label="Toggle full screen"
              title="Full screen"
              onClick={toggleAppFullscreen}
            >
              <ExpandIcon size={16} />
            </button>
          )}
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

        <div className="topbar-clock" aria-label="Date and time">
          <span className="topbar-clock-date">{clockDate}</span>
          <span className="topbar-clock-time">{clockTime}</span>
        </div>
      </header>

      {isMobile ? (
        <div className="widget-stack">
          {visibleWidgets.length === 0 && renderWelcome(true)}
          {visibleWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              mobile
              focused={focusedId === widget.id}
              onFocus={() => setFocusedId(widget.id)}
              onRemove={() => removeWidget(widget.id)}
              onDuplicate={() => duplicateWidget(widget.id)}
              onToggleLock={() => toggleLock(widget.id)}
              scaleContent={prefs.scaleContent}
              resizing={resizing && resizing.id === widget.id ? resizing : null}
              onFullscreen={() => setFullscreenId(widget.id)}
              onMobileResizeStart={(event) => startMobileResize(event, widget.id)}
            >
              {renderWidgetBody(widget, widgetApp)}
            </WidgetCard>
          ))}
        </div>
      ) : (
        <div
          className={`canvas-viewport ${prefs.drawMode ? 'is-drawing' : ''} ${prefs.whiteboard ? 'is-whiteboard' : ''}`}
          ref={viewportRef}
          data-tool={prefs.drawTool}
          onPointerDown={onViewportPointerDown}
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
            {shownWidgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                focused={focusedId === widget.id}
                scaleContent={prefs.scaleContent}
                resizing={resizing && resizing.id === widget.id ? resizing : null}
                onFocus={() => setFocusedId(widget.id)}
                onRemove={() => removeWidget(widget.id)}
                onDuplicate={() => duplicateWidget(widget.id)}
                onToggleLock={() => toggleLock(widget.id)}
                onFullscreen={() => setFullscreenId(widget.id)}
                onDragStart={(event) => startDrag(event, widget.id)}
                onResizeStart={(event, corner) => startResize(event, widget.id, corner)}
              >
                {renderWidgetBody(widget, widgetApp)}
              </WidgetCard>
            ))}
            <svg className="draw-layer" aria-hidden="true">
              {strokes.map((stroke) =>
                stroke.id === editingText ? null : <Stroke key={stroke.id} stroke={stroke} />,
              )}
              {strokeDraft && <Stroke stroke={strokeDraft} />}
              {selection.map((id) => {
                const stroke = strokes.find((item) => item.id === id);
                return stroke ? (
                  <SelectionOutline
                    key={id}
                    stroke={stroke}
                    onDelete={() => {
                      pushPast(strokes);
                      setStrokes((current) => current.filter((item) => item.id !== id));
                      setSelection((current) => current.filter((item) => item !== id));
                    }}
                  />
                ) : null;
              })}
            </svg>
          </div>

          {guides.map((guide, index) =>
            guide.axis === 'x' ? (
              <span
                key={`x-${index}`}
                className="align-guide align-guide--x"
                style={{ left: guide.pos * view.scale + view.x }}
              />
            ) : (
              <span
                key={`y-${index}`}
                className="align-guide align-guide--y"
                style={{ top: guide.pos * view.scale + view.y }}
              />
            ),
          )}

          {editingText &&
            (() => {
              const stroke = strokes.find((item) => item.id === editingText);
              if (!stroke) return null;
              return (
                <TextEditor
                  stroke={stroke}
                  view={view}
                  onChange={(value) =>
                    setStrokes((current) => current.map((item) => (item.id === editingText ? { ...item, text: value } : item)))
                  }
                  onCommit={(value) => commitText(editingText, value)}
                />
              );
            })()}

          {!prefs.drawMode && visibleWidgets.length === 0 && renderWelcome(false)}

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

      {!prefs.whiteboard && prefs.barOpen && (
        <nav className="toolbar" aria-label="Widget bar">
          <div className="toolbar-palette">
            {paletteGroups.map((category) => {
              const CategoryIcon = category.icon;
              const isOpen = openCategory === category.key;
              return (
                <div className={`palette-group ${isOpen ? 'open' : ''}`} key={category.key}>
                  <button
                    type="button"
                    className={`palette-item palette-cat ${isOpen ? 'active' : ''}`}
                    onClick={() => setOpenCategory((current) => (current === category.key ? null : category.key))}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    title={`${category.label} — ${category.items.length} widget${category.items.length === 1 ? '' : 's'}`}
                  >
                    <CategoryIcon size={16} />
                    <span>{category.label}</span>
                    <ChevronDownIcon size={13} className="palette-caret" />
                  </button>
                  {isOpen && (
                    <div className="palette-dropup" role="menu">
                      <div className="palette-dropup-head">
                        <span className="palette-dropup-title">{category.label}</span>
                        <span className="palette-dropup-blurb">{category.blurb}</span>
                      </div>
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            role="menuitem"
                            className="palette-row"
                            onClick={() => {
                              addWidget(item.key);
                              setOpenCategory(null);
                            }}
                          >
                            <Icon size={16} />
                            <span>{item.label}</span>
                            <PlusIcon size={13} className="palette-row-add" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {paletteGroups.length === 0 && <span className="palette-empty">All widgets hidden</span>}
          </div>
          <div className="toolbar-end">
            <button type="button" className="palette-text" onClick={clearCanvas} disabled={visibleWidgets.length === 0}>
              <TrashIcon size={15} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              className="palette-text"
              onClick={() => setSettings((current) => ({ ...current, barOpen: false }))}
              title="Hide the widget bar"
            >
              <ChevronDownIcon size={15} />
              <span>Hide bar</span>
            </button>
          </div>
        </nav>
      )}

      {!prefs.whiteboard && !prefs.barOpen && (
        <button
          type="button"
          className="palette-handle"
          onClick={() => setSettings((current) => ({ ...current, barOpen: true }))}
          title="Show the widget bar"
        >
          <LayersIcon size={16} />
          <span>Widgets</span>
          <ChevronDownIcon size={14} className="palette-handle-caret" />
        </button>
      )}

      {toasts.length > 0 && (
        <div className="toast-stack" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div className="toast" key={toast.id}>
              <span className="toast-text">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => {
                    toast.action.run();
                    dismissToast(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
                <XIcon size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {prefs.drawMode && !isMobile && (
        <div className="draw-toolbar" role="toolbar" aria-label="Drawing tools">
          <div className="draw-group draw-group--tools">
            {DRAW_TOOLS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`draw-btn ${prefs.drawTool === item.key ? 'active' : ''}`}
                  title={`${item.label} (${item.shortcut.toUpperCase()})`}
                  aria-label={item.label}
                  onClick={() => setSettings((current) => ({ ...current, drawTool: item.key }))}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>

          {!['eraser', 'pan', 'select'].includes(prefs.drawTool) && (
            <>
              <span className="draw-divider" />
              <div className="draw-group draw-group--colors">
                {DRAW_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`draw-swatch ${prefs.drawColor.toLowerCase() === color ? 'active' : ''}`}
                    style={{ background: color }}
                    aria-label={`Pen colour ${color}`}
                    onClick={() => setSettings((current) => ({ ...current, drawColor: color }))}
                  />
                ))}
                <input
                  type="color"
                  value={prefs.drawColor}
                  onChange={(event) => setSettings((current) => ({ ...current, drawColor: event.target.value }))}
                  aria-label="Custom pen colour"
                />
              </div>
            </>
          )}

          {prefs.drawTool !== 'select' && prefs.drawTool !== 'pan' && (
            <>
              <span className="draw-divider" />
              <div className="draw-group">
                {DRAW_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`draw-btn draw-btn--size ${prefs.drawSize === size ? 'active' : ''}`}
                    aria-label={`Stroke size ${size}`}
                    onClick={() => setSettings((current) => ({ ...current, drawSize: size }))}
                  >
                    <span className="draw-dot" style={{ width: size * 1.5, height: size * 1.5 }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {(prefs.drawTool === 'rect' || prefs.drawTool === 'ellipse') && (
            <>
              <span className="draw-divider" />
              <button
                type="button"
                className={`draw-btn draw-btn--wide ${prefs.drawFill ? 'active' : ''}`}
                title="Fill the shape"
                aria-pressed={prefs.drawFill}
                onClick={() => setSettings((current) => ({ ...current, drawFill: !current.drawFill }))}
              >
                <span className={`draw-fill-icon ${prefs.drawFill ? 'on' : ''}`} aria-hidden="true" />
                <span>Fill</span>
              </button>
            </>
          )}

          <span className="draw-divider" />
          <div className="draw-group">
            <button type="button" className="draw-btn" title="Undo" aria-label="Undo stroke" onClick={undoDraw} disabled={!past.length}>
              <UndoIcon size={16} />
            </button>
            <button type="button" className="draw-btn" title="Redo" aria-label="Redo stroke" onClick={redoDraw} disabled={!future.length}>
              <RedoIcon size={16} />
            </button>
            <button
              type="button"
              className="draw-btn"
              title="Duplicate selected"
              aria-label="Duplicate selected"
              onClick={duplicateSelection}
              disabled={!selection.length}
            >
              <CopyIcon size={16} />
            </button>
            <button
              type="button"
              className="draw-btn"
              title="Delete selected"
              aria-label="Delete selected"
              onClick={deleteSelection}
              disabled={!selection.length}
            >
              <TrashIcon size={16} />
            </button>
          </div>

          <span className="draw-divider" />
          <div className="draw-group">
            <button type="button" className="draw-btn" title="Export as PNG" aria-label="Export as PNG" onClick={exportDrawing} disabled={!strokes.length}>
              <ImageIcon size={16} />
            </button>
            <button type="button" className="draw-btn draw-btn--wide" title="Export as SVG" onClick={exportDrawingSvg} disabled={!strokes.length}>
              <span>SVG</span>
            </button>
            <button type="button" className="draw-btn draw-btn--wide" title="Copy drawing" onClick={copyDrawing} disabled={!strokes.length}>
              <span>Copy</span>
            </button>
            <button
              type="button"
              className="draw-btn"
              title="Clear drawing"
              aria-label="Clear drawing"
              onClick={clearDrawing}
              disabled={!strokes.length}
            >
              <TrashIcon size={16} />
            </button>
          </div>
          <span className="draw-divider" />
          <button
            type="button"
            className={`draw-btn draw-btn--wide ${prefs.whiteboard ? 'active' : ''}`}
            title="Turn the board into a clean whiteboard"
            onClick={() => setSettings((current) => ({ ...current, whiteboard: !current.whiteboard }))}
          >
            <BoardIcon size={16} />
            <span>{prefs.whiteboard ? 'Widgets off' : 'Whiteboard'}</span>
          </button>
          <button
            type="button"
            className="draw-btn"
            title="Exit drawing"
            aria-label="Exit drawing"
            onClick={() => setSettings((current) => ({ ...current, drawMode: false, whiteboard: false }))}
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

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
          <span>Alignment guides</span>
          <input
            type="checkbox"
            checked={prefs.snapGuides}
            onChange={(event) => setSettings((current) => ({ ...current, snapGuides: event.target.checked }))}
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

        <label className="toggle-row">
          <span>Show widget bar</span>
          <input
            type="checkbox"
            checked={prefs.barOpen}
            onChange={(event) => setSettings((current) => ({ ...current, barOpen: event.target.checked }))}
          />
        </label>

        <label className="toggle-row">
          <span>Focus chime</span>
          <input
            type="checkbox"
            checked={prefs.chime}
            onChange={(event) => setSettings((current) => ({ ...current, chime: event.target.checked }))}
          />
        </label>

        <label className="toggle-row">
          <span>Auto-start next session</span>
          <input
            type="checkbox"
            checked={prefs.autoNext}
            onChange={(event) => setSettings((current) => ({ ...current, autoNext: event.target.checked }))}
          />
        </label>

        <label className="toggle-row">
          <span>Reduce motion</span>
          <input
            type="checkbox"
            checked={prefs.reduceMotion}
            onChange={(event) => setSettings((current) => ({ ...current, reduceMotion: event.target.checked }))}
          />
        </label>

        <div className="field">
          <span className="field-label">Drawing</span>
          <label className="toggle-row">
            <span>Draw on the board</span>
            <input
              type="checkbox"
              checked={prefs.drawMode}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  drawMode: event.target.checked,
                  whiteboard: event.target.checked ? current.whiteboard : false,
                }))
              }
            />
          </label>
          <label className="toggle-row">
            <span>Whiteboard mode</span>
            <input
              type="checkbox"
              checked={prefs.whiteboard}
              disabled={!prefs.drawMode}
              onChange={(event) => setSettings((current) => ({ ...current, whiteboard: event.target.checked }))}
            />
          </label>
          <label className="toggle-row">
            <span>Fill shapes</span>
            <input
              type="checkbox"
              checked={prefs.drawFill}
              onChange={(event) => setSettings((current) => ({ ...current, drawFill: event.target.checked }))}
            />
          </label>
          <div className="micro-copy">
            Draw over your widgets, or switch to a clean whiteboard. Pen, highlighter, shapes, arrows, text and an eraser,
            with select-and-move, undo, redo, and PNG/SVG export. Stored in this browser.
          </div>
        </div>

        <div className="field">
          <span className="field-label">Weather units</span>
          <div className="segmented">
            {[
              { key: 'c', label: '°C' },
              { key: 'f', label: '°F' },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className={`seg ${unit === option.key ? 'active' : ''}`}
                onClick={() => setUnit(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="micro-copy">Each weather widget can also switch on its own.</div>
        </div>

        <div className="field">
          <span className="field-label">Templates</span>
          <div className="template-grid template-grid--compact">
            {TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <button key={template.key} type="button" className="template-card" onClick={() => applyTemplate(template)}>
                  <span className="template-icon">
                    <Icon size={15} />
                  </span>
                  <span className="template-name">{template.label}</span>
                </button>
              );
            })}
          </div>
          <div className="micro-copy">Applying a template replaces the canvas.</div>
        </div>

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

      {paletteOpen && (
        <div className="palette-overlay" onClick={() => setPaletteOpen(false)} role="presentation">
          <div
            className="palette-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="palette-search">
              <CommandIcon size={15} />
              <input
                autoFocus
                type="text"
                value={paletteQuery}
                onChange={(event) => {
                  setPaletteQuery(event.target.value);
                  setPaletteIndex(0);
                }}
                onKeyDown={onPaletteKeyDown}
                placeholder="Search widgets, templates and actions…"
                aria-label="Command palette search"
              />
              <button type="button" className="icon-btn" onClick={() => setPaletteOpen(false)} aria-label="Close">
                <XIcon size={14} />
              </button>
            </div>
            <div className="palette-results">
              {paletteCommands.length === 0 && <div className="hint palette-empty-row">No matches.</div>}
              {paletteCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <button
                    key={command.id}
                    type="button"
                    className={`palette-row ${index === activePaletteIndex ? 'active' : ''}`}
                    onMouseEnter={() => setPaletteIndex(index)}
                    onClick={() => runCommand(command)}
                  >
                    <Icon size={15} />
                    <span className="palette-row-label">{command.label}</span>
                    <span className="palette-row-group">{command.group}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {fullscreenWidget && (
        <div
          className="fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${fullscreenWidget.title} full screen`}
          onClick={() => setFullscreenId(null)}
        >
          <div className="fullscreen-panel" onClick={(event) => event.stopPropagation()}>
            <header className="fullscreen-header">
              <span className="fullscreen-title">{fullscreenWidget.title}</span>
              <button type="button" className="icon-button" onClick={() => setFullscreenId(null)} aria-label="Exit full screen">
                <MinimizeIcon size={16} />
              </button>
            </header>
            <div className="fullscreen-body">{renderWidgetBody(fullscreenWidget, widgetApp)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

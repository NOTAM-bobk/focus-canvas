import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Storage keys & helpers                                            */
/* ------------------------------------------------------------------ */

const KEYS = {
  settings: 'focus-canvas-settings-v2',
  widgets: 'focus-canvas-widgets-v2',
  notes: 'focus-canvas-notes-v2',
  tasks: 'focus-canvas-tasks-v2',
  habits: 'focus-canvas-habits-v2',
  water: 'focus-canvas-water-v2',
  links: 'focus-canvas-links-v2',
  countdown: 'focus-canvas-countdown-v2',
  sound: 'focus-canvas-sound-v2',
  stats: 'focus-canvas-stats-v2',
};

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
      /* storage unavailable — ignore */
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
/*  Widget catalog                                                    */
/* ------------------------------------------------------------------ */

const WIDGET_CATALOG = [
  { key: 'timer', label: 'Focus Timer', icon: '⏱️', desc: 'Pomodoro countdown with presets', w: 270, h: 210 },
  { key: 'stopwatch', label: 'Stopwatch', icon: '⏲️', desc: 'Track elapsed time', w: 240, h: 190 },
  { key: 'pandora', label: 'Interval Timer', icon: '🔁', desc: 'Short controlled work bursts', w: 260, h: 205 },
  { key: 'clock', label: 'Clock', icon: '🕐', desc: 'Live time and date', w: 250, h: 175 },
  { key: 'countdown', label: 'Countdown', icon: '📅', desc: 'Days until an event', w: 275, h: 195 },
  { key: 'tasks', label: 'Task List', icon: '✅', desc: 'Checklist for the day', w: 310, h: 255 },
  { key: 'habits', label: 'Habit Tracker', icon: '🌱', desc: 'Weekly habit grid', w: 340, h: 245 },
  { key: 'notes', label: 'Notes', icon: '📝', desc: 'Jot down ideas fast', w: 340, h: 235 },
  { key: 'water', label: 'Hydration', icon: '💧', desc: 'Track your water goal', w: 250, h: 215 },
  { key: 'quote', label: 'Inspiration', icon: '✨', desc: 'A rotating focus quote', w: 340, h: 195 },
  { key: 'links', label: 'Quick Links', icon: '🔗', desc: 'Your favorite shortcuts', w: 270, h: 220 },
  { key: 'sound', label: 'Soundscape', icon: '🎧', desc: 'Ambient background noise', w: 290, h: 230 },
  { key: 'stats', label: 'Today', icon: '📊', desc: 'Your daily progress', w: 300, h: 220 },
];

const CATALOG_MAP = Object.fromEntries(WIDGET_CATALOG.map((item) => [item.key, item]));

const createWidget = (type, overrides = {}) => {
  const meta = CATALOG_MAP[type];
  return {
    id: uid(type),
    type,
    title: meta ? meta.label : type,
    visible: true,
    x: 32,
    y: 32,
    w: meta ? meta.w : 260,
    h: meta ? meta.h : 200,
    ...overrides,
  };
};

const initialWidgets = [
  createWidget('timer', { x: 24, y: 24 }),
  createWidget('clock', { x: 314, y: 24 }),
  createWidget('tasks', { x: 584, y: 24 }),
  createWidget('notes', { x: 24, y: 254 }),
  createWidget('water', { x: 384, y: 254 }),
  createWidget('quote', { x: 654, y: 300, w: 360, h: 200 }),
];

const defaultSettings = {
  accent: '#7c5cff',
  background: '#0b0f19',
  grid: true,
  theme: 'dark',
};

const ACCENT_PRESETS = ['#7c5cff', '#22d3ee', '#34d399', '#f59e0b', '#fb7185', '#a855f7'];

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
  { id: uid('habit'), name: 'Deep work', days: [false, false, false, false, false, false, false] },
  { id: uid('habit'), name: 'Move your body', days: [false, false, false, false, false, false, false] },
  { id: uid('habit'), name: 'Read 20 minutes', days: [false, false, false, false, false, false, false] },
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
/*  Widget card                                                       */
/* ------------------------------------------------------------------ */

function WidgetCard({ widget, focused, mobile, onFocus, onRemove, onDragStart, onResizeStart, children }) {
  return (
    <section
      className={`widget ${mobile ? 'widget--flow' : ''} ${focused ? 'is-focused' : ''}`}
      style={mobile ? undefined : { left: `${widget.x}px`, top: `${widget.y}px`, width: `${widget.w}px`, height: `${widget.h}px` }}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
    >
      <header
        className={`widget-header ${mobile ? 'static' : ''}`}
        onPointerDown={mobile ? undefined : onDragStart}
      >
        <span className="widget-title">
          <span className="widget-icon" aria-hidden="true">{CATALOG_MAP[widget.type]?.icon}</span>
          {widget.title}
        </span>
        <div className="widget-actions">
          <button type="button" onClick={onRemove} aria-label={`Remove ${widget.title}`}>×</button>
        </div>
      </header>
      <div className="widget-content">{children}</div>
      {!mobile && <div className="resize-hitbox" onPointerDown={onResizeStart} aria-hidden="true" />}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const canvasRef = useRef(null);

  const [settings, setSettings] = useLocalStorageState(KEYS.settings, defaultSettings);
  const [widgets, setWidgets] = useLocalStorageState(KEYS.widgets, initialWidgets);
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

  const [newTask, setNewTask] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [linkDraft, setLinkDraft] = useState({ label: '', url: '' });
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const [timer, setTimer] = useState({ running: false, remaining: 25 * 60, preset: 25 * 60 });
  const [stopwatch, setStopwatch] = useState({ running: false, elapsed: 0 });
  const [pandora, setPandora] = useState({ running: false, remaining: 20 * 60, preset: 20 * 60 });

  const [now, setNow] = useState(() => Date.now());
  const [focusedId, setFocusedId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 760,
  );

  const audioRef = useRef({ ctx: null, gain: null, source: null, filter: null });
  const volumeRef = useRef(sound.volume);

  /* --- responsive --- */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760);
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

  /* --- timer completion -> daily stats --- */
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

  /* --- daily stats reset on a new day --- */
  useEffect(() => {
    if (stats.day !== todayKey()) {
      setStats({ day: todayKey(), sessions: 0, focusMinutes: 0 });
    }
  }, [stats.day, setStats]);

  /* --- fit widgets into the canvas --- */
  useEffect(() => {
    const element = canvasRef.current;
    if (!element || isMobile) return undefined;

    const fit = () => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setWidgets((current) =>
        current.map((widget) => {
          const width = Math.min(widget.w, Math.max(200, rect.width - 24));
          const height = Math.min(widget.h, Math.max(130, rect.height - 24));
          return {
            ...widget,
            w: width,
            h: height,
            x: clamp(widget.x, 12, Math.max(12, rect.width - width - 12)),
            y: clamp(widget.y, 12, Math.max(12, rect.height - height - 12)),
          };
        }),
      );
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isMobile, setWidgets]);

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
    if (sound.playing) {
      startSound(sound.type);
    } else {
      stopSound();
    }
    return () => stopSound();
  }, [sound.playing, sound.type, startSound, stopSound]);

  useEffect(() => {
    volumeRef.current = sound.volume;
    const audio = audioRef.current;
    if (audio.gain) audio.gain.gain.value = sound.volume;
  }, [sound.volume]);

  /* ------------------------------------------------------------------ */
  /*  Widget mutations                                                  */
  /* ------------------------------------------------------------------ */

  const visibleWidgets = useMemo(() => widgets.filter((widget) => widget.visible), [widgets]);

  const addWidget = useCallback((type) => {
    const meta = CATALOG_MAP[type];
    setWidgets((current) => [
      ...current,
      createWidget(type, {
        x: 40 + (current.length % 5) * 26,
        y: 40 + (current.length % 5) * 22,
        w: meta.w,
        h: meta.h,
      }),
    ]);
    setPickerOpen(false);
  }, [setWidgets]);

  const removeWidget = useCallback((id) => {
    setWidgets((current) => current.filter((widget) => widget.id !== id));
  }, [setWidgets]);

  const updateWidget = useCallback((id, changes) => {
    setWidgets((current) => current.map((widget) => (widget.id === id ? { ...widget, ...changes } : widget)));
  }, [setWidgets]);

  const handleDragStart = useCallback((event, widgetId) => {
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = widget.x;
    const originY = widget.y;

    const handleMove = (moveEvent) => {
      updateWidget(widgetId, {
        x: clamp(originX + (moveEvent.clientX - startX), 12, Math.max(12, rect.width - widget.w - 12)),
        y: clamp(originY + (moveEvent.clientY - startY), 12, Math.max(12, rect.height - widget.h - 12)),
      });
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [widgets, updateWidget]);

  const handleResizeStart = useCallback((event, widgetId) => {
    event.stopPropagation();
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originW = widget.w;
    const originH = widget.h;

    const handleMove = (moveEvent) => {
      updateWidget(widgetId, {
        w: clamp(originW + (moveEvent.clientX - startX), 200, rect.width - widget.x - 24),
        h: clamp(originH + (moveEvent.clientY - startY), 130, rect.height - widget.y - 24),
      });
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [widgets, updateWidget]);

  /* ------------------------------------------------------------------ */
  /*  Task / habit / link / water helpers                               */
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

  const handleResetLayout = () => {
    setWidgets(initialWidgets.map((widget) => ({ ...widget, id: uid(widget.type) })));
    setSettings((current) => ({ ...current, ...defaultSettings }));
  };

  const adjustWater = (delta) => {
    setWater((current) => ({ ...current, glasses: clamp(current.glasses + delta, 0, 30) }));
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
            <div className="clock-greeting">{greeting(date.getHours())} — let’s make it count.</div>
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
            {parts.done && <div className="hint">🎉 That date has arrived.</div>}
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
                  onChange={(event) =>
                    event.target.value &&
                    setCountdown((current) => ({ ...current, target: event.target.value }))
                  }
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
                    ×
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
              <button type="submit" className="primary" disabled={!newTask.trim()}>Add</button>
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
                    ×
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
              <button type="submit" className="primary" disabled={!newHabit.trim()}>Add</button>
            </form>
          </div>
        );

      case 'notes':
        return (
          <textarea
            className="notes-area"
            value={notesText}
            onChange={(event) => setNotesText(event.target.value)}
            placeholder="Capture your next idea, habit, or task…"
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
              <button type="button" onClick={() => adjustWater(-1)} disabled={water.glasses === 0}>− Glass</button>
              <button type="button" className="primary" onClick={() => adjustWater(1)}>+ Glass</button>
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
            <div className="quote-mark">“</div>
            <p className="quote-text">{quote.text}</p>
            <p className="quote-author">— {quote.author}</p>
            <button
              type="button"
              className="hyperlink"
              onClick={() => setQuoteIndex((current) => (current + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length)}
            >
              New quote →
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
                  <a className="link-pill" href={link.url} target="_blank" rel="noreferrer noopener">{link.label}</a>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove ${link.label}`}
                    onClick={() => setLinks((current) => current.filter((item) => item.id !== link.id))}
                  >
                    ×
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
            <div className="micro-copy">Reset each morning. Keep the streak alive.</div>
          </div>
        );
      }

      default:
        return <div className="hint">Unknown widget</div>;
    }
  };

  const activeCount = visibleWidgets.length;

  return (
    <div
      className="app-shell"
      data-theme={settings.theme}
      style={{ '--accent': settings.accent, '--app-bg': settings.background }}
    >
      <header className="app-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">◎</span>
          <div>
            <h1>Focus Canvas</h1>
            <p>{activeCount} widgets · {new Date(now).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="app-bar-actions">
          <button type="button" className="ghost" onClick={() => setPickerOpen(true)}>+ Add widget</button>
          <button
            type="button"
            className="ghost icon-only"
            aria-label="Toggle theme"
            onClick={() => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }))}
          >
            {settings.theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button type="button" className="ghost" onClick={() => setSettingsOpen((open) => !open)}>Customize</button>
        </div>
      </header>

      {isMobile ? (
        <div className="widget-stack">
          {visibleWidgets.length === 0 && <div className="empty-state">No widgets yet. Tap “Add widget” to begin.</div>}
          {visibleWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              mobile
              focused={focusedId === widget.id}
              onFocus={() => setFocusedId(widget.id)}
              onRemove={() => removeWidget(widget.id)}
            >
              {renderWidgetBody(widget)}
            </WidgetCard>
          ))}
        </div>
      ) : (
        <div className={`canvas-shell ${settings.grid ? 'grid-enabled' : ''}`} ref={canvasRef}>
          {visibleWidgets.length === 0 && <div className="empty-state">No widgets yet. Add one from the dock below.</div>}
          {visibleWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              focused={focusedId === widget.id}
              onFocus={() => setFocusedId(widget.id)}
              onRemove={() => removeWidget(widget.id)}
              onDragStart={(event) => handleDragStart(event, widget.id)}
              onResizeStart={(event) => handleResizeStart(event, widget.id)}
            >
              {renderWidgetBody(widget)}
            </WidgetCard>
          ))}
        </div>
      )}

      <nav className="bottom-dock">
        <button
          type="button"
          className={`dock-timer ${timer.running ? 'live' : ''}`}
          onClick={() => setTimer((current) => ({ ...current, running: !current.running }))}
        >
          <span className="label">Focus</span>
          <strong>{formatClock(timer.remaining)}</strong>
        </button>
        <button
          type="button"
          className={`dock-timer ${stopwatch.running ? 'live' : ''}`}
          onClick={() => setStopwatch((current) => ({ ...current, running: !current.running }))}
        >
          <span className="label">Stopwatch</span>
          <strong>{formatStopwatch(stopwatch.elapsed)}</strong>
        </button>
        <div className="dock-quick">
          {WIDGET_CATALOG.slice(0, 6).map((item) => (
            <button key={item.key} type="button" className="dock-icon" title={`Add ${item.label}`} onClick={() => addWidget(item.key)}>
              {item.icon}
            </button>
          ))}
        </div>
        <button type="button" className="primary dock-add" onClick={() => setPickerOpen(true)}>+ Widget</button>
      </nav>

      {/* Widget picker */}
      <div className={`overlay ${pickerOpen ? 'open' : ''}`} onClick={() => setPickerOpen(false)} role="presentation">
        <div className="sheet" onClick={(event) => event.stopPropagation()}>
          <div className="sheet-header">
            <h2>Add a widget</h2>
            <button type="button" onClick={() => setPickerOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="sheet-grid">
            {WIDGET_CATALOG.map((item) => (
              <button key={item.key} type="button" className="sheet-card" onClick={() => addWidget(item.key)}>
                <span className="sheet-icon">{item.icon}</span>
                <span className="sheet-label">{item.label}</span>
                <span className="sheet-desc">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings */}
      <aside className={`settings-panel ${settingsOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>Customize canvas</h3>
          <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button>
        </div>

        <div className="field">
          <span className="field-label">Accent color</span>
          <div className="swatch-row">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch ${settings.accent.toLowerCase() === color ? 'active' : ''}`}
                style={{ background: color }}
                aria-label={`Accent ${color}`}
                onClick={() => setSettings((current) => ({ ...current, accent: color }))}
              />
            ))}
            <input
              type="color"
              value={settings.accent}
              onChange={(event) => setSettings((current) => ({ ...current, accent: event.target.value }))}
              aria-label="Custom accent color"
            />
          </div>
        </div>

        <label className="field">
          <span className="field-label">Canvas background</span>
          <input
            type="color"
            value={settings.background}
            onChange={(event) => setSettings((current) => ({ ...current, background: event.target.value }))}
          />
        </label>

        <label className="toggle-row">
          <span>Grid overlay</span>
          <input
            type="checkbox"
            checked={settings.grid}
            onChange={(event) => setSettings((current) => ({ ...current, grid: event.target.checked }))}
          />
        </label>

        <button type="button" className="ghost full" onClick={handleResetLayout}>Reset layout &amp; theme</button>
      </aside>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ICONS,
  BoardIcon,
  BreathIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ChartIcon,
  CheckSquareIcon,
  CloudIcon,
  CommandIcon,
  CopyIcon,
  DiceIcon,
  DropletIcon,
  EraserIcon,
  ExternalIcon,
  FitIcon,
  FlashcardIcon,
  FrameIcon,
  HandIcon,
  HeadphonesIcon,
  HighlighterIcon,
  ImageIcon,
  LinkIcon,
  LockIcon,
  MinusIcon,
  MoonIcon,
  NoteIcon,
  PenIcon,
  PlusIcon,
  QuoteIcon,
  RainIcon,
  RedoIcon,
  RefreshIcon,
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
  weather: 'focus-canvas-weather-v3',
  draw: 'focus-canvas-draw-v3',
};

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;
const DEFAULT_VIEW = { scale: 1, x: 60, y: 60 };
const TODOIST_API = 'https://api.todoist.com/api/v1';
const BREAK_SECONDS = 5 * 60;
const BREATH_CYCLE = 16000;

const breathPhase = (elapsed) => {
  const p = ((elapsed % BREATH_CYCLE) + BREATH_CYCLE) % BREATH_CYCLE;
  if (p < 4000) return 'Inhale';
  if (p < 8000) return 'Hold';
  if (p < 12000) return 'Exhale';
  return 'Hold';
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
  { key: 'sound', label: 'Sound', icon: HeadphonesIcon, w: 300, h: 270 },
  { key: 'stats', label: 'Today', icon: ChartIcon, w: 300, h: 220 },
  { key: 'sticky', label: 'Post-it', icon: StickyIcon, w: 250, h: 250 },
  { key: 'flashcards', label: 'Flashcards', icon: FlashcardIcon, w: 300, h: 250 },
  { key: 'picker', label: 'Picker', icon: DiceIcon, w: 260, h: 220 },
  { key: 'breath', label: 'Breathe', icon: BreathIcon, w: 240, h: 270 },
  { key: 'weather', label: 'Weather', icon: CloudIcon, w: 300, h: 290 },
  { key: 'todoist', label: 'Todoist', icon: TodoistIcon, w: 340, h: 320 },
  { key: 'iframe', label: 'Embed', icon: FrameIcon, w: 420, h: 320 },
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
    ...(type === 'flashcards' ? { deck: '', cardIndex: 0, flipped: false, editing: false, order: [] } : {}),
    ...(type === 'picker' ? { names: '', editing: false } : {}),
    ...(type === 'clock' ? { clock24: false } : {}),
    ...(type === 'iframe' ? { url: '', src: '', reload: 0 } : {}),
    ...overrides,
  };
};

/* Starter boards for students and teachers. Positions use catalog sizes. */
const TEMPLATES = [
  {
    key: 'deep-work',
    label: 'Deep Work',
    blurb: 'Timer, tasks, notes and today',
    icon: TimerIcon,
    items: [['timer', 0, 0], ['tasks', 300, 0], ['notes', 0, 240], ['stats', 340, 290]],
  },
  {
    key: 'study',
    label: 'Study Session',
    blurb: 'Focus, flashcards and ambience',
    icon: FlashcardIcon,
    items: [['timer', 0, 0], ['flashcards', 300, 0], ['sticky', 0, 240], ['sound', 640, 0]],
  },
  {
    key: 'class-planner',
    label: 'Class Planner',
    blurb: 'Plan lessons and deadlines',
    icon: CalendarIcon,
    items: [['tasks', 0, 0], ['countdown', 360, 0], ['notes', 0, 290], ['links', 380, 240], ['clock', 720, 0]],
  },
  {
    key: 'morning',
    label: 'Morning Routine',
    blurb: 'Start the day on purpose',
    icon: DropletIcon,
    items: [['water', 0, 0], ['habits', 290, 0], ['weather', 400, 0], ['quote', 0, 255], ['clock', 400, 300]],
  },
  {
    key: 'lesson',
    label: 'Lesson Board',
    blurb: 'Countdown, board notes, and a picker',
    icon: SproutIcon,
    items: [['countdown', 0, 0], ['notes', 320, 0], ['picker', 0, 240], ['breath', 300, 240], ['clock', 720, 0]],
  },
  {
    key: 'blank',
    label: 'Blank canvas',
    blurb: 'Start from nothing',
    icon: PlusIcon,
    items: [],
  },
];

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
  chime: true,
  autoNext: false,
  reduceMotion: false,
  drawMode: false,
  whiteboard: false,
  drawTool: 'pen',
  drawColor: '#0070f3',
  drawSize: 4,
};
const GRID_SIZES = [16, 24, 32];
const ACCENT_PRESETS = ['#0070f3', '#ffffff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const DRAW_COLORS = ['#0070f3', '#ffffff', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#111827'];
const DRAW_SIZES = [2, 4, 8, 16];

// Turn a list of board-space points into a smooth SVG path.
const pointsToPath = (points) => {
  if (!points || !points.length) return '';
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} l 0.01 0`;
  }
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const control = points[i];
    const next = points[i + 1];
    const midX = (control.x + next.x) / 2;
    const midY = (control.y + next.y) / 2;
    d += ` Q ${control.x.toFixed(2)} ${control.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
};

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
  { key: 'white', label: 'White', cutoff: 12000 },
  { key: 'pink', label: 'Pink', cutoff: 7000 },
  { key: 'brown', label: 'Brown', cutoff: 2600 },
  { key: 'rain', label: 'Rain', cutoff: 5000 },
  { key: 'storm', label: 'Storm', cutoff: 3400 },
  { key: 'ocean', label: 'Ocean', cutoff: 1900 },
  { key: 'wind', label: 'Wind', cutoff: 2400 },
  { key: 'fire', label: 'Embers', cutoff: 2800 },
  { key: 'night', label: 'Night', cutoff: 1500 },
];

const SOUND_SECONDS = 6;

// Synthesise one seamless loop of shaped noise for an ambience preset.
const fillNoise = (data, type, sampleRate) => {
  const length = data.length;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let brown = 0;
  let rumble = 0;
  let pop = 0;
  const tau = Math.PI * 2;

  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    // Pink noise via the Paul Kellet filter bank.
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    // Brown noise.
    brown = (brown + 0.02 * white) / 1.02;
    const t = i / sampleRate;
    let value;

    switch (type) {
      case 'pink':
        value = pink * 1.6;
        break;
      case 'brown':
        value = brown * 3.6;
        break;
      case 'rain':
        value = pink * 0.7 + white * 0.12;
        break;
      case 'storm': {
        // Low rumble plus one soft thunder swell per loop.
        rumble = (rumble + 0.004 * white) / 1.004;
        const boom = Math.max(0, (Math.sin(tau * (t / SOUND_SECONDS) - Math.PI / 2) + 1) / 2 - 0.82) / 0.18;
        value = (pink * 0.55 + white * 0.09) * 0.9 + rumble * 7 * boom;
        break;
      }
      case 'ocean': {
        const swell = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(tau * (t / 3)));
        value = brown * 4 * swell + pink * 0.3 * swell;
        break;
      }
      case 'wind': {
        const gust = 0.5 + 0.5 * Math.sin(tau * (t / 3) + 1);
        value = (pink * 1.1 + brown * 1.8) * (0.35 + 0.65 * gust);
        break;
      }
      case 'fire': {
        if (Math.random() < 0.00008) pop += (Math.random() * 2 - 1) * 0.9;
        pop *= 0.9985;
        value = brown * 2.6 + pink * 0.3 + pop;
        break;
      }
      case 'night': {
        const drift = 0.7 + 0.3 * Math.sin(tau * (t / SOUND_SECONDS));
        value = (brown * 2.3 + pink * 0.4) * drift;
        break;
      }
      case 'white':
      default:
        value = white * 0.7;
        break;
    }

    data[i] = clamp(value, -1, 1);
  }

  // Crossfade the tail into the head so the loop point is inaudible.
  const fade = Math.min(Math.floor(sampleRate * 0.4), Math.floor(length / 4));
  for (let i = 0; i < fade; i += 1) {
    const mix = i / fade;
    const tail = length - fade + i;
    data[tail] = data[tail] * (1 - mix) + data[i] * mix;
  }
};

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
/*  Weather helpers (Open-Meteo — keyless, browser friendly)          */
/* ------------------------------------------------------------------ */

const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: 'sun' },
  1: { label: 'Mainly clear', icon: 'sun' },
  2: { label: 'Partly cloudy', icon: 'cloud' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'cloud' },
  48: { label: 'Rime fog', icon: 'cloud' },
  51: { label: 'Light drizzle', icon: 'rain' },
  53: { label: 'Drizzle', icon: 'rain' },
  55: { label: 'Heavy drizzle', icon: 'rain' },
  56: { label: 'Freezing drizzle', icon: 'rain' },
  57: { label: 'Freezing drizzle', icon: 'rain' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Freezing rain', icon: 'rain' },
  67: { label: 'Freezing rain', icon: 'rain' },
  71: { label: 'Light snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Rain showers', icon: 'rain' },
  81: { label: 'Rain showers', icon: 'rain' },
  82: { label: 'Violent showers', icon: 'rain' },
  85: { label: 'Snow showers', icon: 'snow' },
  86: { label: 'Snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'storm' },
  96: { label: 'Thunderstorm', icon: 'storm' },
  99: { label: 'Thunderstorm', icon: 'storm' },
};

const weatherInfo = (code) => WEATHER_CODES[code] || { label: 'Current', icon: 'cloud' };

const WEATHER_ICONS = { sun: SunIcon, cloud: CloudIcon, rain: RainIcon, snow: SnowIcon, storm: StormIcon };

const addDays = (dateStr, days) => {
  const base = dateStr ? new Date(`${String(dateStr).slice(0, 10)}T00:00:00`) : new Date();
  return new Date(base.getTime() + days * 86400000).toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ */
/*  Widget card                                                       */
/* ------------------------------------------------------------------ */

const CORNERS = ['nw', 'ne', 'sw', 'se'];

function WidgetCard({ widget, focused, mobile, scaleContent, onFocus, onRemove, onDuplicate, onToggleLock, onDragStart, onResizeStart, onMobileResizeStart, children }) {
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

  // Drag from anywhere on the card, as long as the press did not land on a
  // control the user needs to click, type into, or resize from.
  const beginDrag = (event) => {
    if (mobile || widget.locked) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        'button, a, input, textarea, select, label, [contenteditable="true"], .handle, .widget-resize',
      )
    )
      return;
    onDragStart(event);
  };

  const handlePointerDown = (event) => {
    beginLongPress(event);
    beginDrag(event);
  };

  useEffect(() => () => clearTimeout(longPressRef.current), []);

  const cardStyle = mobile
    ? widget.mh
      ? { minHeight: `${widget.mh}px` }
      : undefined
    : { left: `${widget.x}px`, top: `${widget.y}px`, width: `${widget.w}px`, height: `${widget.h}px`, '--ws': `${ws}` };

  // Post-it notes skip the header entirely and look like real paper.
  const isSticky = widget.type === 'sticky';

  const actionButtons = (
    <>
      <button
        type="button"
        className={widget.locked ? 'active' : ''}
        onClick={onToggleLock}
        aria-label={`${widget.locked ? 'Unlock' : 'Lock'} ${widget.title}`}
      >
        {widget.locked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
      </button>
      <button type="button" onClick={onDuplicate} aria-label={`Duplicate ${widget.title}`}>
        <CopyIcon size={14} />
      </button>
      <button type="button" onClick={onRemove} aria-label={`Remove ${widget.title}`}>
        <XIcon size={14} />
      </button>
    </>
  );

  return (
    <section
      className={`widget ${mobile ? 'widget--flow' : ''} ${isSticky ? 'widget--sticky' : ''} ${focused ? 'is-focused' : ''} ${widget.locked ? 'is-locked' : ''}`}
      data-type={widget.type}
      id={`widget-${widget.id}`}
      style={cardStyle}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      onPointerDown={handlePointerDown}
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
      {!isSticky && (
        <header className={`widget-header ${mobile ? 'static' : ''}`}>
          <span className="widget-title">
            <Icon size={15} />
            {widget.title}
          </span>
          <div className="widget-actions" onPointerDown={(event) => event.stopPropagation()}>
            {actionButtons}
          </div>
        </header>
      )}
      <div className="widget-content">
        <div className="widget-scale">{children}</div>
      </div>
      {isSticky && (
        <div className="widget-actions widget-actions--float" onPointerDown={(event) => event.stopPropagation()}>
          {actionButtons}
        </div>
      )}
      {!mobile &&
        !widget.locked &&
        CORNERS.map((corner) => (
          <span
            key={corner}
            className={`handle handle--${corner}`}
            onPointerDown={(event) => onResizeStart(event, corner)}
            aria-hidden="true"
          />
        ))}
      {mobile && !widget.locked && (
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
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);

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
  const [sound, setSound] = useLocalStorageState(KEYS.sound, { type: 'brown', volume: 0.35 });
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [stats, setStats] = useLocalStorageState(KEYS.stats, { day: todayKey(), sessions: 0, focusMinutes: 0 });
  const [todoistToken, setTodoistToken] = useLocalStorageState(KEYS.todoist, '');
  const [todoist, setTodoist] = useState({ tasks: [], projects: [], status: 'idle', error: '' });
  const [todoistFilter, setTodoistFilter] = useState('today');
  const [todoistDraft, setTodoistDraft] = useState('');
  const [todoistTokenDraft, setTodoistTokenDraft] = useState('');
  const [todoistEditing, setTodoistEditing] = useState(false);
  const [todoistBusy, setTodoistBusy] = useState(null);

  const [weatherLocation, setWeatherLocation] = useLocalStorageState(KEYS.weather, { place: '', latitude: null, longitude: null });
  const [weather, setWeather] = useState({ status: 'idle', data: null, error: '' });
  const [weatherQuery, setWeatherQuery] = useState('');
  const [weatherEditing, setWeatherEditing] = useState(false);
  const [weatherBusy, setWeatherBusy] = useState(false);

  const [strokes, setStrokes] = useLocalStorageState(KEYS.draw, []);
  const [strokeDraft, setStrokeDraft] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [newTask, setNewTask] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [linkDraft, setLinkDraft] = useState({ label: '', url: '' });
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [quoteCopied, setQuoteCopied] = useState(false);

  const [timer, setTimer] = useState({ running: false, remaining: 25 * 60, preset: 25 * 60, mode: 'focus', endAt: 0 });
  const [stopwatch, setStopwatch] = useState({ running: false, elapsed: 0, startedAt: 0, base: 0, laps: [] });
  const [pandora, setPandora] = useState({ running: false, remaining: 20 * 60, preset: 20 * 60, endAt: 0 });
  const [breath, setBreath] = useState({ running: false, startedAt: 0 });
  const [pickerState, setPickerState] = useState({});

  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState(DEFAULT_VIEW);
  const [focusedId, setFocusedId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 820,
  );

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

  useEffect(() => {
    if (pandora.running && pandora.remaining === 0) {
      playChime('break');
      setPandora((current) => ({ ...current, running: false, endAt: 0 }));
    }
  }, [pandora, playChime]);

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
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY);
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
        pinchRef.current = { distance: distanceBetween(a, b) };
      }
    };

    const onPointerMove = (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size < 2 || !pinchRef.current) return;
      const [a, b] = pointers.values();
      const nextDistance = distanceBetween(a, b);
      const previous = pinchRef.current.distance;
      if (previous > 0 && nextDistance > 0) {
        zoomAt(nextDistance / previous, (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
      pinchRef.current = { distance: nextDistance };
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
      event.preventDefault();

      const tool = prefs.drawTool;
      const color = prefs.drawColor;
      const size = prefs.drawSize;

      if (tool === 'eraser') {
        const snapshot = strokes;
        let working = strokes;
        const eraseAt = (point) => {
          const radius = size * 2 + 8;
          working = working.filter(
            (stroke) => !stroke.points.some((handle) => Math.hypot(handle.x - point.x, handle.y - point.y) <= radius),
          );
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

      let working = { id: uid('stroke'), tool, color, size, points: [origin] };
      setStrokeDraft(working);
      let aborted = false;
      const move = (moveEvent) => {
        if (pointersRef.current.size >= 2) {
          aborted = true;
          return;
        }
        const point = boardPoint(moveEvent.clientX, moveEvent.clientY);
        if (!point) return;
        const last = working.points[working.points.length - 1];
        if (Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
        working = { ...working, points: [...working.points, point] };
        setStrokeDraft(working);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        setStrokeDraft(null);
        if (aborted) return;
        pushPast(strokes);
        setStrokes((current) => [...current, working]);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      return true;
    },
    [boardPoint, prefs.drawTool, prefs.drawColor, prefs.drawSize, strokes, setStrokes, pushPast],
  );

  const onViewportPointerDown = (event) => {
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
  }, [strokes, pushPast, setStrokes]);

  const exportDrawing = useCallback(() => {
    if (!strokes.length) return;
    const pad = 48;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    strokes.forEach((stroke) =>
      stroke.points.forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }),
    );
    const width = Math.max(1, maxX - minX) + pad * 2;
    const height = Math.max(1, maxY - minY) + pad * 2;
    const background = prefs.theme === 'dark' && !prefs.whiteboard ? '#000000' : '#ffffff';
    const body = strokes
      .map(
        (stroke) =>
          `<path d="${pointsToPath(stroke.points)}" fill="none" stroke="${stroke.color}" stroke-width="${stroke.size}" stroke-linecap="round" stroke-linejoin="round" opacity="${stroke.tool === 'marker' ? 0.4 : 1}" />`,
      )
      .join('');
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height)}" ` +
      `viewBox="${minX - pad} ${minY - pad} ${width} ${height}">` +
      `<rect x="${minX - pad}" y="${minY - pad}" width="${width}" height="${height}" fill="${background}" />${body}</svg>`;
    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const context = canvas.getContext('2d');
      context.scale(scale, scale);
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `focus-canvas-${todayKey()}.png`;
        anchor.click();
        URL.revokeObjectURL(url);
      });
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [strokes, prefs.theme, prefs.whiteboard]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (!prefs.drawMode) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redoDraw();
        else undoDraw();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [prefs.drawMode, undoDraw, redoDraw]);

  /* ------------------------------------------------------------------ */
  /*  Widget mutations                                                  */
  /* ------------------------------------------------------------------ */

  const visibleWidgets = useMemo(() => widgets.filter((widget) => widget.visible), [widgets]);

  // Whiteboard mode clears the widgets off the board, leaving a clean surface to draw on.
  const shownWidgets = useMemo(
    () => (prefs.drawMode && prefs.whiteboard ? [] : visibleWidgets),
    [prefs.drawMode, prefs.whiteboard, visibleWidgets],
  );

  // Small live read-outs shown in the top bar for anything currently running.
  const liveWidgets = useMemo(() => {
    const items = [];
    const find = (type) => visibleWidgets.find((widget) => widget.type === type);
    const timerWidget = find('timer');
    if (timerWidget && timer.running) {
      items.push({ id: timerWidget.id, label: timerWidget.title, icon: TimerIcon, value: formatClock(timer.remaining) });
    }
    const stopwatchWidget = find('stopwatch');
    if (stopwatchWidget && stopwatch.running) {
      items.push({ id: stopwatchWidget.id, label: stopwatchWidget.title, icon: StopwatchIcon, value: formatStopwatch(stopwatch.elapsed) });
    }
    const intervalWidget = find('pandora');
    if (intervalWidget && pandora.running) {
      items.push({ id: intervalWidget.id, label: intervalWidget.title, icon: RepeatIcon, value: formatClock(pandora.remaining) });
    }
    const breathWidget = find('breath');
    if (breathWidget && breath.running) {
      items.push({ id: breathWidget.id, label: breathWidget.title, icon: BreathIcon, value: breathPhase(now - breath.startedAt) });
    }
    const soundWidget = find('sound');
    if (soundWidget && soundPlaying) {
      items.push({ id: soundWidget.id, label: soundWidget.title, icon: HeadphonesIcon, value: 'Ambience' });
    }
    return items;
  }, [
    visibleWidgets,
    timer.running,
    timer.remaining,
    stopwatch.running,
    stopwatch.elapsed,
    pandora.running,
    pandora.remaining,
    breath.running,
    breath.startedAt,
    soundPlaying,
    now,
  ]);

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
    if (!widget || widget.locked) return;
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
      const remaining = current.remaining > 0 ? current.remaining : current.preset;
      return { ...current, running: true, remaining, endAt: Date.now() + remaining * 1000 };
    });
  };

  const resetPandora = () => setPandora((current) => ({ ...current, running: false, endAt: 0, remaining: current.preset }));

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
    },
    [setWidgets],
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
      { id: 'action:clear', group: 'Action', label: 'Clear canvas', icon: TrashIcon, run: () => setWidgets([]) },
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
      { id: 'draw:clear', group: 'Draw', label: 'Clear drawing', icon: TrashIcon, run: clearDrawing },
      { id: 'draw:export', group: 'Draw', label: 'Export drawing as PNG', icon: ImageIcon, run: exportDrawing },
    );
    const query = paletteQuery.trim().toLowerCase();
    if (!query) return commands;
    return commands.filter(
      (command) => command.label.toLowerCase().includes(query) || command.group.toLowerCase().includes(query),
    );
  }, [
    paletteQuery,
    visibleWidgets,
    addWidget,
    applyTemplate,
    focusWidget,
    resetView,
    prefs.theme,
    prefs.drawMode,
    prefs.whiteboard,
    undoDraw,
    redoDraw,
    clearDrawing,
    exportDrawing,
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
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Widget bodies                                                     */
  /* ------------------------------------------------------------------ */

  const renderWidgetBody = (widget) => {
    switch (widget.type) {
      case 'timer': {
        const onBreak = timer.mode === 'break';
        const total = (onBreak ? BREAK_SECONDS : timer.preset) || 1;
        const elapsedPct = Math.min(100, Math.max(0, ((total - timer.remaining) / total) * 100));
        return (
          <div className="widget-body">
            <div className={`timer-mode ${onBreak ? 'break' : 'focus'}`}>
              {onBreak ? 'Break' : 'Focus'}
              {prefs.autoNext ? ' · auto' : ''}
            </div>
            <div className="big-number">{formatClock(timer.remaining)}</div>
            <div className="progress-track timer-track">
              <span style={{ width: `${elapsedPct}%` }} />
            </div>
            <div className="chip-row">
              {[15, 25, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`chip ${!onBreak && timer.preset === minutes * 60 ? 'active' : ''}`}
                  onClick={() => setTimer({ running: false, remaining: minutes * 60, preset: minutes * 60, mode: 'focus', endAt: 0 })}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <div className="action-row">
              <button type="button" className="primary" onClick={toggleTimer}>
                {timer.running ? 'Pause' : 'Start'}
              </button>
              <button type="button" onClick={resetTimer}>
                Reset
              </button>
              <button type="button" onClick={() => switchTimerMode(onBreak ? 'focus' : 'break')}>
                {onBreak ? 'Focus' : 'Break'}
              </button>
            </div>
            <div className="micro-copy">
              {stats.sessions} session{stats.sessions === 1 ? '' : 's'} · {stats.focusMinutes}m focused today
            </div>
          </div>
        );
      }

      case 'stopwatch': {
        const laps = stopwatch.laps || [];
        return (
          <div className="widget-body">
            <div className="big-number">{formatStopwatch(stopwatch.elapsed)}</div>
            <div className="action-row">
              <button type="button" className="primary" onClick={toggleStopwatch}>
                {stopwatch.running ? 'Pause' : 'Start'}
              </button>
              <button type="button" onClick={addLap} disabled={!stopwatch.running || stopwatch.elapsed === 0}>
                Lap
              </button>
              <button type="button" onClick={resetStopwatch}>Reset</button>
            </div>
            {laps.length > 0 && (
              <div className="lap-list scrollable">
                {laps.map((lap, index) => (
                  <div className="lap-row" key={`${lap}-${index}`}>
                    <span>Lap {laps.length - index}</span>
                    <strong>{formatStopwatch(lap - (laps[index + 1] ?? 0))}</strong>
                    <span className="lap-total">{formatStopwatch(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'pandora': {
        const intervalPct = Math.min(100, Math.max(0, ((pandora.preset - pandora.remaining) / (pandora.preset || 1)) * 100));
        return (
          <div className="widget-body">
            <div className="big-number">{formatClock(pandora.remaining)}</div>
            <div className="progress-track timer-track">
              <span style={{ width: `${intervalPct}%` }} />
            </div>
            <div className="chip-row">
              {[10, 20, 50].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`chip ${pandora.preset === minutes * 60 ? 'active' : ''}`}
                  onClick={() => setPandora({ running: false, remaining: minutes * 60, preset: minutes * 60, endAt: 0 })}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <div className="action-row">
              <button type="button" className="primary" onClick={togglePandora}>
                {pandora.running ? 'Pause' : 'Start'}
              </button>
              <button type="button" onClick={resetPandora}>Reset</button>
            </div>
          </div>
        );
      }

      case 'clock': {
        const date = new Date(now);
        return (
          <div className="widget-body clock-body">
            <div className="clock-time">
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !widget.clock24 })}
              <span className="clock-seconds">:{String(date.getSeconds()).padStart(2, '0')}</span>
            </div>
            <div className="clock-date">{date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="clock-greeting">{greeting(date.getHours())}</div>
            <div className="clock-foot">
              <button
                type="button"
                className="chip"
                onClick={() => updateWidget(widget.id, { clock24: !widget.clock24 })}
              >
                {widget.clock24 ? '24-hour' : '12-hour'}
              </button>
            </div>
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
            <div className="action-row">
              <button type="button" onClick={() => setCountdown((current) => ({ ...current, target: addDays(current.target, 7) }))}>
                +1 week
              </button>
              <button type="button" onClick={() => setCountdown((current) => ({ ...current, target: addDays(current.target, 30) }))}>
                +1 month
              </button>
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
            {doneTasks > 0 && (
              <div className="task-foot">
                <span className="micro-copy">{doneTasks} done</span>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setTasks((current) => current.filter((task) => !task.done))}
                >
                  Clear done
                </button>
              </div>
            )}
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

      case 'habits': {
        const todayIndex = (new Date().getDay() + 6) % 7;
        const habitsToday = habits.filter((habit) => habit.days[todayIndex]).length;
        return (
          <div className="widget-body">
            <div className="habit-summary">
              <span>
                <strong>{habitsToday}</strong>/{habits.length} today
              </span>
            </div>
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
      }

      case 'notes': {
        const wordCount = notesText.trim() ? notesText.trim().split(/\s+/).length : 0;
        return (
          <div className="notes-wrap">
            <textarea
              className="notes-area"
              value={notesText}
              onChange={(event) => setNotesText(event.target.value)}
              placeholder="Write something…"
            />
            <div className="notes-foot">
              <span>
                {wordCount} word{wordCount === 1 ? '' : 's'}
              </span>
              <button type="button" className="text-btn" onClick={() => setNotesText('')} disabled={!notesText}>
                Clear
              </button>
            </div>
          </div>
        );
      }

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
              <button
                type="button"
                onClick={() => setWater((current) => ({ ...current, glasses: 0 }))}
                disabled={water.glasses === 0}
                aria-label="Reset glasses"
              >
                <ResetIcon size={14} />
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
            <div className="quote-actions">
              <button
                type="button"
                className="text-btn"
                onClick={() => setQuoteIndex((current) => (current + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length)}
              >
                New quote
              </button>
              <button type="button" className="text-btn" onClick={() => copyQuote(quote)}>
                {quoteCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
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
            <div className="mini-heading">Ambience</div>
            <div className="chip-row sound-presets scrollable">
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
              className={`sound-toggle ${soundPlaying ? 'playing' : ''}`}
              onClick={() => setSoundPlaying((playing) => !playing)}
            >
              <span className="sound-bars" aria-hidden="true">
                <i /><i /><i /><i />
              </span>
              {soundPlaying ? 'Pause ambience' : 'Play ambience'}
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
            <span className="sticky-tape" aria-hidden="true" />
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

      case 'flashcards': {
        const cards = (widget.deck || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [front, ...rest] = line.split('|');
            return { front: (front || '').trim(), back: rest.join('|').trim() };
          });
        const order = widget.order && widget.order.length === cards.length ? widget.order : cards.map((_, position) => position);
        const index = Math.min(widget.cardIndex || 0, Math.max(0, cards.length - 1));
        const card = cards[order[index]];

        if (widget.editing) {
          return (
            <div className="widget-body">
              <div className="mini-heading">One card per line — “front | back”</div>
              <textarea
                className="deck-editor scrollable"
                value={widget.deck || ''}
                onChange={(event) => updateWidget(widget.id, { deck: event.target.value, order: [] })}
                placeholder={'Photosynthesis | How plants make food\n2 + 2 | 4'}
                aria-label="Flashcard deck"
              />
              <div className="action-row">
                <button
                  type="button"
                  className="primary"
                  onClick={() => updateWidget(widget.id, { editing: false, cardIndex: 0, flipped: false, order: [] })}
                >
                  Done
                </button>
              </div>
            </div>
          );
        }

        if (!cards.length) {
          return (
            <div className="widget-body">
              <div className="hint">No cards yet. Add a deck to study.</div>
              <div className="action-row">
                <button type="button" className="primary" onClick={() => updateWidget(widget.id, { editing: true })}>
                  Add cards
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="widget-body">
            <button
              type="button"
              className="flashcard"
              onClick={() => updateWidget(widget.id, { flipped: !widget.flipped })}
            >
              <span className="flashcard-side">{widget.flipped ? 'Back' : 'Front'}</span>
              <span className="flashcard-text">{widget.flipped ? card.back : card.front}</span>
              <span className="flashcard-tap">Tap to flip</span>
            </button>
            <div className="flashcard-foot">
              <button
                type="button"
                className="icon-btn"
                aria-label="Previous card"
                onClick={() => updateWidget(widget.id, { cardIndex: (index - 1 + cards.length) % cards.length, flipped: false })}
              >
                <ChevronLeftIcon size={15} />
              </button>
              <span className="flashcard-count">
                {index + 1} / {cards.length}
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Next card"
                onClick={() => updateWidget(widget.id, { cardIndex: (index + 1) % cards.length, flipped: false })}
              >
                <ChevronRightIcon size={15} />
              </button>
              <button type="button" className="text-btn" onClick={() => shuffleDeck(widget, cards.length)}>
                Shuffle
              </button>
              <button type="button" className="text-btn" onClick={() => updateWidget(widget.id, { editing: true })}>
                Edit deck
              </button>
            </div>
          </div>
        );
      }

      case 'picker': {
        const names = (widget.names || '')
          .split('\n')
          .map((name) => name.trim())
          .filter(Boolean);
        const state = pickerState[widget.id] || { used: [], current: '' };

        if (widget.editing) {
          return (
            <div className="widget-body">
              <div className="mini-heading">One name per line</div>
              <textarea
                className="deck-editor scrollable"
                value={widget.names || ''}
                onChange={(event) => updateWidget(widget.id, { names: event.target.value })}
                placeholder={'Ada\nGrace\nAlan'}
                aria-label="Picker names"
              />
              <div className="action-row">
                <button type="button" className="primary" onClick={() => updateWidget(widget.id, { editing: false })}>
                  Done
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="widget-body picker-body">
            <div className="picker-result">{state.current || '—'}</div>
            <div className="micro-copy">
              {names.length ? `${state.used.length} of ${names.length} picked` : 'No names yet'}
            </div>
            <div className="action-row">
              <button type="button" className="primary" onClick={() => pickRandom(widget)} disabled={!names.length}>
                Pick
              </button>
              <button type="button" onClick={() => resetPicker(widget)} disabled={!state.used.length}>
                Reset
              </button>
              <button type="button" onClick={() => updateWidget(widget.id, { editing: true })}>
                Names
              </button>
            </div>
          </div>
        );
      }

      case 'breath': {
        const cycles = breath.running && breath.startedAt ? Math.floor((now - breath.startedAt) / BREATH_CYCLE) : 0;
        return (
          <div className="widget-body breath-body">
            <div className={`breath-circle ${breath.running ? 'running' : ''}`}>
              <span>{breath.running ? breathPhase(now - breath.startedAt) : 'Ready'}</span>
            </div>
            <div className="micro-copy">
              {breath.running ? `${cycles} cycle${cycles === 1 ? '' : 's'} complete` : 'Box breathing · 4s each'}
            </div>
            <div className="action-row">
              <button
                type="button"
                className="primary"
                onClick={() => setBreath((current) => (current.running ? { running: false, startedAt: 0 } : { running: true, startedAt: Date.now() }))}
              >
                {breath.running ? 'Stop' : 'Begin'}
              </button>
            </div>
          </div>
        );
      }

      case 'weather': {
        const info = weather.data ? weatherInfo(weather.data.current.weather_code) : null;
        const CurrentIcon = info ? WEATHER_ICONS[info.icon] : CloudIcon;

        if (!hasWeatherLocation || weatherEditing) {
          return (
            <div className="widget-body weather-setup">
              <div className="weather-setup-head">
                <CloudIcon size={18} />
                <span>Where are you?</span>
              </div>
              <form className="inline-form" onSubmit={searchWeatherCity}>
                <input
                  type="text"
                  value={weatherQuery}
                  onChange={(event) => setWeatherQuery(event.target.value)}
                  placeholder="City name…"
                  aria-label="City name"
                />
                <button type="submit" className="primary" disabled={!weatherQuery.trim() || weatherBusy}>
                  <PlusIcon size={15} />
                </button>
              </form>
              <button type="button" className="weather-locate" onClick={useMyLocation} disabled={weatherBusy}>
                <FitIcon size={14} />
                Use my location
              </button>
              {weather.error && <div className="weather-error">{weather.error}</div>}
            </div>
          );
        }

        const current = weather.data?.current;
        const daily = weather.data?.daily;
        return (
          <div className="widget-body weather-body">
            {weather.error && <div className="weather-error">{weather.error}</div>}
            {!current && !weather.error && <div className="hint">Loading forecast…</div>}
            {current && (
              <>
                <div className="weather-now">
                  <span className={`weather-glyph weather-glyph--${info.icon}`}>
                    <CurrentIcon size={40} />
                  </span>
                  <div className="weather-readout">
                    <strong>{Math.round(current.temperature_2m)}°</strong>
                    <span>{info.label}</span>
                  </div>
                </div>
                <div className="weather-place">{weatherLocation.place}</div>
                <div className="weather-meta">
                  <span>Feels {Math.round(current.apparent_temperature)}°</span>
                  <span>{current.relative_humidity_2m}% humidity</span>
                  <span>{Math.round(current.wind_speed_10m)} km/h</span>
                </div>
                {daily && (
                  <div className="weather-days">
                    {daily.time.slice(1, 4).map((day, dayIndex) => {
                      const dayInfo = weatherInfo(daily.weather_code[dayIndex + 1]);
                      const DayIcon = WEATHER_ICONS[dayInfo.icon];
                      return (
                        <div className="weather-day" key={day}>
                          <span>{new Date(`${day}T00:00:00`).toLocaleDateString([], { weekday: 'short' })}</span>
                          <DayIcon size={15} />
                          <span className="weather-day-temps">
                            {Math.round(daily.temperature_2m_max[dayIndex + 1])}° / {Math.round(daily.temperature_2m_min[dayIndex + 1])}°
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="weather-foot">
                  <button type="button" className="text-btn" onClick={loadWeather} disabled={weather.status === 'loading'}>
                    <RefreshIcon size={13} />
                    Refresh
                  </button>
                  <button type="button" className="text-btn" onClick={() => setWeatherEditing(true)}>
                    Change city
                  </button>
                </div>
              </>
            )}
          </div>
        );
      }

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

      case 'iframe': {
        const src = widget.src || '';
        const embeddable = VALID_PROTOCOL.test(src);
        return (
          <div className="widget-body iframe-body">
            <form
              className="inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                const next = normalizeUrl(widget.url || '');
                if (next) updateWidget(widget.id, { src: next });
              }}
            >
              <input
                type="text"
                value={widget.url || ''}
                onChange={(event) => updateWidget(widget.id, { url: event.target.value })}
                placeholder="Paste a link to embed…"
                aria-label="Embed URL"
              />
              <button type="submit" className="primary" disabled={!normalizeUrl(widget.url || '')}>
                <FrameIcon size={15} />
              </button>
            </form>
            {embeddable ? (
              <>
                <div className="iframe-frame">
                  <iframe
                    key={widget.reload || 0}
                    src={src}
                    title={widget.title || 'Embedded page'}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div className="iframe-foot">
                  <span className="iframe-url" title={src}>
                    {src}
                  </span>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => updateWidget(widget.id, { reload: (widget.reload || 0) + 1 })}
                  >
                    <RefreshIcon size={13} /> Reload
                  </button>
                  <a className="text-btn" href={src} target="_blank" rel="noreferrer noopener">
                    <ExternalIcon size={13} /> Open
                  </a>
                </div>
              </>
            ) : (
              <div className="hint">
                Paste a YouTube, Docs, or any site URL. Some pages block embedding — open them in a new tab if the frame
                stays blank.
              </div>
            )}
          </div>
        );
      }

      default:
        return <div className="hint">Unknown widget</div>;
    }
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

  const ThemeIcon = prefs.theme === 'dark' ? SunIcon : MoonIcon;

  return (
    <div
      className="app-shell"
      data-theme={prefs.theme}
      data-motion={prefs.reduceMotion ? 'reduced' : 'full'}
      style={{ '--accent': prefs.accent }}
    >
      <header className="topbar">
        <div className={`topbar-live ${liveWidgets.length ? 'is-live' : ''}`}>
          <span className="topbar-live-label">
            <span className="live-dot" aria-hidden="true" />
            Live
          </span>
          {liveWidgets.length === 0 && <span className="topbar-live-empty">Nothing running</span>}
          {liveWidgets.map((item) => {
            const LiveIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="live-chip"
                title={item.label}
                onClick={() => {
                  const target = widgets.find((widget) => widget.id === item.id);
                  if (target) focusWidget(target);
                }}
              >
                <LiveIcon size={13} />
                <span>{item.value}</span>
              </button>
            );
          })}
        </div>
        <div className="topbar-actions">
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
              onMobileResizeStart={(event) => startMobileResize(event, widget.id)}
            >
              {renderWidgetBody(widget)}
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
                onFocus={() => setFocusedId(widget.id)}
                onRemove={() => removeWidget(widget.id)}
                onDuplicate={() => duplicateWidget(widget.id)}
                onToggleLock={() => toggleLock(widget.id)}
                onDragStart={(event) => startDrag(event, widget.id)}
                onResizeStart={(event, corner) => startResize(event, widget.id, corner)}
              >
                {renderWidgetBody(widget)}
              </WidgetCard>
            ))}
            <svg className="draw-layer" aria-hidden="true">
              {[...strokes, ...(strokeDraft ? [strokeDraft] : [])].map((stroke) => (
                <path
                  key={stroke.id}
                  d={pointsToPath(stroke.points)}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth={stroke.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={stroke.tool === 'marker' ? 0.4 : 1}
                />
              ))}
            </svg>
          </div>

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

      {!prefs.whiteboard && (
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
      )}

      {prefs.drawMode && !isMobile && (
        <div className="draw-toolbar" role="toolbar" aria-label="Drawing tools">
          <div className="draw-group">
            {[
              { key: 'pen', label: 'Pen', icon: PenIcon },
              { key: 'marker', label: 'Highlighter', icon: HighlighterIcon },
              { key: 'eraser', label: 'Eraser', icon: EraserIcon },
              { key: 'pan', label: 'Pan board', icon: HandIcon },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`draw-btn ${prefs.drawTool === item.key ? 'active' : ''}`}
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => setSettings((current) => ({ ...current, drawTool: item.key }))}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
          {prefs.drawTool !== 'eraser' && prefs.drawTool !== 'pan' && (
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
          <span className="draw-divider" />
          <div className="draw-group">
            <button type="button" className="draw-btn" title="Undo" aria-label="Undo stroke" onClick={undoDraw} disabled={!past.length}>
              <UndoIcon size={16} />
            </button>
            <button type="button" className="draw-btn" title="Redo" aria-label="Redo stroke" onClick={redoDraw} disabled={!future.length}>
              <RedoIcon size={16} />
            </button>
            <button type="button" className="draw-btn" title="Clear drawing" aria-label="Clear drawing" onClick={clearDrawing} disabled={!strokes.length}>
              <TrashIcon size={16} />
            </button>
            <button type="button" className="draw-btn" title="Export as PNG" aria-label="Export drawing" onClick={exportDrawing} disabled={!strokes.length}>
              <ImageIcon size={16} />
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
          <div className="micro-copy">
            Draw over your widgets, or switch to a clean whiteboard. Pen, highlighter and eraser with undo, redo, and PNG
            export. Stored in this browser.
          </div>
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
    </div>
  );
}

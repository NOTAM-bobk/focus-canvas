// Widget catalog, starter templates, and static defaults.
import {
  ArrowIcon,
  BreathIcon,
  CalendarIcon,
  ChartIcon,
  CheckSquareIcon,
  CircleShapeIcon,
  ClockIcon,
  CloudIcon,
  DiceIcon,
  DropletIcon,
  EraserIcon,
  FlashcardIcon,
  FrameIcon,
  HandIcon,
  HeadphonesIcon,
  HighlighterIcon,
  LineIcon,
  LinkIcon,
  MoveIcon,
  NoteIcon,
  PenIcon,
  PlusIcon,
  QuoteIcon,
  RectangleIcon,
  RepeatIcon,
  SlidersIcon,
  SproutIcon,
  StickyIcon,
  StopwatchIcon,
  TextToolIcon,
  TimerIcon,
  TodoistIcon,
} from '../icons';
import { KEYS } from '../constants';
import { readState, uid } from '../lib/utils';

// Widgets grouped by what they are for, so the bottom bar can stay short.
export const WIDGET_CATEGORIES = [
  { key: 'focus', label: 'Focus', icon: TimerIcon, blurb: 'Run a session' },
  { key: 'plan', label: 'Plan', icon: CheckSquareIcon, blurb: 'Track what is next' },
  { key: 'capture', label: 'Capture', icon: NoteIcon, blurb: 'Write it down' },
  { key: 'insights', label: 'Insights', icon: ChartIcon, blurb: 'Glance and check' },
  { key: 'tools', label: 'Tools', icon: SlidersIcon, blurb: 'Everything else' },
];

export const WIDGET_CATALOG = [
  { key: 'timer', label: 'Focus', icon: TimerIcon, category: 'focus', w: 260, h: 200 },
  { key: 'stopwatch', label: 'Stopwatch', icon: StopwatchIcon, category: 'focus', w: 230, h: 180 },
  { key: 'pandora', label: 'Interval', icon: RepeatIcon, category: 'focus', w: 250, h: 200 },
  { key: 'breath', label: 'Breathe', icon: BreathIcon, category: 'focus', w: 240, h: 270 },
  { key: 'tasks', label: 'Tasks', icon: CheckSquareIcon, category: 'plan', w: 310, h: 250 },
  { key: 'habits', label: 'Habits', icon: SproutIcon, category: 'plan', w: 340, h: 245 },
  { key: 'countdown', label: 'Countdown', icon: CalendarIcon, category: 'plan', w: 280, h: 200 },
  { key: 'todoist', label: 'Todoist', icon: TodoistIcon, category: 'plan', w: 340, h: 320 },
  { key: 'notes', label: 'Notes', icon: NoteIcon, category: 'capture', w: 330, h: 230 },
  { key: 'sticky', label: 'Post-it', icon: StickyIcon, category: 'capture', w: 250, h: 250 },
  { key: 'flashcards', label: 'Flashcards', icon: FlashcardIcon, category: 'capture', w: 300, h: 250 },
  { key: 'clock', label: 'Clock', icon: ClockIcon, category: 'insights', w: 250, h: 170 },
  { key: 'stats', label: 'Today', icon: ChartIcon, category: 'insights', w: 300, h: 220 },
  { key: 'weather', label: 'Weather', icon: CloudIcon, category: 'insights', w: 300, h: 290 },
  { key: 'quote', label: 'Quote', icon: QuoteIcon, category: 'insights', w: 340, h: 195 },
  { key: 'water', label: 'Water', icon: DropletIcon, category: 'tools', w: 250, h: 215 },
  { key: 'links', label: 'Links', icon: LinkIcon, category: 'tools', w: 270, h: 220 },
  { key: 'sound', label: 'Sound', icon: HeadphonesIcon, category: 'tools', w: 300, h: 270 },
  { key: 'picker', label: 'Picker', icon: DiceIcon, category: 'tools', w: 260, h: 220 },
  { key: 'iframe', label: 'Embed', icon: FrameIcon, category: 'tools', w: 420, h: 320 },
];

export const CATALOG_MAP = Object.fromEntries(WIDGET_CATALOG.map((item) => [item.key, item]));
export const CATEGORY_MAP = Object.fromEntries(WIDGET_CATEGORIES.map((item) => [item.key, item]));

// Comfortable starting sizes so a freshly added widget shows all of its content
// without scrolling or clipping. Resizing still reflows from here.
export const CONTENT_SIZE = {
  timer: { w: 280, h: 230 },
  stopwatch: { w: 250, h: 210 },
  pandora: { w: 300, h: 340 },
  breath: { w: 250, h: 290 },
  tasks: { w: 330, h: 300 },
  habits: { w: 360, h: 280 },
  countdown: { w: 300, h: 250 },
  todoist: { w: 360, h: 420 },
  notes: { w: 350, h: 280 },
  sticky: { w: 250, h: 250 },
  flashcards: { w: 320, h: 300 },
  clock: { w: 260, h: 190 },
  stats: { w: 310, h: 240 },
  weather: { w: 320, h: 340 },
  quote: { w: 350, h: 215 },
  water: { w: 260, h: 240 },
  links: { w: 290, h: 250 },
  sound: { w: 320, h: 300 },
  picker: { w: 280, h: 250 },
  iframe: { w: 460, h: 360 },
};

export const widgetSize = (type) => CONTENT_SIZE[type] || CATALOG_MAP[type] || { w: 260, h: 200 };

export const STICKY_COLORS = ['#f7d64c', '#ffa07a', '#8fd3ff', '#9ae6b4', '#d9b8ff'];

export const WS_COLORS = ['#0070f3', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#64748b'];

export const GRID_SIZES = [16, 24, 32];
export const ACCENT_PRESETS = ['#0070f3', '#ffffff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
export const DRAW_COLORS = ['#0070f3', '#ffffff', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#111827'];
export const DRAW_SIZES = [2, 4, 8, 16];

// `shortcut` keys are single keystrokes while drawing.
export const DRAW_TOOLS = [
  { key: 'pen', label: 'Pen', icon: PenIcon, shortcut: 'p' },
  { key: 'marker', label: 'Highlighter', icon: HighlighterIcon, shortcut: 'm' },
  { key: 'line', label: 'Line', icon: LineIcon, shortcut: 'l' },
  { key: 'arrow', label: 'Arrow', icon: ArrowIcon, shortcut: 'a' },
  { key: 'rect', label: 'Rectangle', icon: RectangleIcon, shortcut: 'r' },
  { key: 'ellipse', label: 'Ellipse', icon: CircleShapeIcon, shortcut: 'o' },
  { key: 'text', label: 'Text', icon: TextToolIcon, shortcut: 't' },
  { key: 'eraser', label: 'Eraser', icon: EraserIcon, shortcut: 'e' },
  { key: 'select', label: 'Select & move', icon: MoveIcon, shortcut: 'v' },
  { key: 'pan', label: 'Pan board', icon: HandIcon, shortcut: 'h' },
];

export const QUOTES = [
  { text: 'Focus is the art of knowing what to ignore.', author: 'James Clear' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'The successful warrior is the average person with laser-like focus.', author: 'Bruce Lee' },
  { text: 'Starve your distractions, feed your focus.', author: 'Unknown' },
  { text: 'Concentrate all your thoughts upon the work at hand.', author: 'Alexander Graham Bell' },
  { text: 'Amateurs sit and wait for inspiration. The rest of us just get up and go to work.', author: 'Stephen King' },
  { text: 'It is not the daily increase but the daily decrease. Hack away at the unessential.', author: 'Bruce Lee' },
  { text: 'Little by little, a little becomes a lot.', author: 'Tanzanian proverb' },
];

export const DEFAULT_TASKS = [
  { id: uid('task'), text: 'Block out your top priority', done: false },
  { id: uid('task'), text: 'Clear the inbox before the next cycle', done: false },
  { id: uid('task'), text: 'Take a real, screen-free break', done: false },
];

export const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const DEFAULT_HABITS = [
  { id: uid('habit'), name: 'Deep work', days: new Array(7).fill(false) },
  { id: uid('habit'), name: 'Move your body', days: new Array(7).fill(false) },
  { id: uid('habit'), name: 'Read 20 minutes', days: new Array(7).fill(false) },
];

export const DEFAULT_LINKS = [
  { id: uid('link'), label: 'Gmail', url: 'https://mail.google.com' },
  { id: uid('link'), label: 'Calendar', url: 'https://calendar.google.com' },
  { id: uid('link'), label: 'GitHub', url: 'https://github.com' },
];

export const SOUND_TYPES = [
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

export const CORNERS = ['nw', 'ne', 'sw', 'se'];

export const makeWorkspace = (name, color, widgets = [], strokes = []) => ({
  id: uid('ws'),
  name,
  color,
  widgets,
  strokes,
});

// Seed the first workspace from a board saved before workspaces existed.
export const seedWorkspaces = () => {
  const existingWidgets = readState(KEYS.widgets, []);
  const existingStrokes = readState(KEYS.draw, []);
  return [
    makeWorkspace(
      'Home',
      '#0070f3',
      Array.isArray(existingWidgets) ? existingWidgets : [],
      Array.isArray(existingStrokes) ? existingStrokes : [],
    ),
  ];
};

export const createWidget = (type, overrides = {}) => {
  const meta = CATALOG_MAP[type];
  const size = widgetSize(type);
  return {
    id: uid(type),
    type,
    title: meta ? meta.label : type,
    visible: true,
    x: 120,
    y: 120,
    w: size.w,
    h: size.h,
    ...(type === 'sticky' ? { text: '', color: STICKY_COLORS[0] } : {}),
    ...(type === 'flashcards' ? { deck: '', cardIndex: 0, flipped: false, editing: false, order: [] } : {}),
    ...(type === 'picker' ? { names: '', editing: false } : {}),
    ...(type === 'clock' ? { clock24: false } : {}),
    ...(type === 'iframe' ? { url: '', src: '', reload: 0 } : {}),
    ...overrides,
  };
};

/* Starter boards for students and teachers. Positions use catalog sizes. */
export const TEMPLATES = [
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

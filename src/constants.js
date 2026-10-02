// App-wide constants and the default preference set.

export const KEYS = {
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
  workspaces: 'focus-canvas-workspaces-v3',
  activeWorkspace: 'focus-canvas-active-workspace-v3',
};

export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 3;
export const DEFAULT_VIEW = { scale: 1, x: 60, y: 60 };
export const TODOIST_API = 'https://api.todoist.com/api/v1';
export const BREAK_SECONDS = 5 * 60;
export const BREATH_CYCLE = 16000;

export const defaultSettings = {
  theme: 'dark',
  accent: '#0070f3',
  grid: true,
  gridStyle: 'dots',
  gridSize: 24,
  snap: false,
  snapGuides: true,
  scaleContent: true,
  zoomHud: true,
  fullscreenWidget: null,
  hiddenPalette: [],
  barOpen: true,
  chime: true,
  autoNext: false,
  reduceMotion: false,
  drawMode: false,
  whiteboard: false,
  drawFill: false,
};

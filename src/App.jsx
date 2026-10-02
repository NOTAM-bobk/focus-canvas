import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'focus-canvas-settings-v1';
const WIDGETS_KEY = 'focus-canvas-widgets-v1';
const NOTES_KEY = 'focus-canvas-notes-v1';

const defaultSettings = {
  accent: '#8b5cf6',
  background: '#0f1220',
  panel: '#171d2c',
  grid: true,
  compact: false,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatClock = (totalSeconds) => {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const createWidget = (type, overrides = {}) => {
  const common = {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    visible: true,
    x: 32,
    y: 32,
    w: 260,
    h: 190,
  };

  const presets = {
    timer: { ...common, type, title: 'Focus timer', x: 40, y: 42, w: 250, h: 185 },
    stopwatch: { ...common, type, title: 'Stopwatch', x: 330, y: 72, w: 220, h: 170 },
    notes: { ...common, type, title: 'Notes', x: 600, y: 74, w: 320, h: 220 },
    pandora: { ...common, type, title: 'Pandora timer', x: 270, y: 330, w: 255, h: 175 },
    tasks: { ...common, type, title: 'Focus list', x: 560, y: 330, w: 275, h: 200 },
  };

  return {
    ...presets[type],
    ...overrides,
  };
};

const initialWidgets = [
  createWidget('timer'),
  createWidget('notes', { x: 340, y: 80, w: 370, h: 250 }),
  createWidget('stopwatch', { x: 100, y: 350, w: 230, h: 190 }),
  createWidget('pandora', { x: 470, y: 345, w: 260, h: 180 }),
  createWidget('tasks', { x: 760, y: 210, w: 280, h: 220 }),
];

const widgetTypes = [
  { key: 'timer', label: 'Timer' },
  { key: 'stopwatch', label: 'Stopwatch' },
  { key: 'notes', label: 'Notes' },
  { key: 'pandora', label: 'Pandora' },
  { key: 'tasks', label: 'Tasks' },
];

const defaultTasks = [
  'Block out your top priority',
  'Clear the inbox before the next cycle',
  'Batch small admin tasks',
  'Finish the next milestone',
];

export default function App() {
  const canvasRef = useRef(null);

  const [settings, setSettings] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  });

  const [widgets, setWidgets] = useState(() => {
    const raw = localStorage.getItem(WIDGETS_KEY);
    return raw ? JSON.parse(raw) : initialWidgets;
  });

  const [notesText, setNotesText] = useState(() => localStorage.getItem(NOTES_KEY) || '');
  const [tasks, setTasks] = useState(defaultTasks);

  const [timer, setTimer] = useState({ running: false, remaining: 25 * 60, preset: 25 * 60 });
  const [stopwatch, setStopwatch] = useState({ running: false, elapsed: 0 });
  const [pandora, setPandora] = useState({ running: false, remaining: 25 * 60, preset: 25 * 60 });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, notesText);
  }, [notesText]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((current) =>
        current.running
          ? { ...current, remaining: Math.max(0, current.remaining - 1) }
          : current,
      );

      setStopwatch((current) =>
        current.running ? { ...current, elapsed: current.elapsed + 1 } : current,
      );

      setPandora((current) =>
        current.running
          ? { ...current, remaining: Math.max(0, current.remaining - 1) }
          : current,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer.running && timer.remaining <= 0) {
      setTimer((current) => ({ ...current, running: false }));
    }
  }, [timer]);

  useEffect(() => {
    if (pandora.running && pandora.remaining <= 0) {
      setPandora((current) => ({ ...current, running: false }));
    }
  }, [pandora]);

  const widgetMap = useMemo(
    () => Object.fromEntries(widgets.filter((widget) => widget.visible).map((widget) => [widget.id, widget])),
    [widgets],
  );

  const addWidget = (type) => {
    const newWidget = createWidget(type, {
      x: 60 + widgets.length * 18,
      y: 60 + widgets.length * 16,
      w: "timer" === type ? 250 : "notes" === type ? 340 : 220,
      h: "timer" === type ? 185 : "notes" === type ? 220 : 180,
    });
    setWidgets((current) => [...current, newWidget]);
  };

  const removeWidget = (id) => {
    setWidgets((current) => current.filter((widget) => widget.id !== id));
  };

  const updateWidget = (id, changes) => {
    setWidgets((current) =>
      current.map((widget) => (widget.id === id ? { ...widget, ...changes } : widget)),
    );
  };

  const renderWidgetBody = (type) => {
    switch (type) {
      case 'timer':
        return (
          <div className="widget-body compact"> 
            <div className="big-number">{formatClock(timer.remaining)}</div>
            <div className="chip-row">
              {[15, 25, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  className={`chip ${timer.preset === minutes * 60 ? 'active' : ''}`}
                  onClick={() => setTimer({ running: false, remaining: minutes * 60, preset: minutes * 60 })}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <div className="action-row">
              <button className="primary" onClick={() => setTimer((current) => ({ ...current, running: !current.running }))}> 
                {timer.running ? 'Pause' : 'Start'}
              </button>
              <button onClick={() => setTimer({ running: false, remaining: timer.preset, preset: timer.preset })}>Reset</button>
            </div>
          </div>
        );
      case 'stopwatch':
        return (
          <div className="widget-body compact">
            <div className="big-number">{formatClock(stopwatch.elapsed)}</div>
            <div className="action-row">
              <button className="primary" onClick={() => setStopwatch((current) => ({ ...current, running: !current.running }))}>
                {stopwatch.running ? 'Pause' : 'Start'}
              </button>
              <button onClick={() => setStopwatch({ running: false, elapsed: 0 })}>Reset</button>
            </div>
          </div>
        );
      case 'pandora':
        return (
          <div className="widget-body compact">
            <div className="big-number">{formatClock(pandora.remaining)}</div>
            <div className="chip-row">
              {[15, 25, 50].map((minutes) => (
                <button
                  key={minutes}
                  className={`chip ${pandora.preset === minutes * 60 ? 'active' : ''}`}
                  onClick={() => setPandora({ running: false, remaining: minutes * 60, preset: minutes * 60 })}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <div className="action-row">
              <button className="primary" onClick={() => setPandora((current) => ({ ...current, running: !current.running }))}>
                {pandora.running ? 'Pause' : 'Start'}
              </button>
              <button onClick={() => setPandora({ running: false, remaining: pandora.preset, preset: pandora.preset })}>Reset</button>
            </div>
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
      case 'tasks':
        return (
          <div className="task-list">
            {tasks.map((task, index) => (
              <label className="task-item" key={`${task}-${index}`}>
                <input type="checkbox" defaultChecked={index < 2} />
                <span>{task}</span>
              </label>
            ))}
            <button className="hyperlink" onClick={() => setTasks((current) => [...current, `New focus task ${current.length + 1}`])}>
              + Add task
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleDragStart = (event, widgetId) => {
    const widget = widgetMap[widgetId];
    if (!widget || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pointerStartX = event.clientX;
    const pointerStartY = event.clientY;
    const originX = widget.x;
    const originY = widget.y;

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - pointerStartX;
      const deltaY = moveEvent.clientY - pointerStartY;

      updateWidget(widgetId, {
        x: clamp(originX + deltaX, 12, rect.width - widget.w - 12),
        y: clamp(originY + deltaY, 12, rect.height - widget.h - 12),
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleResizeStart = (event, widgetId) => {
    const widget = widgetMap[widgetId];
    if (!widget || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pointerStartX = event.clientX;
    const pointerStartY = event.clientY;
    const originW = widget.w;
    const originH = widget.h;

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - pointerStartX;
      const deltaY = moveEvent.clientY - pointerStartY;

      updateWidget(widgetId, {
        w: clamp(originW + deltaX, 180, rect.width - widget.x - 24),
        h: clamp(originH + deltaY, 120, rect.height - widget.y - 24),
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      className="app-shell"
      style={{
        '--accent': settings.accent,
        '--background': settings.background,
        '--panel': settings.panel,
      }}
    >
      <div className={`canvas-shell ${settings.grid ? 'grid-enabled' : ''}`} ref={canvasRef}>
        {widgets.filter((widget) => widget.visible).map((widget) => (
          <div
            key={widget.id}
            className="widget"
            style={{ left: `${widget.x}px`, top: `${widget.y}px`, width: `${widget.w}px`, height: `${widget.h}px` }}
          >
            <div className="widget-header" onPointerDown={(event) => handleDragStart(event, widget.id)}>
              <span>{widget.title}</span>
              <div className="widget-actions">
                <button onClick={() => removeWidget(widget.id)} aria-label={`Remove ${widget.title}`}>
                  ×
                </button>
              </div>
            </div>
            <div className="widget-content">{renderWidgetBody(widget.type)}</div>
            <div className="resize-hitbox" onPointerDown={(event) => handleResizeStart(event, widget.id)} />
          </div>
        ))}
      </div>

      <div className="bottom-dock">
        <div className="dock-chip">
          <span className="label">Timer</span>
          <strong>{formatClock(timer.remaining)}</strong>
          <button onClick={() => setTimer((current) => ({ ...current, running: !current.running }))}>{timer.running ? 'Pause' : 'Start'}</button>
        </div>

        <div className="dock-chip">
          <span className="label">Stopwatch</span>
          <strong>{formatClock(stopwatch.elapsed)}</strong>
          <button onClick={() => setStopwatch((current) => ({ ...current, running: !current.running }))}>{stopwatch.running ? 'Pause' : 'Start'}</button>
        </div>

        <div className="dock-chip">
          <span className="label">Pandora</span>
          <strong>{formatClock(pandora.remaining)}</strong>
          <button onClick={() => setPandora((current) => ({ ...current, running: !current.running }))}>{pandora.running ? 'Pause' : 'Start'}</button>
        </div>

        <div className="dock-actions">
          {widgetTypes.map((type) => (
            <button key={type.key} onClick={() => addWidget(type.key)}>
              {type.label}
            </button>
          ))}
          <button className="primary" onClick={() => setSettings((current) => ({ ...current, compact: !current.compact }))}>Customize</button>
        </div>
      </div>

      <aside className={`settings-panel ${settings.compact ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>Canvas settings</h3>
          <button onClick={() => setSettings((current) => ({ ...current, compact: !current.compact }))}>Close</button>
        </div>

        <label>
          Accent color
          <input
            type="color"
            value={settings.accent}
            onChange={(event) => setSettings((current) => ({ ...current, accent: event.target.value }))}
          />
        </label>

        <label>
          Canvas background
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
      </aside>
    </div>
  );
}

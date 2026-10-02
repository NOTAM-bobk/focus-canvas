// Per-widget body renderer. App state and handlers arrive as a single `app`
// object so the body stays a plain function (no hooks, no prop drilling).
import {
  CheckSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudIcon,
  ExternalIcon,
  FitIcon,
  FrameIcon,
  LinkIcon,
  MinusIcon,
  PlusIcon,
  QuoteIcon,
  RefreshIcon,
  ResetIcon,
  SlidersIcon,
  XIcon,
} from '../icons';
import { BREAK_SECONDS, BREATH_CYCLE } from '../constants';
import {
  DAY_LABELS,
  QUOTES,
  SOUND_TYPES,
  STICKY_COLORS,
} from '../data/catalog';
import {
  addDays,
  breathPhase,
  countdownParts,
  formatClock,
  formatStopwatch,
  greeting,
  normalizeUrl,
  temp,
  VALID_PROTOCOL,
} from '../lib/utils';
import { dayDiff, dueLabel } from '../lib/todoist';
import { WEATHER_ICONS, weatherInfo } from '../lib/weather';

export default function renderWidgetBody(widget, app) {
  const {
    timer, setTimer, toggleTimer, resetTimer, switchTimerMode,
    stats,
    stopwatch, toggleStopwatch, addLap, resetStopwatch,
    pandora, setPandora, togglePandora, resetPandora,
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
    addTodoistTask, todoistDraft, setTodoistDraft,
  } = app;

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
      // Full-bleed like the post-it: the page fills the widget and the
      // word count floats in the corner until you hover or focus.
      return (
        <div className="notes-wrap notes-wrap--full">
          <textarea
            className="notes-area notes-area--full"
            value={notesText}
            onChange={(event) => setNotesText(event.target.value)}
            placeholder="Write something…"
            spellCheck={false}
          />
          <div className="notes-float">
            <span className="notes-count">
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
      const unit = unitFor(widget);

      // A C°/F° switch that keeps its own value on this widget.
      const unitSwitch = (
        <div className="unit-switch" role="group" aria-label="Temperature unit">
          {[
            { key: 'c', label: '°C' },
            { key: 'f', label: '°F' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              className={`unit-option ${unit === option.key ? 'active' : ''}`}
              aria-pressed={unit === option.key}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                updateWidget(widget.id, { unit: option.key });
                setUnit(option.key);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      );

      if (!hasWeatherLocation || weatherEditing) {
        return (
          <div className="widget-body weather-setup">
            <div className="weather-setup-head">
              <CloudIcon size={18} />
              <span>Where are you?</span>
              {unitSwitch}
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
                  <strong>{temp(current.temperature_2m, unit)}</strong>
                  <span>{info.label}</span>
                </div>
              </div>
              <div className="weather-place-row">
                <span className="weather-place">{weatherLocation.place}</span>
                {unitSwitch}
              </div>
              <div className="weather-meta">
                <span>Feels {temp(current.apparent_temperature, unit)}</span>
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
                          {temp(daily.temperature_2m_max[dayIndex + 1], unit)} / {temp(daily.temperature_2m_min[dayIndex + 1], unit)}
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

      // A working embed becomes a full widget: no setup bar, no link footer.
      if (embeddable) {
        return (
          <div className="widget-body iframe-body iframe-body--live">
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
            <div className="iframe-tools" onPointerDown={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="iframe-tool"
                title={`Reload ${src}`}
                aria-label="Reload embed"
                onClick={() => updateWidget(widget.id, { reload: (widget.reload || 0) + 1 })}
              >
                <RefreshIcon size={14} />
              </button>
              <a className="iframe-tool" href={src} target="_blank" rel="noreferrer noopener" title={`Open ${src}`}>
                <ExternalIcon size={14} />
              </a>
              <button
                type="button"
                className="iframe-tool"
                title="Change the embed URL"
                aria-label="Change embed URL"
                onClick={() => updateWidget(widget.id, { src: '', url: src })}
              >
                <FrameIcon size={14} />
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="widget-body iframe-body iframe-setup">
          <span className="iframe-setup-icon" aria-hidden="true">
            <FrameIcon size={22} />
          </span>
          <strong className="iframe-setup-title">Embed a page</strong>
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
          <div className="micro-copy">
            YouTube, Docs, slides — most pages can be framed. Some sites block it; open them in a new tab instead.
          </div>
        </div>
      );
    }

    default:
      return <div className="hint">Unknown widget</div>;
  }
}

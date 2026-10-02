# focus-canvas

A minimalist, Vercel-styled focus whiteboard for students and teachers. Start from a template or a blank canvas, drop in widgets from the toolbar, then drag, resize, zoom, and pan your board like a whiteboard.

## How it works

- **Templates** — the empty canvas offers starter boards (Deep Work, Study Session, Class Planner, Morning Routine, Lesson Board) that lay out a useful set of widgets in one click, plus a blank option.
- **Command palette** — press `Ctrl`/`Cmd` + `K` (or the ⌘ button in the header) to add widgets, apply templates, jump to a widget on the canvas, or run quick actions.
- **Lock widgets** — use the padlock in a widget header to freeze its position and size so it can't be moved by accident.
- **Empty by default** — the canvas starts blank. Add anything from the toolbar at the bottom.
- **Infinite canvas** — pan in any direction forever; the dot/line grid scrolls and zooms with you.
- **Whiteboard navigation** — drag the empty canvas to pan, use the zoom controls (or `Ctrl`/`Cmd` + scroll) to zoom in and out, or pinch with two fingers on a touch screen. Click the canvas to deselect.
- **Draw on the board** — hit the pen in the header to annotate right over your widgets. Pen, highlighter and eraser, a colour palette and four stroke widths, plus undo, redo, clear, and PNG export. Strokes are saved in the browser alongside everything else. (`Ctrl`/`Cmd` + `Z` undoes, `Shift` + `Ctrl`/`Cmd` + `Z` redoes.)
- **Whiteboard mode** — toggle *Whiteboard* in the draw toolbar and the widgets slide away, leaving a clean, pannable, zoomable surface for lesson notes, diagrams, and worked examples.
- **Live tray** — anything currently running (focus timer, stopwatch, interval, breathing, ambience) shows a small live read-out in the top bar. Click a chip to jump to that widget.
- **Widgets** — drag a widget by anywhere on its card (buttons and inputs still work), and resize from any of its four corners within sensible limits. Contents scale up and down with the widget. Lock, duplicate, or remove from the header actions. Each widget carries its own accent color.
- **Focus sessions** — the timer has Focus and Break modes. Enable *Auto-start next session* to cycle between them automatically and *Focus chime* to hear a two-note tone when a session ends. Timers are timestamp-based, so they stay accurate in background tabs.

## Widgets

- Focus timer, interval timer, and stopwatch
- Task list with progress, weekly habit tracker, event countdown
- Hydration tracker, inspiration quotes, ambient soundscape (white / pink / brown / rain / storm / ocean / wind / embers / night — each a seamless, crossfaded loop that fades in and out)
- Live clock, notes, quick links, and a daily stats summary
- Focus timer with a progress ring, focus/break modes, and today's session count
- Stopwatch with lap splits, and an interval timer with progress
- Task list with progress, "clear done", a weekly habit tracker, and an event countdown with quick `+1 week` / `+1 month` shortcuts
- Hydration tracker with a goal and reset, inspiration quotes you can copy, ambient soundscape (white / pink / brown / rain / storm / ocean / wind / embers / night)
- Live clock with a 12/24-hour toggle, notes with a live word count, quick links, and a daily stats summary
- **Weather** — current conditions and a three-day outlook for a city you search or your detected location (powered by Open-Meteo, no API key needed)
- **Embed** — paste any link (a doc, a video, a slide deck) to drop a live iframe onto the board, with reload and open-in-new-tab
- Todoist — connect with a personal API token to view, complete, and add tasks from the board
- Post-it notes — headerless sticky notes that look like real paper, with per-note text and colour
- Flashcards — a study deck you type once (one `front | back` card per line), with shuffle, then flip through
- Picker — a random name picker that avoids repeats, for cold-calling or group work
- Breathe — a box-breathing exercise with a completed-cycle count to settle before a task

All state is stored in `localStorage`. Theme, accent color, grid style/size, snapping, widget content scaling, zoom controls, focus chime, auto-start sessions, reduced motion, templates, and which widgets appear in the bottom bar are configurable in the sidebar.

## On mobile

Widgets stack in a single scrollable column. **Press and hold** a widget to reveal a hint naming it (press and hold again, or tap the hint, to dismiss). Drag the grip at the bottom of a widget to resize it. Locked widgets hide both the grip and the resize handles.

## Development

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # static output in dist/
```

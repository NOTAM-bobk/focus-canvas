# focus-canvas

A minimalist, Vercel-styled focus whiteboard for students and teachers. Start from a template or a blank canvas, drop in widgets from the toolbar, then drag, resize, zoom, and pan your board like a whiteboard.

## How it works

- **Templates** — the empty canvas offers starter boards (Deep Work, Study Session, Class Planner, Morning Routine, Lesson Board) that lay out a useful set of widgets in one click, plus a blank option.
- **Command palette** — press `Ctrl`/`Cmd` + `K` (or the ⌘ button in the header) to add widgets, apply templates, jump to a widget on the canvas, or run quick actions.
- **Lock widgets** — use the padlock in a widget header to freeze its position and size so it can't be moved by accident.
- **Empty by default** — the canvas starts blank. Add anything from the toolbar at the bottom.
- **Infinite canvas** — pan in any direction forever; the dot/line grid scrolls and zooms with you.
- **Whiteboard navigation** — drag the empty canvas to pan, use the zoom controls (or `Ctrl`/`Cmd` + scroll) to zoom in and out.
- **Widgets** — drag a widget by its header to move it, and resize from any of its four corners. Contents scale up and down with the widget. Lock, duplicate, or remove from the header actions.
- **Focus sessions** — the timer has Focus and Break modes. Enable *Auto-start next session* to cycle between them automatically and *Focus chime* to hear a two-note tone when a session ends. Timers are timestamp-based, so they stay accurate in background tabs.

## Widgets

- Focus timer, interval timer, and stopwatch
- Task list with progress, weekly habit tracker, event countdown
- Hydration tracker, inspiration quotes, ambient soundscape (white / pink / brown / rain)
- Live clock, notes, quick links, and a daily stats summary
- Todoist — connect with a personal API token to view, complete, and add tasks from the board
- Post-it notes — colourful sticky notes with per-note text and colour
- Flashcards — a study deck you type once (one `front | back` card per line) then flip through
- Picker — a random name picker that avoids repeats, for cold-calling or group work
- Breathe — a box-breathing exercise to settle before a task

All state is stored in `localStorage`. Theme, accent color, grid style/size, snapping, widget content scaling, zoom controls, focus chime, auto-start sessions, reduced motion, templates, and which widgets appear in the bottom bar are configurable in the sidebar.

## On mobile

Widgets stack in a single scrollable column. **Press and hold** a widget to reveal a hint naming it (press and hold again, or tap the hint, to dismiss). Drag the grip at the bottom of a widget to resize it. Locked widgets hide both the grip and the resize handles.

## Development

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # static output in dist/
```

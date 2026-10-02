# focus-canvas

A minimalist, Vercel-styled focus whiteboard for students and teachers. Start from a template or a blank canvas, drop in widgets from the toolbar, then drag, resize, zoom, and pan your board like a whiteboard.

## How it works

- **Workspaces** — the top bar holds a workspace switcher. Create a clean new workspace, switch back to another, rename it, and color-code it; each workspace keeps its own widgets and drawing and is saved to `localStorage`.
- **Templates** — the empty canvas offers starter boards (Deep Work, Study Session, Class Planner, Morning Routine, Lesson Board) that lay out a useful set of widgets in one click, plus a blank option.
- **Command palette** — press `Ctrl`/`Cmd` + `K` (or the ⌘ button in the header) to add widgets, apply templates, jump to a widget on the canvas, or run quick actions.
- **Lock widgets** — use the padlock in a widget header to freeze its position and size so it can't be moved by accident.
- **Empty by default** — the canvas starts blank. Add anything from the toolbar at the bottom.
- **Infinite canvas** — pan in any direction forever; the dot/line grid scrolls and zooms with you.
- **Whiteboard navigation** — drag the empty canvas to pan, scroll to move, and `Ctrl`/`Cmd` + scroll (or a two-finger pinch) to zoom. On a trackpad you can pan and zoom at the same time, and two fingers drag while they pinch. Click the canvas to deselect.
- **Draw on the board** — hit the pen in the header to annotate right over your widgets. Ten tools: pen, highlighter, line, arrow, rectangle, ellipse, text, eraser, select-and-move, and pan. Shapes can be filled, `Shift` snaps lines to 45° and shapes to a square, `Alt`-drag is a quick eraser, and each tool has a single-key shortcut (`P` pen, `M` marker, `L` line, `A` arrow, `R` rectangle, `O` ellipse, `T` text, `E` eraser, `V` select, `H` pan). The select tool gives you a marching-ants outline with a delete handle, plus duplicate and delete in the toolbar, and the whole drawing can be exported as PNG or SVG, or copied to the clipboard. Everything is saved in the browser alongside your widgets. (`Ctrl`/`Cmd` + `Z` undoes, `Shift` + `Ctrl`/`Cmd` + `Z` redoes, `Delete` removes the selection.)
- **Whiteboard mode** — toggle *Whiteboard* in the draw toolbar and the widgets slide away, leaving a clean, pannable, zoomable surface for lesson notes, diagrams, and worked examples.
- **Top bar** — shows the active workspace, the current date and time, and quick controls for drawing, search (`Ctrl`/`Cmd` + `K`), full screen, theme, and settings. A small dot on the right quietly pulses on each autosave.
- **Widgets** — drag a widget by anywhere on its card (buttons and inputs still work), and resize from any of its four corners within sensible limits; the handles enlarge and a live size badge appears while you resize. New widgets appear at a comfortable size that shows all of their content, and contents scale up and down with the widget as you resize. Lock, duplicate, full-screen, or remove from the header actions. Each widget is styled like its real-life counterpart — post-its are paper, the timer is a device with an LCD, notes are a lined page, flashcards are index cards, embed is a little browser window, and so on.
- **Alignment guides** — while you drag a widget, its edges and centre snap to the matching edges and centres of the other widgets, with a thin accent line marking each alignment. The board also snaps to the grid when *Snap to grid* is on, and both can be toggled in the sidebar.
- **Full screen** — open any widget to a large, distraction-free overlay with the ⤢ button in its header (or the board itself with the full-screen button in the top bar). `Esc` or the × exits a widget overlay.
- **Focus sessions** — the timer has Focus and Break modes. Enable *Auto-start next session* to cycle between them automatically and *Focus chime* to hear a two-note tone when a session ends. Timers are timestamp-based, so they stay accurate in background tabs.
- **Interval (Pandora) timer** — set a focus length, a short break, a long break and the number of rounds; the widget alternates focus and break automatically, lands a long break every time you complete a set of rounds, and counts your finished focus sessions. Skip any phase with *Skip to break* / *Skip break*.

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
- **Weather** — current conditions and a three-day outlook for a city you search or your detected location, with a °C/°F switch on the widget itself (powered by Open-Meteo, no API key needed)
- **Embed** — paste any link (a doc, a video, a slide deck) to drop a live iframe onto the board. Once a valid link loads, the widget becomes a full, chrome-free frame — the setup bar and link footer drop away, leaving reload, open-in-new-tab, and change-URL as small hover controls
- Todoist — connect with a personal API token to view, complete, and add tasks from the board. Add tasks with a category (project), a priority, and a due date, switch between Today / Upcoming / Priority / Everything views, and sort the list by due date, priority, name, or project
- Notes — a full-bleed lined page that fills the whole widget (no header or footer bar); the word count and Clear action float in the corner on hover
- Post-it notes — headerless sticky notes that look like real paper, with per-note text and colour
- Flashcards — a study deck you type once (one `front | back` card per line), with shuffle, then flip through
- Picker — a random name picker that avoids repeats, for cold-calling or group work
- Breathe — a box-breathing exercise with a completed-cycle count to settle before a task

All state is stored in `localStorage` — workspaces (name, color, widgets, drawing) included. Theme, accent color, grid style/size, snapping, alignment guides, widget content scaling, zoom controls, focus chime, auto-start sessions, reduced motion, templates, and which widgets appear in the bottom bar are configurable in the sidebar.

## On mobile

Widgets stack in a single scrollable column. **Press and hold** a widget to reveal a hint naming it (press and hold again, or tap the hint, to dismiss). Drag the grip at the bottom of a widget to resize it. Locked widgets hide both the grip and the resize handles.

## Development

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # static output in dist/
```

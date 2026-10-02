# focus-canvas

A minimalist, Vercel-styled focus whiteboard. Start with an empty canvas, drop in widgets from the toolbar, then drag, resize, zoom, and pan your board like a whiteboard.

## How it works

- **Empty by default** — the canvas starts blank. Add anything from the toolbar at the bottom.
- **Infinite canvas** — pan in any direction forever; the dot/line grid scrolls and zooms with you.
- **Whiteboard navigation** — drag the empty canvas to pan, use the zoom controls (or `Ctrl`/`Cmd` + scroll) to zoom in and out.
- **Widgets** — drag a widget by its header to move it, and resize from any of its four corners. Contents scale up and down with the widget. Duplicate or remove from the header actions.

## Widgets

- Focus timer, interval timer, and stopwatch
- Task list with progress, weekly habit tracker, event countdown
- Hydration tracker, inspiration quotes, ambient soundscape (white / pink / brown / rain)
- Live clock, notes, quick links, and a daily stats summary
- Todoist — connect with a personal API token to view, complete, and add tasks from the board

All state is stored in `localStorage`. Theme, accent color, grid style/size, snapping, and widget content scaling are configurable in the sidebar.

## Development

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # static output in dist/
```

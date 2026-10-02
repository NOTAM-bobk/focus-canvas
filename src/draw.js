/* Drawing geometry, hit-testing, and export helpers.
 *
 * A stroke is { id, tool, color, size, points, text? }.
 *   - freehand tools (pen, marker) keep every sampled point
 *   - shape tools (line, arrow, rect, ellipse) keep the two corners of the drag
 *   - the text tool keeps one anchor point (the top-left of the text box)
 * Everything here is pure, so the on-screen board and the SVG/PNG export
 * always draw exactly the same geometry.
 */

const LINE_HEIGHT = 1.28;
const CHAR_WIDTH = 0.58;
const ELLIPSE_STEPS = 56;
const TEXT_FONT = 'Geist, ui-sans-serif, system-ui, sans-serif';

export const SHAPE_TOOLS = ['line', 'arrow', 'rect', 'ellipse'];

export const isShapeTool = (tool) => SHAPE_TOOLS.includes(tool);
export const isTextTool = (tool) => tool === 'text';
export const isFreehandTool = (tool) => tool === 'pen' || tool === 'marker';

/* ------------------------------------------------------------------ */
/*  Paths                                                             */
/* ------------------------------------------------------------------ */

// Turn a list of board-space points into a smooth SVG path.
export const pointsToPath = (points) => {
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

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* ------------------------------------------------------------------ */
/*  Text                                                              */
/* ------------------------------------------------------------------ */

export const textLines = (stroke) => String(stroke.text || '').split('\n');

export const textMetrics = (stroke) => {
  const size = stroke.size || 16;
  const lines = textLines(stroke);
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const lineHeight = size * LINE_HEIGHT;
  return {
    size,
    lines,
    lineHeight,
    width: Math.max(size * CHAR_WIDTH, longest * size * CHAR_WIDTH),
    height: Math.max(lineHeight, lines.length * lineHeight),
  };
};

// Baseline offset so the first line's cap sits at the anchor point.
export const textBaseline = (size) => size * 0.8;

/* ------------------------------------------------------------------ */
/*  Geometry                                                          */
/* ------------------------------------------------------------------ */

const distanceToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (!lengthSq) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

export const shapeEndpoints = (stroke) => {
  const [start, end] = stroke.points;
  return [start, end || start];
};

const ellipseOutline = (stroke) => {
  const [start, end] = shapeEndpoints(stroke);
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const rx = Math.abs(end.x - start.x) / 2;
  const ry = Math.abs(end.y - start.y) / 2;
  const points = [];
  for (let i = 0; i <= ELLIPSE_STEPS; i += 1) {
    const angle = (i / ELLIPSE_STEPS) * Math.PI * 2;
    points.push({ x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry });
  }
  return points;
};

const rectOutline = (stroke) => {
  const [start, end] = shapeEndpoints(stroke);
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y },
    { x: start.x, y: start.y },
  ];
};

// The polyline(s) a hit test should measure against.
const strokeOutline = (stroke) => {
  if (stroke.tool === 'rect') return rectOutline(stroke);
  if (stroke.tool === 'ellipse') return ellipseOutline(stroke);
  if (stroke.tool === 'line' || stroke.tool === 'arrow') return shapeEndpoints(stroke);
  return stroke.points;
};

export const strokeBounds = (stroke) => {
  if (stroke.tool === 'eraser') return null;
  const pad = (stroke.size || 4) / 2 + 2;
  if (isTextTool(stroke.tool)) {
    const metrics = textMetrics(stroke);
    const [anchor] = stroke.points;
    return {
      minX: anchor.x,
      minY: anchor.y,
      maxX: anchor.x + metrics.width,
      maxY: anchor.y + metrics.height,
    };
  }
  const outline = strokeOutline(stroke);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  outline.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
};

// True when a point lands on the stroke, within `radius` board units.
export const strokeHit = (stroke, point, radius) => {
  if (isTextTool(stroke.tool)) {
    const bounds = strokeBounds(stroke);
    return (
      point.x >= bounds.minX - radius &&
      point.x <= bounds.maxX + radius &&
      point.y >= bounds.minY - radius &&
      point.y <= bounds.maxY + radius
    );
  }
  const outline = strokeOutline(stroke);
  const reach = radius + (stroke.size || 4) / 2;
  if (outline.length === 1) return Math.hypot(point.x - outline[0].x, point.y - outline[0].y) <= reach;
  for (let i = 1; i < outline.length; i += 1) {
    const a = outline[i - 1];
    const b = outline[i];
    if (distanceToSegment(point.x, point.y, a.x, a.y, b.x, b.y) <= reach) return true;
  }
  return false;
};

export const translateStroke = (stroke, dx, dy) => ({
  ...stroke,
  points: stroke.points.map((point) => ({ x: point.x + dx, y: point.y + dy })),
});

// Shift-constrain a drag: 45° steps for lines/arrows, squares for shapes.
export const constrainPoint = (origin, point) => {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  return { x: origin.x + Math.cos(angle) * distance, y: origin.y + Math.sin(angle) * distance };
};

export const squarePoint = (origin, point) => {
  const size = Math.max(Math.abs(point.x - origin.x), Math.abs(point.y - origin.y));
  return {
    x: origin.x + Math.sign(point.x - origin.x || 1) * size,
    y: origin.y + Math.sign(point.y - origin.y || 1) * size,
  };
};

/* ------------------------------------------------------------------ */
/*  SVG export                                                        */
/* ------------------------------------------------------------------ */

export const strokeOpacity = (stroke) => (stroke.tool === 'marker' ? 0.4 : 1);

export const strokeToSvg = (stroke) => {
  const opacity = strokeOpacity(stroke);
  const paint = `stroke="${stroke.color}" stroke-width="${stroke.size}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"`;

  if (isTextTool(stroke.tool)) {
    const metrics = textMetrics(stroke);
    const [anchor] = stroke.points;
    const tspans = metrics.lines
      .map(
        (line, index) =>
          `<tspan x="${anchor.x.toFixed(2)}" y="${(anchor.y + index * metrics.lineHeight + textBaseline(metrics.size)).toFixed(2)}">${escapeXml(line) || ' '}</tspan>`,
      )
      .join('');
    return `<text font-family="${TEXT_FONT}" font-size="${metrics.size}" fill="${stroke.color}" opacity="${opacity}" xml:space="preserve">${tspans}</text>`;
  }

  if (stroke.tool === 'rect') {
    const [start, end] = shapeEndpoints(stroke);
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" rx="${Math.min(10, stroke.size).toFixed(2)}" fill="none" ${paint} />`;
  }

  if (stroke.tool === 'ellipse') {
    const [start, end] = shapeEndpoints(stroke);
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    return `<ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="none" ${paint} />`;
  }

  if (stroke.tool === 'line' || stroke.tool === 'arrow') {
    const [start, end] = shapeEndpoints(stroke);
    const line = `<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" ${paint} />`;
    if (stroke.tool === 'line') return line;
    return line + arrowHeadSvg(stroke);
  }

  return `<path d="${pointsToPath(stroke.points)}" fill="none" ${paint} />`;
};

export const arrowHeadSvg = (stroke) => {
  const head = arrowHeadPath(stroke);
  return head ? `<path d="${head}" fill="${stroke.color}" opacity="${strokeOpacity(stroke)}" />` : '';
};

// A filled triangle at the end of an arrow.
export const arrowHeadPath = (stroke) => {
  const [start, end] = shapeEndpoints(stroke);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const length = Math.max(9, (stroke.size || 4) * 3.4);
  const spread = Math.PI / 7;
  const left = { x: end.x - Math.cos(angle - spread) * length, y: end.y - Math.sin(angle - spread) * length };
  const right = { x: end.x - Math.cos(angle + spread) * length, y: end.y - Math.sin(angle + spread) * length };
  return `M ${end.x.toFixed(2)} ${end.y.toFixed(2)} L ${left.x.toFixed(2)} ${left.y.toFixed(2)} L ${right.x.toFixed(2)} ${right.y.toFixed(2)} Z`;
};

/* ------------------------------------------------------------------ */
/*  Document export                                                   */
/* ------------------------------------------------------------------ */

export const strokesBounds = (strokes, pad = 48) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  strokes.forEach((stroke) => {
    const bounds = strokeBounds(stroke);
    if (!bounds) return;
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  });
  if (!Number.isFinite(minX)) return null;
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(1, maxX - minX) + pad * 2,
    height: Math.max(1, maxY - minY) + pad * 2,
  };
};

export const strokesToSvg = (strokes, { background = '#ffffff', pad = 48 } = {}) => {
  const box = strokesBounds(strokes, pad);
  if (!box) return '';
  const body = strokes.map((stroke) => strokeToSvg(stroke)).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(box.width)}" height="${Math.ceil(box.height)}" ` +
    `viewBox="${box.x} ${box.y} ${box.width} ${box.height}">` +
    `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${background}" />${body}</svg>`
  );
};
import { useEffect, useRef } from 'react';
import {
  arrowHeadPath,
  isTextTool,
  pointsToPath,
  strokeBounds,
  strokeOpacity,
  textBaseline,
  textMetrics,
} from './draw';

/* One stroke in board coordinates. The on-screen board and the exported SVG
 * share this geometry so what you draw is what you get. */
export const Stroke = ({ stroke }) => {
  if (stroke.tool === 'eraser') return null;

  const opacity = strokeOpacity(stroke);
  const paint = {
    stroke: stroke.color,
    strokeWidth: stroke.size,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    opacity,
  };
  const fill = stroke.fill ? stroke.color : 'none';

  if (isTextTool(stroke.tool)) {
    const metrics = textMetrics(stroke);
    const [anchor] = stroke.points;
    return (
      <text
        fontFamily="Geist, ui-sans-serif, system-ui, sans-serif"
        fontSize={metrics.size}
        fill={stroke.color}
        opacity={opacity}
        xmlSpace="preserve"
      >
        {metrics.lines.map((line, index) => (
          <tspan key={index} x={anchor.x} y={anchor.y + index * metrics.lineHeight + textBaseline(metrics.size)}>
            {line || ' '}
          </tspan>
        ))}
      </text>
    );
  }

  if (stroke.tool === 'rect') {
    const [start, end] = stroke.points;
    return (
      <rect
        x={Math.min(start.x, end.x)}
        y={Math.min(start.y, end.y)}
        width={Math.abs(end.x - start.x)}
        height={Math.abs(end.y - start.y)}
        rx={Math.min(10, stroke.size)}
        fill={fill}
        {...paint}
      />
    );
  }

  if (stroke.tool === 'ellipse') {
    const [start, end] = stroke.points;
    return (
      <ellipse
        cx={(start.x + end.x) / 2}
        cy={(start.y + end.y) / 2}
        rx={Math.abs(end.x - start.x) / 2}
        ry={Math.abs(end.y - start.y) / 2}
        fill={fill}
        {...paint}
      />
    );
  }

  if (stroke.tool === 'line' || stroke.tool === 'arrow') {
    const [start, end] = stroke.points;
    return (
      <>
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} fill="none" {...paint} />
        {stroke.tool === 'arrow' && <path d={arrowHeadPath(stroke)} fill={stroke.color} opacity={opacity} />}
      </>
    );
  }

  return <path d={pointsToPath(stroke.points)} fill="none" {...paint} />;
};

/* Selection outline + delete handle for a selected stroke. */
export const SelectionOutline = ({ stroke, onDelete }) => {
  const bounds = strokeBounds(stroke);
  if (!bounds) return null;
  const pad = 6;
  const x = bounds.minX - pad;
  const y = bounds.minY - pad;
  const width = Math.max(12, bounds.maxX - bounds.minX) + pad * 2;
  const height = Math.max(12, bounds.maxY - bounds.minY) + pad * 2;
  return (
    <g className="stroke-selection" onPointerDown={(event) => event.stopPropagation()}>

      <rect x={x} y={y} width={width} height={height} rx={4} fill="none" strokeDasharray="4 4" />
      <circle
        className="stroke-delete"
        cx={x + width}
        cy={y}
        r={9}
        role="button"
        aria-label="Delete stroke"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      />
      <path className="stroke-delete-x" d={`M ${x + width - 3.2} ${y - 3.2} l 6.4 6.4 M ${x + width + 3.2} ${y - 3.2} l -6.4 6.4`} />
    </g>
  );
};

/* An in-place editor for a text stroke. It is an HTML textarea laid over the
 * board, scaled by the current zoom so it lines up with the SVG text. */
export const TextEditor = ({ stroke, view, onChange, onCommit }) => {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(node.value.length, node.value.length);
  }, []);

  const metrics = textMetrics(stroke);
  const [anchor] = stroke.points;
  const style = {
    left: `${view.x + anchor.x * view.scale}px`,
    top: `${view.y + (anchor.y - metrics.size * 0.22) * view.scale}px`,
    width: `${Math.max(140, metrics.width + metrics.size * 4)}px`,
    height: `${Math.max(metrics.lineHeight, metrics.height) + metrics.size * 0.5}px`,
    font: `${metrics.size * view.scale}px Geist, ui-sans-serif, system-ui, sans-serif`,
    lineHeight: `${metrics.lineHeight * view.scale}px`,
    color: stroke.color,
  };

  return (
    <textarea
      ref={ref}
      className="text-editor"
      style={style}
      value={stroke.text || ''}
      spellCheck={false}
      placeholder="Type…" 
      onChange={(event) => onChange(event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={(event) => onCommit(event.target.value)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape') onCommit(event.currentTarget.value);
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) onCommit(event.currentTarget.value);
      }}
    />
  );
};

export default Stroke;
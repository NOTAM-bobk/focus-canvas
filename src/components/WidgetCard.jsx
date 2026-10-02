// A single widget frame: chrome, drag handle, resize handles, and actions.
import { useEffect, useRef, useState } from 'react';
import { CopyIcon, ICONS, LockIcon, MaximizeIcon, TimerIcon, UnlockIcon, XIcon } from '../icons';
import { CATALOG_MAP, CORNERS } from '../data/catalog';
import { VALID_PROTOCOL } from '../lib/utils';

export default function WidgetCard({
  widget,
  focused,
  mobile,
  scaleContent,
  resizing,
  onFocus,
  onRemove,
  onDuplicate,
  onToggleLock,
  onFullscreen,
  onDragStart,
  onResizeStart,
  onMobileResizeStart,
  children,
}) {
  const Icon = ICONS[widget.type] || TimerIcon;
  const meta = CATALOG_MAP[widget.type];
  const baseW = meta ? meta.w : widget.w;
  const baseH = meta ? meta.h : widget.h;
  // Growing a widget lets the layout reflow into the extra room; shrinking
  // still scales the design-unit box down so nothing overflows or clips.
  const fit = Math.min(widget.w / baseW, widget.h / baseH);
  const ws = !mobile && scaleContent ? Math.min(1, fit) : 1;
  const roomy = fit >= 1.18;

  // Mobile: press and hold a widget to reveal a hint naming it (press again to dismiss).
  const [hintOpen, setHintOpen] = useState(false);
  const longPressRef = useRef(null);
  const pressRef = useRef(null);

  const beginLongPress = (event) => {
    if (!mobile) return;
    const target = event.target;
    if (target instanceof Element && target.closest('button, a, input, textarea, select, .widget-resize')) return;
    pressRef.current = { x: event.clientX, y: event.clientY };
    clearTimeout(longPressRef.current);
    longPressRef.current = setTimeout(() => {
      setHintOpen((open) => !open);
      pressRef.current = null;
    }, 450);
  };

  const moveLongPress = (event) => {
    if (!pressRef.current) return;
    if (Math.abs(event.clientX - pressRef.current.x) > 10 || Math.abs(event.clientY - pressRef.current.y) > 10) {
      clearTimeout(longPressRef.current);
      pressRef.current = null;
    }
  };

  const endLongPress = () => {
    clearTimeout(longPressRef.current);
    pressRef.current = null;
  };

  // Drag from anywhere on the card, as long as the press did not land on a
  // control the user needs to click, type into, or resize from.
  const beginDrag = (event) => {
    if (mobile || widget.locked) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        'button, a, input, textarea, select, label, [contenteditable="true"], .handle, .widget-resize',
      )
    )
      return;
    onDragStart(event);
  };

  const handlePointerDown = (event) => {
    beginLongPress(event);
    beginDrag(event);
  };

  useEffect(() => () => clearTimeout(longPressRef.current), []);

  const cardStyle = mobile
    ? widget.mh
      ? { minHeight: `${widget.mh}px` }
      : undefined
    : { left: `${widget.x}px`, top: `${widget.y}px`, width: `${widget.w}px`, height: `${widget.h}px`, '--ws': `${ws}` };

  // Post-its and notes skip the header entirely and look like real paper.
  const isSticky = widget.type === 'sticky';
  const isNotes = widget.type === 'notes';
  const isClock = widget.type === 'clock';
  const isCountdown = widget.type === 'countdown';
  const isLiveEmbed = widget.type === 'iframe' && VALID_PROTOCOL.test(widget.src || '');
  const bare = isSticky || isNotes || isClock || isCountdown || isLiveEmbed;

  const actionButtons = (
    <>
      {onFullscreen && !mobile && (
        <button type="button" onClick={onFullscreen} aria-label={`Open ${widget.title} full screen`}>
          <MaximizeIcon size={14} />
        </button>
      )}
      <button
        type="button"
        className={widget.locked ? 'active' : ''}
        onClick={onToggleLock}
        aria-label={`${widget.locked ? 'Unlock' : 'Lock'} ${widget.title}`}
      >
        {widget.locked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
      </button>
      <button type="button" onClick={onDuplicate} aria-label={`Duplicate ${widget.title}`}>
        <CopyIcon size={14} />
      </button>
      <button type="button" onClick={onRemove} aria-label={`Remove ${widget.title}`}>
        <XIcon size={14} />
      </button>
    </>
  );

  return (
    <section
      className={`widget ${mobile ? 'widget--flow' : ''} ${isSticky ? 'widget--sticky' : ''} ${isNotes ? 'widget--notes' : ''} ${isLiveEmbed ? 'widget--embed-live' : ''} ${bare ? 'widget--bare' : ''} ${focused ? 'is-focused' : ''} ${resizing ? 'is-resizing' : ''} ${widget.locked ? 'is-locked' : ''}`}
      data-type={widget.type}
      data-fit={roomy ? 'roomy' : 'tight'}
      id={`widget-${widget.id}`}
      style={cardStyle}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      onPointerDown={handlePointerDown}
      onPointerMove={moveLongPress}
      onPointerUp={endLongPress}
      onPointerCancel={endLongPress}
      onPointerLeave={endLongPress}
    >
      {mobile && hintOpen && (
        <button type="button" className="widget-hint" onClick={() => setHintOpen(false)}>
          <Icon size={13} />
          {meta ? meta.label : widget.title}
        </button>
      )}
      {/* Headerless widgets (post-it, notes, live embed) still need a grab
          handle — their content fills the card and eats the pointer. */}
      {bare && !mobile && (
        <span className="widget-drag-strip" aria-hidden="true">
          <span className="widget-drag-grip" />
        </span>
      )}
      {!bare && (
        <header className={`widget-header ${mobile ? 'static' : ''}`}>
          <span className="widget-title">
            <Icon size={15} />
            {widget.title}
          </span>
          <div className="widget-actions" onPointerDown={(event) => event.stopPropagation()}>
            {actionButtons}
          </div>
        </header>
      )}
      <div className="widget-content">
        <div className="widget-scale">{children}</div>
      </div>
      {bare && (
        <div className="widget-actions widget-actions--float" onPointerDown={(event) => event.stopPropagation()}>
          {actionButtons}
        </div>
      )}
      {!mobile && resizing && (
        <span className="widget-size-badge">
          {resizing.w != null ? `${Math.round(resizing.w)} × ${Math.round(resizing.h)}` : `${Math.round(resizing.h)} px`}
        </span>
      )}
      {!mobile &&
        !widget.locked &&
        CORNERS.map((corner) => (
          <span
            key={corner}
            className={`handle handle--${corner}`}
            onPointerDown={(event) => onResizeStart(event, corner)}
            aria-hidden="true"
          />
        ))}
      {mobile && !widget.locked && (
        <div className="widget-resize" onPointerDown={onMobileResizeStart} role="separator" aria-label="Resize widget">
          <span className="widget-resize-grip" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}

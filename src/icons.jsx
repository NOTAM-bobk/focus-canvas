/* Minimal, dependency-free stroke icon set (24x24, currentColor). */

const Svg = ({ size = 18, children, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

export const TimerIcon = (props) => (
  <Svg {...props}>
    <path d="M10 2h4" />
    <path d="M12 14l3-3" />
    <circle cx="12" cy="14" r="8" />
  </Svg>
);

export const StopwatchIcon = (props) => (
  <Svg {...props}>
    <path d="M10 2h4" />
    <path d="M12 2v3" />
    <circle cx="12" cy="14" r="8" />
    <path d="M12 10v4h3" />
  </Svg>
);

export const RepeatIcon = (props) => (
  <Svg {...props}>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </Svg>
);

export const ClockIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const CalendarIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </Svg>
);

export const CheckSquareIcon = (props) => (
  <Svg {...props}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </Svg>
);

export const SproutIcon = (props) => (
  <Svg {...props}>
    <path d="M7 20h10" />
    <path d="M12 20c0-4 .5-7 3-10" />
    <path d="M12 15c-3 0-5-2-5-6 3 0 5 2 5 6z" />
    <path d="M14 9c0-2.5 1-4.5 3-6 1.5 1 2 3 1.5 5C17 9.5 15.5 10 14 9z" />
  </Svg>
);

export const NoteIcon = (props) => (
  <Svg {...props}>
    <path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9l6-6V5a2 2 0 0 0-2-2z" />
    <path d="M15 21v-4a2 2 0 0 1 2-2h4" />
  </Svg>
);

export const DropletIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" />
  </Svg>
);

export const QuoteIcon = (props) => (
  <Svg {...props}>
    <path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3c0 4-2 6-5 7" />
    <path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3c0 4-2 6-5 7" />
  </Svg>
);

export const LinkIcon = (props) => (
  <Svg {...props}>
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </Svg>
);

export const HeadphonesIcon = (props) => (
  <Svg {...props}>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
  </Svg>
);

export const ChartIcon = (props) => (
  <Svg {...props}>
    <path d="M3 3v18h18" />
    <path d="M8 17v-5" />
    <path d="M13 17V8" />
    <path d="M18 17v-9" />
  </Svg>
);

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);

export const MinusIcon = (props) => (
  <Svg {...props}>
    <path d="M5 12h14" />
  </Svg>
);

export const FitIcon = (props) => (
  <Svg {...props}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </Svg>
);

export const SunIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const MoonIcon = (props) => (
  <Svg {...props}>
    <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />
  </Svg>
);

export const SlidersIcon = (props) => (
  <Svg {...props}>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
    <path d="M1 14h6M9 8h6M17 16h6" />
  </Svg>
);

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Svg>
);

export const XIcon = (props) => (
  <Svg {...props}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

export const CopyIcon = (props) => (
  <Svg {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
);

export const ResetIcon = (props) => (
  <Svg {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Svg>
);

export const LockIcon = (props) => (
  <Svg {...props}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </Svg>
);

export const UnlockIcon = (props) => (
  <Svg {...props}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 7.5-2" />
  </Svg>
);

export const CommandIcon = (props) => (
  <Svg {...props}>
    <path d="M9 3a3 3 0 1 0 0 6h6a3 3 0 1 0 0-6 3 3 0 0 0-3 3v6a3 3 0 1 0 3 3 3 3 0 0 0-3-3H6a3 3 0 1 0 3 3V9z" />
  </Svg>
);

export const FlashcardIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="6" width="15" height="11" rx="2" />
    <path d="M6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V8" />
    <path d="M7 10.5h7" />
    <path d="M7 13.5h4" />
  </Svg>
);

export const DiceIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1" />
    <circle cx="15.5" cy="8.5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="8.5" cy="15.5" r="1" />
    <circle cx="15.5" cy="15.5" r="1" />
  </Svg>
);

export const BreathIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
  </Svg>
);

export const ChevronDownIcon = (props) => (
  <Svg {...props}>
    <path d="M5 9l7 7 7-7" />
  </Svg>
);

export const LayersIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </Svg>
);

export const PencilIcon = (props) => (
  <Svg {...props}>
    <path d="M4 20l4-1 9.5-9.5a2.1 2.1 0 0 0-3-3L5 16l-1 4z" />
    <path d="M13.5 6.5l3 3" />
  </Svg>
);

export const ChevronLeftIcon = (props) => (
  <Svg {...props}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);

export const ChevronRightIcon = (props) => (
  <Svg {...props}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);

export const CloudIcon = (props) => (
  <Svg {...props}>
    <path d="M7 18a4 4 0 0 1-.4-7.98A5.5 5.5 0 0 1 17.2 9.2 4.4 4.4 0 0 1 17 18z" />
  </Svg>
);

export const RainIcon = (props) => (
  <Svg {...props}>
    <path d="M7 15a4 4 0 0 1-.4-7.98A5.5 5.5 0 0 1 17.2 6.2 4.4 4.4 0 0 1 17 15z" />
    <path d="M8 18l-1 3" />
    <path d="M12.5 18l-1 3" />
    <path d="M17 18l-1 3" />
  </Svg>
);

export const SnowIcon = (props) => (
  <Svg {...props}>
    <path d="M7 14a4 4 0 0 1-.4-7.98A5.5 5.5 0 0 1 17.2 5.2 4.4 4.4 0 0 1 17 14z" />
    <path d="M9 18v3" />
    <path d="M15 18v3" />
    <path d="M12 17.5v.01" />
  </Svg>
);

export const StormIcon = (props) => (
  <Svg {...props}>
    <path d="M7 14a4 4 0 0 1-.4-7.98A5.5 5.5 0 0 1 17.2 5.2 4.4 4.4 0 0 1 17 14z" />
    <path d="M13 14l-3 4h3l-1.5 4" />
  </Svg>
);

export const StickyIcon = (props) => (
  <Svg {...props}>
    <path d="M5 3h9l6 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h5" />
    <path d="M8 16.5h3" />
  </Svg>
);

export const TodoistIcon = (props) => (
  <Svg {...props}>
    <path d="M3 6.5l1.8 1.8L8 5" />
    <path d="M11 6.5h10" />
    <path d="M3 12.5l1.8 1.8L8 11" />
    <path d="M11 12.5h10" />
    <path d="M3 18.5l1.8 1.8L8 17" />
    <path d="M11 18.5h10" />
  </Svg>
);

export const RefreshIcon = (props) => (
  <Svg {...props}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 3v5h-5" />
  </Svg>
);

export const ExternalIcon = (props) => (
  <Svg {...props}>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </Svg>
);

export const GripIcon = (props) => (
  <Svg {...props}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </Svg>
);

export const PenIcon = (props) => (
  <Svg {...props}>
    <path d="M4 20l3.4-1 10.9-10.9a2.3 2.3 0 0 0-3.3-3.3L4.1 15.7 3 21z" />
    <path d="M13.6 6.2l4.2 4.2" />
    <path d="M3 21h6" />
  </Svg>
);

export const HighlighterIcon = (props) => (
  <Svg {...props}>
    <path d="M12.8 4.2l6.9 6.9-5.4 5.4-4.8-.6-1.5-4.8z" />
    <path d="M9.5 15.9L5 20.4l-2 .6.6-2 4.5-4.5" />
    <path d="M4 23h16" />
  </Svg>
);

export const EraserIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 15.5l7-7a2 2 0 0 1 2.8 0l4.2 4.2a2 2 0 0 1 0 2.8l-4.4 4.4H8l-3.5-3.5a2 2 0 0 1 0-2.9z" />
    <path d="M9 10.5l5.5 5.5" />
    <path d="M8 20.9h12" />
  </Svg>
);

export const HandIcon = (props) => (
  <Svg {...props}>
    <path d="M8 11.5V6a1.5 1.5 0 0 1 3 0v5" />
    <path d="M11 10.5V4.5a1.5 1.5 0 0 1 3 0V10" />
    <path d="M14 10.5V6.5a1.5 1.5 0 0 1 3 0V13" />
    <path d="M8 11.5V9.5a1.5 1.5 0 0 0-3 0V15a6 6 0 0 0 6 6h2a5 5 0 0 0 5-5v-3" />
  </Svg>
);

export const UndoIcon = (props) => (
  <Svg {...props}>
    <path d="M9 7L4 12l5 5" />
    <path d="M4 12h10.5a5.5 5.5 0 0 1 0 11H10" />
  </Svg>
);

export const RedoIcon = (props) => (
  <Svg {...props}>
    <path d="M15 7l5 5-5 5" />
    <path d="M20 12H9.5a5.5 5.5 0 0 0 0 11H14" />
  </Svg>
);

export const ImageIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M4 18l5-5 3 3 3-3 5 5" />
  </Svg>
);

export const BoardIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="3" width="18" height="13" rx="2" />
    <path d="M12 16v5" />
    <path d="M8 21h8" />
  </Svg>
);

export const FrameIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <circle cx="6.4" cy="6.5" r="0.7" />
    <circle cx="9" cy="6.5" r="0.7" />
  </Svg>
);

export const ICONS = {
  timer: TimerIcon,
  stopwatch: StopwatchIcon,
  pandora: RepeatIcon,
  clock: ClockIcon,
  countdown: CalendarIcon,
  tasks: CheckSquareIcon,
  habits: SproutIcon,
  notes: NoteIcon,
  water: DropletIcon,
  quote: QuoteIcon,
  links: LinkIcon,
  sound: HeadphonesIcon,
  stats: ChartIcon,
  todoist: TodoistIcon,
  sticky: StickyIcon,
  flashcards: FlashcardIcon,
  picker: DiceIcon,
  breath: BreathIcon,
  weather: CloudIcon,
  iframe: FrameIcon,
};

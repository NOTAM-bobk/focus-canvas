// Todoist REST helpers — normalising the API's list shape and due dates.

export const todoistList = (data) => (Array.isArray(data) ? data : data?.results ?? []);

export const dayDiff = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

export const dueLabel = (due) => {
  if (!due) return null;
  const raw = due.datetime || due.date;
  if (!raw) return due.string || null;
  const diff = dayDiff(raw);
  if (diff === null) return due.string || null;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff < 7) return new Date(raw).toLocaleDateString([], { weekday: 'long' });
  return new Date(raw).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

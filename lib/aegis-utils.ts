export type PregnancyStatus = 'pregnant' | 'postpartum' | 'loss';

export function getGestationalWeek(
  dueDate: string,
  now = new Date(),
): number | null {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  return Math.max(1, Math.min(42, 40 - Math.ceil(daysRemaining / 7)));
}

export function stageLabel(
  status: PregnancyStatus,
  dueDate: string,
  now = new Date(),
): string {
  if (status === 'loss') return 'Bereavement mode';
  if (status === 'postpartum') return 'Postpartum';
  const week = getGestationalWeek(dueDate, now);
  return week ? `Week ${week}` : 'Pregnancy';
}

export function privacySafeCalendarTitle(provider?: string): string {
  return provider?.trim()
    ? `Appointment with ${provider.trim()}`
    : 'Personal appointment';
}

export function buildAppointmentSummary(appointment: {
  date: string;
  provider: string;
  location?: string;
  questions: string[];
  notes: string;
  actions: string[];
}): string {
  const section = (heading: string, items: string[]) =>
    `${heading}\n${items.length ? items.map((item) => `- ${item}`).join('\n') : '- None yet'}`;
  return [
    'AEGIS APPOINTMENT SUMMARY',
    `Date: ${appointment.date || 'Not set'}`,
    `Provider: ${appointment.provider || 'Not set'}`,
    `Location: ${appointment.location || 'Not set'}`,
    section('Questions', appointment.questions),
    `Notes\n${appointment.notes || 'None yet'}`,
    section('Follow-up actions', appointment.actions),
    'Created for personal organization. This summary is not a medical record or diagnosis.',
  ].join('\n\n');
}

export function createId(prefix: string, now = Date.now()): string {
  return `${prefix}-${now}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sanitizeExport<T>(state: T): T {
  return JSON.parse(JSON.stringify(state)) as T;
}

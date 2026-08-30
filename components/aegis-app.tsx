'use client';

import { ReactNode, SyntheticEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Download,
  Heart,
  HeartPulse,
  Home,
  LockKeyhole,
  Moon,
  Phone,
  Pill,
  Plus,
  Printer,
  ShieldCheck,
  Sun,
  Trash2,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  buildAppointmentSummary,
  createId,
  getGestationalWeek,
  stageLabel,
} from '@/lib/aegis-utils';

type View = 'today' | 'journey' | 'care' | 'track' | 'you';
type DialogName = 'urgent' | 'appointment' | 'loss' | 'delete' | null;
type LogType = 'symptom' | 'blood pressure' | 'movement' | 'mood';
type Appointment = {
  id: string;
  date: string;
  provider: string;
  location: string;
  questions: string[];
  notes: string;
  actions: string[];
};
type LogEntry = {
  id: string;
  type: LogType;
  value: string;
  context: string;
  createdAt: string;
};
type Medication = {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  prescriber: string;
};
type Supporter = {
  id: string;
  name: string;
  relationship: string;
  permissions: string[];
  status: 'local draft' | 'revoked';
};
type State = {
  onboarded: boolean;
  profile: {
    name: string;
    dueDate: string;
    status: 'pregnant' | 'postpartum' | 'loss';
    tone: 'clinical' | 'conversational' | 'minimal';
  };
  appointments: Appointment[];
  logs: LogEntry[];
  medications: Medication[];
  supporters: Supporter[];
  quickNotes: string[];
  reminders: boolean;
  darkMode: boolean;
  lifecycleEvents: { state: string; at: string }[];
};

const STORAGE_KEY = 'aegis-local-v1';
const initialState: State = {
  onboarded: false,
  profile: {
    name: '',
    dueDate: '2026-12-13',
    status: 'pregnant',
    tone: 'clinical',
  },
  appointments: [
    {
      id: 'appt-demo',
      date: '2026-09-03T09:30',
      provider: 'Dr. Rivera',
      location: 'Women’s Health Center',
      questions: [
        'What should I prepare for the next month?',
        'Which symptoms should prompt a call?',
      ],
      notes: '',
      actions: [],
    },
  ],
  logs: [],
  medications: [],
  supporters: [],
  quickNotes: [],
  reminders: false,
  darkMode: false,
  lifecycleEvents: [],
};

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'journey', label: 'Journey', icon: BookOpen },
  { id: 'care', label: 'Care', icon: CalendarDays },
  { id: 'track', label: 'Track', icon: Activity },
  { id: 'you', label: 'You', icon: CircleUserRound },
];

const evidence = [
  {
    title: 'Urgent maternal warning signs',
    summary:
      'Know the signs that need immediate medical attention during pregnancy and through the year after pregnancy.',
    source: 'CDC HEAR HER',
    reviewed: 'Aug 2026',
    href: 'https://www.cdc.gov/hearher/maternal-warning-signs/index.html',
  },
  {
    title: 'Preparing for an appointment',
    summary:
      'Keep questions, notes, medications, and follow-up actions together so the visit stays focused on what matters to you.',
    source: 'Aegis organizational guidance',
    reviewed: 'Aug 2026',
    href: '',
  },
  {
    title: 'Mental health support',
    summary:
      'Mood changes deserve care. Screening is most useful when timely assessment, treatment, and follow-up are available.',
    source: 'ACOG',
    reviewed: 'Aug 2026',
    href: 'https://www.acog.org/programs/perinatal-mental-health/patient-screening',
  },
];

const fieldClass = 'h-11 rounded-xl bg-background px-3';
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {children}
      {hint && (
        <span className="text-xs font-normal leading-5 text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}
function PanelTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
function DialogShell({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] grid place-items-end bg-foreground/30 sm:place-items-center sm:p-5"
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
    >
      <dialog
        open
        aria-label={title}
        className={`relative m-0 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-popover p-6 text-popover-foreground shadow-2xl sm:m-auto sm:rounded-3xl sm:p-7 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        {children}
      </dialog>
    </div>
  );
}

export function AegisApp() {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>('today');
  const [dialog, setDialog] = useState<DialogName>(null);
  const [question, setQuestion] = useState('');
  const [note, setNote] = useState('');
  const [appointmentDraft, setAppointmentDraft] = useState({
    date: '',
    provider: '',
    location: '',
  });
  const [logDraft, setLogDraft] = useState<{
    type: LogType;
    value: string;
    context: string;
  }>({ type: 'symptom', value: '', context: '' });
  const [medDraft, setMedDraft] = useState({
    name: '',
    dose: '',
    schedule: '',
    prescriber: '',
  });
  const [supportDraft, setSupportDraft] = useState({
    name: '',
    relationship: '',
  });

  useEffect(() => {
    let savedState: State | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedState = { ...initialState, ...JSON.parse(saved) };
    } catch {
      /* in-memory fallback */
    }
    queueMicrotask(() => {
      if (savedState) setState(savedState);
      setHydrated(true);
    });
    navigator.serviceWorker?.register('/sw.js').catch(() => undefined);
  }, []);
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage unavailable */
      }
    }
  }, [state, hydrated]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setDialog(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const week = useMemo(
    () => getGestationalWeek(state.profile.dueDate),
    [state.profile.dueDate],
  );
  const nextAppointment = [...state.appointments].sort((a, b) =>
    a.date.localeCompare(b.date),
  )[0];
  const latestLogs = state.logs.slice(0, 4);
  const updateProfile = (patch: Partial<State['profile']>) =>
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  const updateAppointment = (id: string, patch: Partial<Appointment>) =>
    setState((s) => ({
      ...s,
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    }));
  const download = (filename: string, content: string, type = 'text/plain') => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const completeOnboarding = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.profile.name.trim()) setState((s) => ({ ...s, onboarded: true }));
  };
  const addAppointment = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!appointmentDraft.date || !appointmentDraft.provider.trim()) return;
    setState((s) => ({
      ...s,
      appointments: [
        ...s.appointments,
        {
          id: createId('appt'),
          ...appointmentDraft,
          questions: [],
          notes: '',
          actions: [],
        },
      ],
    }));
    setAppointmentDraft({ date: '', provider: '', location: '' });
    setDialog(null);
    setView('care');
  };
  const addLog = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!logDraft.value.trim()) return;
    setState((s) => ({
      ...s,
      logs: [
        {
          id: createId('log'),
          ...logDraft,
          createdAt: new Date().toISOString(),
        },
        ...s.logs,
      ],
    }));
    setLogDraft((d) => ({ ...d, value: '', context: '' }));
  };
  const addMedication = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!medDraft.name.trim()) return;
    setState((s) => ({
      ...s,
      medications: [...s.medications, { id: createId('med'), ...medDraft }],
    }));
    setMedDraft({ name: '', dose: '', schedule: '', prescriber: '' });
  };
  const addSupporter = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supportDraft.name.trim()) return;
    setState((s) => ({
      ...s,
      supporters: [
        ...s.supporters,
        {
          id: createId('support'),
          ...supportDraft,
          permissions: [],
          status: 'local draft',
        },
      ],
    }));
    setSupportDraft({ name: '', relationship: '' });
  };

  if (!hydrated)
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Opening your private workspace…
      </div>
    );
  if (!state.onboarded)
    return (
      <Onboarding
        state={state}
        updateProfile={updateProfile}
        onSubmit={completeOnboarding}
      />
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[90] -translate-y-20 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/94 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setView('today')}
            className="flex items-center gap-3 rounded-xl"
            aria-label="Aegis home"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-left">
              <span className="block font-heading text-[17px] font-semibold leading-none">
                Aegis
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Local companion
              </span>
            </span>
          </button>
          <Button
            variant="destructive"
            size="lg"
            className="h-11 rounded-xl px-4 font-semibold"
            onClick={() => setDialog('urgent')}
          >
            <Phone />
            Urgent help
          </Button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-28 pt-7 sm:px-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:pb-12 lg:pt-9">
        <aside className="hidden lg:block">
          <nav
            className="sticky top-24 space-y-1"
            aria-label="Primary navigation"
          >
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium ${view === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                aria-current={view === id ? 'page' : undefined}
              >
                <Icon className="size-[18px]" />
                {label}
              </button>
            ))}
            <div className="mx-3 my-5 border-t border-border" />
            <div className="rounded-2xl bg-secondary p-4">
              <LockKeyhole className="mb-3 size-5 text-primary" />
              <p className="text-sm font-semibold">Stored in this browser</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                No account or cloud sync. Export before clearing browser data.
              </p>
            </div>
          </nav>
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0">
          {view === 'today' && (
            <Today
              state={state}
              nextAppointment={nextAppointment}
              latestLogs={latestLogs}
              setView={setView}
              setDialog={setDialog}
              note={note}
              setNote={setNote}
              addNote={() => {
                if (note.trim()) {
                  setState((s) => ({
                    ...s,
                    quickNotes: [note.trim(), ...s.quickNotes],
                  }));
                  setNote('');
                }
              }}
            />
          )}
          {view === 'journey' && <Journey state={state} week={week} />}
          {view === 'care' && (
            <Care
              state={state}
              setState={setState}
              updateAppointment={updateAppointment}
              setDialog={setDialog}
              question={question}
              setQuestion={setQuestion}
              medDraft={medDraft}
              setMedDraft={setMedDraft}
              addMedication={addMedication}
              download={download}
            />
          )}
          {view === 'track' && (
            <Track
              logs={state.logs}
              draft={logDraft}
              setDraft={setLogDraft}
              addLog={addLog}
            />
          )}
          {view === 'you' && (
            <You
              state={state}
              setState={setState}
              updateProfile={updateProfile}
              supportDraft={supportDraft}
              setSupportDraft={setSupportDraft}
              addSupporter={addSupporter}
              setDialog={setDialog}
              download={download}
            />
          )}
        </main>
      </div>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
      >
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${view === id ? 'text-primary' : 'text-muted-foreground'}`}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>
      {dialog === 'urgent' && <UrgentDialog onClose={() => setDialog(null)} />}
      {dialog === 'appointment' && (
        <DialogShell title="Add an appointment" onClose={() => setDialog(null)}>
          <form onSubmit={addAppointment} className="grid gap-4">
            <Field label="Date and time">
              <Input
                className={fieldClass}
                type="datetime-local"
                required
                value={appointmentDraft.date}
                onChange={(e) =>
                  setAppointmentDraft((d) => ({ ...d, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Provider or clinic">
              <Input
                className={fieldClass}
                required
                value={appointmentDraft.provider}
                onChange={(e) =>
                  setAppointmentDraft((d) => ({
                    ...d,
                    provider: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Location (optional)">
              <Input
                className={fieldClass}
                value={appointmentDraft.location}
                onChange={(e) =>
                  setAppointmentDraft((d) => ({
                    ...d,
                    location: e.target.value,
                  }))
                }
              />
            </Field>
            <Button type="submit" className="mt-2 h-11 rounded-xl">
              Save appointment
            </Button>
          </form>
        </DialogShell>
      )}
      {dialog === 'loss' && (
        <DialogShell
          title="Change your experience"
          onClose={() => setDialog(null)}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            You do not need to explain what happened. Bereavement mode removes
            pregnancy-development content and turns off reminders on this
            device. Existing notes remain available.
          </p>
          <div className="mt-6 grid gap-3">
            <Button
              variant="destructive"
              className="h-12 rounded-xl"
              onClick={() => {
                setState((s) => ({
                  ...s,
                  profile: { ...s.profile, status: 'loss' },
                  reminders: false,
                  lifecycleEvents: [
                    ...s.lifecycleEvents,
                    { state: 'loss', at: new Date().toISOString() },
                  ],
                }));
                setDialog(null);
                setView('today');
              }}
            >
              Turn on bereavement mode
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => setDialog(null)}
            >
              Not now
            </Button>
          </div>
        </DialogShell>
      )}
      {dialog === 'delete' && (
        <DialogShell title="Delete local data" onClose={() => setDialog(null)}>
          <p className="text-sm leading-6 text-muted-foreground">
            This removes Aegis data from this browser. It cannot remove
            downloaded exports, browser history, device calendar entries, or
            backups outside this app.
          </p>
          <Button
            variant="destructive"
            className="mt-6 h-12 w-full rounded-xl"
            onClick={() => {
              const receipt = `Aegis local deletion receipt\n${new Date().toISOString()}\nAll data stored by this app in this browser was cleared.`;
              localStorage.removeItem(STORAGE_KEY);
              download('aegis-deletion-receipt.txt', receipt);
              setState(initialState);
              setDialog(null);
            }}
          >
            Delete and download receipt
          </Button>
        </DialogShell>
      )}
    </div>
  );
}

function Onboarding({
  state,
  updateProfile,
  onSubmit,
}: {
  state: State;
  updateProfile: (p: Partial<State['profile']>) => void;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-14">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-card shadow-[0_30px_100px_rgba(21,51,61,0.12)] ring-1 ring-border lg:grid lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative hidden min-h-[680px] bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white/14">
              <ShieldCheck />
            </span>
            <span className="font-heading text-xl font-semibold">Aegis</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              Your private workspace
            </p>
            <h1 className="mt-4 font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.05em]">
              Care preparation without the noise.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/75">
              Bring appointments, questions, notes, and personal tracking
              together in a calm, local-only companion.
            </p>
          </div>
          <p className="text-xs leading-5 text-white/60">
            Educational and organizational only. Aegis does not diagnose, treat,
            monitor you, or replace professional care.
          </p>
        </div>
        <form onSubmit={onSubmit} className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck />
            </span>
            <span className="font-heading text-xl font-semibold">Aegis</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">
            Welcome
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Set up your space
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This prototype stores entries only in this browser. Nothing is sent
            to a clinician or cloud account.
          </p>
          <div className="mt-8 grid gap-5">
            <Field label="What should we call you?">
              <Input
                className={fieldClass}
                required
                autoComplete="given-name"
                value={state.profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="First name or chosen name"
              />
            </Field>
            <Field label="Estimated due date" hint="You can change this later.">
              <Input
                className={fieldClass}
                type="date"
                required
                value={state.profile.dueDate}
                onChange={(e) => updateProfile({ dueDate: e.target.value })}
              />
            </Field>
            <Field label="Communication style">
              <select
                className={`${fieldClass} border border-input`}
                value={state.profile.tone}
                onChange={(e) =>
                  updateProfile({
                    tone: e.target.value as State['profile']['tone'],
                  })
                }
              >
                <option value="clinical">Clinical — concise and exact</option>
                <option value="conversational">
                  Conversational — warm and clear
                </option>
                <option value="minimal">Minimal — essentials only</option>
              </select>
            </Field>
          </div>
          <div className="mt-6 rounded-2xl bg-secondary p-4 text-xs leading-5 text-secondary-foreground">
            <strong>Shared-device note:</strong> anyone who can open this
            browser profile may see these entries. Private browsing or clearing
            site data may delete them.
          </div>
          <Button type="submit" className="mt-7 h-12 w-full rounded-xl">
            Create my local workspace
            <ChevronRight />
          </Button>
        </form>
      </div>
    </main>
  );
}

function Today({
  state,
  nextAppointment,
  latestLogs,
  setView,
  setDialog,
  note,
  setNote,
  addNote,
}: {
  state: State;
  nextAppointment?: Appointment;
  latestLogs: LogEntry[];
  setView: (v: View) => void;
  setDialog: (d: DialogName) => void;
  note: string;
  setNote: (v: string) => void;
  addNote: () => void;
}) {
  const name = state.profile.name || 'there';
  if (state.profile.status === 'loss')
    return (
      <>
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">
          Bereavement mode
        </p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">
          We’re here when you need us, {name}.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          Pregnancy-development content and reminders are paused. Notes,
          appointments, exports, and support options remain available.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your records</CardTitle>
              <CardDescription>
                Keep, export, or delete your local information on your terms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setView('you')}
                className="h-11 rounded-xl"
              >
                Open data controls
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Support now</CardTitle>
              <CardDescription>
                If you may be in danger or need immediate crisis support, help
                is one action away.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setDialog('urgent')}
                className="h-11 rounded-xl"
              >
                View urgent help
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  return (
    <>
      <section className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-primary">
          {stageLabel(state.profile.status, state.profile.dueDate)}
        </p>
        <h1 className="font-heading text-[clamp(2rem,5vw,3.3rem)] font-semibold leading-[1.04] tracking-[-0.045em]">
          {state.profile.status === 'postpartum'
            ? `How are you today, ${name}?`
            : `Good morning, ${name}.`}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          Your next care step, recent notes, and personal records are close at
          hand.
        </p>
      </section>
      <Card className="border-0 bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-primary-foreground shadow-[0_24px_70px_rgba(17,76,74,0.18)] ring-0">
        <CardHeader>
          <Badge className="mb-2 bg-white/14 text-white">Next step</Badge>
          <CardTitle className="font-heading text-2xl sm:text-[28px]">
            {nextAppointment
              ? `Prepare for ${new Date(nextAppointment.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`
              : 'Add your next appointment'}
          </CardTitle>
          <CardDescription className="max-w-2xl text-white/76">
            {nextAppointment
              ? `${nextAppointment.questions.length} questions ready for ${nextAppointment.provider}.`
              : 'Keep your agenda, questions, notes, and follow-up actions in one place.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            className="h-11 rounded-xl bg-white text-primary"
            onClick={() =>
              nextAppointment ? setView('care') : setDialog('appointment')
            }
          >
            {nextAppointment ? 'Open appointment' : 'Add appointment'}
            <ChevronRight />
          </Button>
        </CardContent>
      </Card>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section>
          <PanelTitle
            title="Quick note"
            description="Capture a thought before it slips away."
          />
          <Card>
            <CardContent className="grid gap-3">
              <Textarea
                className="min-h-24 rounded-xl"
                placeholder="What do you want to remember?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                onClick={addNote}
                disabled={!note.trim()}
                className="h-10 justify-self-start rounded-xl"
              >
                <Plus />
                Save note
              </Button>
              {state.quickNotes[0] && (
                <p className="border-t pt-4 text-sm leading-6 text-muted-foreground">
                  Most recent: “{state.quickNotes[0]}”
                </p>
              )}
            </CardContent>
          </Card>
        </section>
        <section>
          <PanelTitle
            title="Recent tracking"
            action={
              <button
                onClick={() => setView('track')}
                className="text-sm font-semibold text-primary"
              >
                View all
              </button>
            }
          />
          <Card className="gap-0 py-0 divide-y divide-border">
            {latestLogs.length ? (
              latestLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex min-h-16 items-center gap-3 px-4"
                >
                  <Activity className="size-4 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold capitalize">
                      {log.type}: {log.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 text-sm leading-6 text-muted-foreground">
                No entries yet. Tracking is optional and never scored.
              </div>
            )}
          </Card>
        </section>
      </div>
      <p className="mx-auto mt-9 max-w-3xl text-center text-xs leading-5 text-muted-foreground">
        Educational and organizational only. Recording something does not send
        it to a clinician.
      </p>
    </>
  );
}

function Journey({ state, week }: { state: State; week: number | null }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">
        Journey
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">
        {state.profile.status === 'postpartum'
          ? 'Your recovery and care'
          : `A clear view of ${week ? `week ${week}` : 'this stage'}`}
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Evidence is visible, applicability is clear, and medical decisions stay
        with you and your care team.
      </p>
      <Image
        src="/og.png"
        alt="Aegis, your pregnancy care companion"
        width={1731}
        height={909}
        className="mt-7 aspect-[1.9/1] w-full rounded-3xl object-cover shadow-sm ring-1 ring-border"
        priority
      />
      <div className="mt-8">
        <PanelTitle
          title="Guidance library"
          description={
            state.profile.tone === 'minimal'
              ? 'Only essential guidance is shown in minimal mode.'
              : 'Plain-language information from reviewed sources.'
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          {evidence
            .slice(0, state.profile.tone === 'minimal' ? 1 : 3)
            .map((card) => (
              <Card key={card.title}>
                <CardHeader>
                  <Badge variant="secondary">Educational</Badge>
                  <CardTitle className="mt-2 font-heading text-lg">
                    {card.title}
                  </CardTitle>
                  <CardDescription className="leading-6">
                    {card.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-t pt-4 text-xs leading-5 text-muted-foreground">
                    <p>
                      {card.source} · U.S. · Reviewed {card.reviewed}
                    </p>
                    {card.href && (
                      <a
                        href={card.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex font-semibold text-primary hover:underline"
                      >
                        View source
                        <ChevronRight className="size-3.5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </>
  );
}

function Care({
  state,
  setState,
  updateAppointment,
  setDialog,
  question,
  setQuestion,
  medDraft,
  setMedDraft,
  addMedication,
  download,
}: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  updateAppointment: (id: string, p: Partial<Appointment>) => void;
  setDialog: (d: DialogName) => void;
  question: string;
  setQuestion: (v: string) => void;
  medDraft: {
    name: string;
    dose: string;
    schedule: string;
    prescriber: string;
  };
  setMedDraft: React.Dispatch<
    React.SetStateAction<{
      name: string;
      dose: string;
      schedule: string;
      prescriber: string;
    }>
  >;
  addMedication: (e: SyntheticEvent<HTMLFormElement>) => void;
  download: (f: string, c: string, t?: string) => void;
}) {
  const appt = state.appointments[0];
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">
            Care
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">
            Appointment workspace
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Prepare questions, keep notes, and leave with clear next actions.
          </p>
        </div>
        <Button
          onClick={() => setDialog('appointment')}
          className="h-11 self-start rounded-xl"
        >
          <Plus />
          Add appointment
        </Button>
      </div>
      {!appt ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center text-muted-foreground">
            No appointments yet.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <Card>
            <CardHeader>
              <Badge variant="secondary">Upcoming</Badge>
              <CardTitle className="mt-2 font-heading text-xl">
                {new Date(appt.date).toLocaleString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </CardTitle>
              <CardDescription>
                {appt.provider}
                <br />
                {appt.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button
                className="h-11 rounded-xl"
                onClick={() =>
                  download(
                    'aegis-appointment-summary.txt',
                    buildAppointmentSummary(appt),
                  )
                }
              >
                <Download />
                Export summary
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => window.print()}
              >
                <Printer />
                Print / save PDF
              </Button>
            </CardContent>
          </Card>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Review this list before the visit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (question.trim()) {
                      updateAppointment(appt.id, {
                        questions: [...appt.questions, question.trim()],
                      });
                      setQuestion('');
                    }
                  }}
                >
                  <Input
                    className={fieldClass}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Add a question"
                    aria-label="New appointment question"
                  />
                  <Button className="h-11 rounded-xl" type="submit">
                    <Plus />
                    <span className="sr-only">Add question</span>
                  </Button>
                </form>
                <ul className="mt-4 grid gap-2">
                  {appt.questions.map((q, i) => (
                    <li
                      key={`${q}-${i}`}
                      className="flex gap-3 rounded-xl bg-secondary p-3 text-sm leading-6"
                    >
                      <Check className="mt-1 size-4 shrink-0 text-primary" />
                      {q}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Visit notes</CardTitle>
                <CardDescription>
                  Stored locally. Nothing is sent to the provider.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-32 rounded-xl"
                  value={appt.notes}
                  onChange={(e) =>
                    updateAppointment(appt.id, { notes: e.target.value })
                  }
                  placeholder="What did you discuss?"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <section className="mt-8">
        <PanelTitle
          title="Medications and supplements"
          description="Record what you take; Aegis never recommends starting, stopping, or changing a dose."
        />
        <Card>
          <CardContent>
            <form
              onSubmit={addMedication}
              className="grid gap-3 md:grid-cols-2"
            >
              <Input
                className={fieldClass}
                placeholder="Name"
                aria-label="Medication name"
                value={medDraft.name}
                onChange={(e) =>
                  setMedDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
              <Input
                className={fieldClass}
                placeholder="Dose text"
                aria-label="Dose text"
                value={medDraft.dose}
                onChange={(e) =>
                  setMedDraft((d) => ({ ...d, dose: e.target.value }))
                }
              />
              <Input
                className={fieldClass}
                placeholder="Schedule"
                aria-label="Schedule"
                value={medDraft.schedule}
                onChange={(e) =>
                  setMedDraft((d) => ({ ...d, schedule: e.target.value }))
                }
              />
              <Input
                className={fieldClass}
                placeholder="Prescriber"
                aria-label="Prescriber"
                value={medDraft.prescriber}
                onChange={(e) =>
                  setMedDraft((d) => ({ ...d, prescriber: e.target.value }))
                }
              />
              <Button
                className="h-11 rounded-xl md:col-span-2 md:justify-self-start"
                type="submit"
              >
                <Pill />
                Add record
              </Button>
            </form>
            <div className="mt-5 grid gap-2">
              {state.medications.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-secondary p-3 text-sm"
                >
                  <span>
                    <strong>{m.name}</strong> · {m.dose || 'Dose not entered'} ·{' '}
                    {m.schedule || 'Schedule not entered'}
                  </span>
                  <button
                    aria-label={`Remove ${m.name}`}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        medications: s.medications.filter((x) => x.id !== m.id),
                      }))
                    }
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Track({
  logs,
  draft,
  setDraft,
  addLog,
}: {
  logs: LogEntry[];
  draft: { type: LogType; value: string; context: string };
  setDraft: React.Dispatch<
    React.SetStateAction<{ type: LogType; value: string; context: string }>
  >;
  addLog: (e: SyntheticEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">
        Track
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">
        Record what you notice
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Tracking is optional, never scored, and does not send information to a
        clinician.
      </p>
      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>New entry</CardTitle>
            <CardDescription>
              No diagnosis or “normal” result is inferred.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addLog} className="grid gap-4">
              <Field label="Type">
                <select
                  className={`${fieldClass} border border-input`}
                  value={draft.type}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, type: e.target.value as LogType }))
                  }
                >
                  <option>symptom</option>
                  <option>blood pressure</option>
                  <option>movement</option>
                  <option>mood</option>
                </select>
              </Field>
              <Field
                label={
                  draft.type === 'blood pressure'
                    ? 'Reading (for example 120/80)'
                    : 'What did you notice?'
                }
              >
                <Input
                  className={fieldClass}
                  required
                  value={draft.value}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, value: e.target.value }))
                  }
                />
              </Field>
              <Field
                label="Context (optional)"
                hint={
                  draft.type === 'blood pressure'
                    ? 'You can note position, cuff, and time.'
                    : 'Severity, onset, duration, or anything useful for your own record.'
                }
              >
                <Textarea
                  className="min-h-24 rounded-xl"
                  value={draft.context}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, context: e.target.value }))
                  }
                />
              </Field>
              <Button type="submit" className="h-11 rounded-xl">
                <Plus />
                Save locally
              </Button>
            </form>
            <p className="mt-4 rounded-xl bg-accent p-3 text-xs leading-5 text-accent-foreground">
              Recording this does not send it to a clinician. Do not wait for
              this app if you are concerned.
            </p>
          </CardContent>
        </Card>
        <section>
          <PanelTitle title="Your entries" />
          <div className="grid gap-3">
            {logs.length ? (
              logs.map((log) => (
                <Card key={log.id} size="sm">
                  <CardContent className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <HeartPulse className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold capitalize">
                        {log.type}: {log.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.context && (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {log.context}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No entries yet. There are no streaks and no missed-day
                  penalties.
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function You({
  state,
  setState,
  updateProfile,
  supportDraft,
  setSupportDraft,
  addSupporter,
  setDialog,
  download,
}: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  updateProfile: (p: Partial<State['profile']>) => void;
  supportDraft: { name: string; relationship: string };
  setSupportDraft: React.Dispatch<
    React.SetStateAction<{ name: string; relationship: string }>
  >;
  addSupporter: (e: SyntheticEvent<HTMLFormElement>) => void;
  setDialog: (d: DialogName) => void;
  download: (f: string, c: string, t?: string) => void;
}) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">
        You
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">
        Your settings and privacy
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Your identity, lifecycle, sharing drafts, and local data stay under your
        control.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
            <CardDescription>
              Change language density and display.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Communication style">
              <select
                className={`${fieldClass} border border-input`}
                value={state.profile.tone}
                onChange={(e) =>
                  updateProfile({
                    tone: e.target.value as State['profile']['tone'],
                  })
                }
              >
                <option value="clinical">Clinical</option>
                <option value="conversational">Conversational</option>
                <option value="minimal">Minimal</option>
              </select>
            </Field>
            <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
              <span className="text-sm font-semibold">Appearance</span>
              <Button
                variant="outline"
                onClick={() =>
                  setState((s) => ({ ...s, darkMode: !s.darkMode }))
                }
              >
                {state.darkMode ? <Sun /> : <Moon />}
                {state.darkMode ? 'Light' : 'Dark'}
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
              <span>
                <span className="block text-sm font-semibold">
                  Local reminders
                </span>
                <span className="text-xs text-muted-foreground">
                  Generic text only
                </span>
              </span>
              <button
                role="switch"
                aria-label="Toggle local reminders"
                aria-checked={state.reminders}
                onClick={() =>
                  setState((s) => ({ ...s, reminders: !s.reminders }))
                }
                className={`relative h-7 w-12 rounded-full ${state.reminders ? 'bg-primary' : 'bg-input'}`}
              >
                <span
                  className={`absolute top-1 size-5 rounded-full bg-white transition-transform ${state.reminders ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Data controls</CardTitle>
            <CardDescription>
              Exports may remain in Downloads or device backups after local
              deletion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              className="h-11 justify-start rounded-xl"
              onClick={() =>
                download(
                  'aegis-data.json',
                  JSON.stringify(state, null, 2),
                  'application/json',
                )
              }
            >
              <Download />
              Export machine-readable data
            </Button>
            <Button
              variant="outline"
              className="h-11 justify-start rounded-xl"
              onClick={() => window.print()}
            >
              <Printer />
              Print / save a readable PDF
            </Button>
            <Button
              variant="destructive"
              className="h-11 justify-start rounded-xl"
              onClick={() => setDialog('delete')}
            >
              <Trash2 />
              Delete data from this browser
            </Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Support circle</CardTitle>
            <CardDescription>
              These are local permission drafts only; no invitation is sent.
              Access defaults to none.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={addSupporter}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Input
                className={fieldClass}
                placeholder="Name"
                aria-label="Supporter name"
                value={supportDraft.name}
                onChange={(e) =>
                  setSupportDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
              <Input
                className={fieldClass}
                placeholder="Relationship"
                aria-label="Supporter relationship"
                value={supportDraft.relationship}
                onChange={(e) =>
                  setSupportDraft((d) => ({
                    ...d,
                    relationship: e.target.value,
                  }))
                }
              />
              <Button type="submit" className="h-11 rounded-xl">
                <UserRoundPlus />
                Add draft
              </Button>
            </form>
            <div className="mt-4 grid gap-2">
              {state.supporters.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-secondary p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {s.name} · {s.relationship}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No permissions granted · {s.status}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setState((x) => ({
                        ...x,
                        supporters: x.supporters.map((y) =>
                          y.id === s.id ? { ...y, status: 'revoked' } : y,
                        ),
                      }))
                    }
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lifecycle</CardTitle>
            <CardDescription>
              Change what the app shows without deleting your history.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-12 rounded-xl"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  profile: { ...s.profile, status: 'postpartum' },
                  lifecycleEvents: [
                    ...s.lifecycleEvents,
                    { state: 'postpartum', at: new Date().toISOString() },
                  ],
                }))
              }
            >
              Move to postpartum
            </Button>
            <Button
              variant="destructive"
              className="h-12 rounded-xl"
              onClick={() => setDialog('loss')}
            >
              <Heart />
              Pregnancy ended
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function UrgentDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogShell title="Do not wait for this app" onClose={onClose} wide>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-destructive">
        Urgent help · United States
      </p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        This app is not monitored and cannot guarantee a response. If you or
        someone else may be in immediate danger, call 911 or go to the nearest
        emergency department.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href="tel:911"
          className="flex min-h-14 items-center justify-between rounded-2xl bg-destructive px-5 font-semibold text-white"
        >
          Call 911 <Phone className="size-5" />
        </a>
        <a
          href="tel:988"
          className="flex min-h-14 items-center justify-between rounded-2xl border border-border bg-background px-5 font-semibold"
        >
          Call or text 988 <Phone className="size-5 text-primary" />
        </a>
      </div>
      <p className="mt-5 rounded-2xl bg-secondary p-4 text-sm leading-6 text-secondary-foreground">
        Tell the care team you are pregnant or were pregnant within the last
        year. If something feels wrong—even if it is not listed—seek care.
      </p>
      <div className="mt-5">
        <h3 className="text-sm font-semibold">Examples of warning signs</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Trouble breathing; chest pain; a severe or worsening headache;
          fainting; fever; severe belly pain; heavy bleeding; thoughts of
          harming yourself or your baby; or movement stopping or slowing during
          pregnancy. This list is not exhaustive.
        </p>
        <a
          href="https://www.cdc.gov/hearher/maternal-warning-signs/index.html"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          CDC urgent maternal warning signs
          <ChevronRight className="size-4" />
        </a>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        If calling is not supported on this device: 911 · 988 Suicide &amp;
        Crisis Lifeline.
      </p>
    </DialogShell>
  );
}

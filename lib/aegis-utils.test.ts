import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAppointmentSummary,
  getGestationalWeek,
  privacySafeCalendarTitle,
  stageLabel,
} from './aegis-utils.ts';

void test('gestational week is calculated from the due date and clamped', () => {
  assert.equal(
    getGestationalWeek('2026-12-13', new Date('2026-08-30T12:00:00')),
    24,
  );
  assert.equal(
    getGestationalWeek('2024-01-01', new Date('2026-08-30T12:00:00')),
    42,
  );
  assert.equal(getGestationalWeek(''), null);
});

void test('stage labels respect lifecycle state', () => {
  assert.equal(stageLabel('loss', ''), 'Bereavement mode');
  assert.equal(stageLabel('postpartum', ''), 'Postpartum');
});

void test('calendar titles avoid pregnancy details', () => {
  assert.equal(privacySafeCalendarTitle(), 'Personal appointment');
  assert.equal(
    privacySafeCalendarTitle('Dr. Rivera'),
    'Appointment with Dr. Rivera',
  );
});

void test('appointment summaries contain user-entered planning fields and a boundary', () => {
  const summary = buildAppointmentSummary({
    date: '2026-09-03T09:30',
    provider: 'Dr. Rivera',
    questions: ['What should I prepare?'],
    notes: 'Bring records.',
    actions: ['Schedule follow-up'],
  });
  assert.match(summary, /What should I prepare/);
  assert.match(summary, /not a medical record or diagnosis/i);
});

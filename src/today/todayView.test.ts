import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, placementLevels } from '../domain';
import { placement, session, weighIn } from '../domain/testing/builders';
import { todayView } from './todayView';

const start = placement('2026-10-08', placementLevels({ pushUps: '1-5', squats: '10-25', plank: '20-45' }));

describe('todayView', () => {
  it('offers Routine A with a preview of its Slots right after Placement', () => {
    const view = todayView([start], DEFAULT_SETTINGS, '2026-10-08', false);
    expect(view).toMatchObject({ streak: 0, doneToday: false, routineName: 'Push & core', weighInToday: null, resumable: false });
    expect(view.preview.map((p) => p.name)).toEqual(['Knee push-up', 'Bodyweight squat', 'Plank', 'Prone Y-T-W raise']);
    expect(view.preview[0]).toMatchObject({ mode: 'reps', target: 8 });
    expect(view.estimatedMinutes).toBeGreaterThanOrEqual(10);
    expect(view.estimatedMinutes).toBeLessThanOrEqual(14);
  });

  it('shows the day as done and the next Routine after a Session', () => {
    const view = todayView([start, session('2026-10-09', 'A'), session('2026-10-10', 'B')], DEFAULT_SETTINGS, '2026-10-10', false);
    expect(view).toMatchObject({ doneToday: true, streak: 2, routineName: 'Full body' });
  });

  it("shows today's Weigh-in and the Freezes left", () => {
    const view = todayView([start, weighIn('2026-10-10', 81.2)], DEFAULT_SETTINGS, '2026-10-10', true);
    expect(view).toMatchObject({ weighInToday: 81.2, freezes: 1, resumable: true });
  });
});

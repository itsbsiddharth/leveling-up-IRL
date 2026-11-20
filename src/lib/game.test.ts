import { describe, expect, it } from 'vitest';
import { Days, dayXp, emptyDay, levelInfo, questDone, rankOf, shift, streakInfo, totalXp, PENALTY_REPS, Day } from './game';

const full = (diff: Day['diff'] = 'E', extra: Partial<Day> = {}): Day => ({
  ...emptyDay(diff),
  q: diff === 'E' ? { push: 10, sit: 10, squat: 10, run: 1 } : { push: 100, sit: 100, squat: 100, run: 10 },
  ...extra,
});

describe('dates', () => {
  it('shifts across months and years', () => {
    expect(shift('2026-03-01', -1)).toBe('2026-02-28');
    expect(shift('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('xp', () => {
  it('gives partial credit and a completion bonus', () => {
    const d = emptyDay('E');
    d.q.push = 5; // half of one item = 0.5 * 60/5
    expect(dayXp(d)).toBe(6);
    expect(dayXp(full('E'))).toBe(60); // 4 * 12 + 12 bonus
    expect(dayXp(full('S'))).toBe(250);
  });
  it('counts gates with a full-clear bonus', () => {
    const d = emptyDay('E');
    d.gates.push({ kind: 'study', min: 50, full: true, at: 0 });
    expect(dayXp(d)).toBe(60);
  });
  it('never over-credits extra reps', () => {
    const d = full('E');
    d.q.push = 500;
    expect(dayXp(d)).toBe(60);
  });
});

describe('levels and ranks', () => {
  it('starts at level 1 and rolls over', () => {
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, need: 100 });
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(219)).toEqual({ level: 2, into: 119, need: 120 });
  });
  it('maps level to rank', () => {
    expect(rankOf(1).r).toBe('E');
    expect(rankOf(10).r).toBe('D');
    expect(rankOf(70).r).toBe('S');
    expect(rankOf(140).r).toBe('N');
  });
});

describe('streaks and the Penalty Zone', () => {
  const today = '2026-11-20';
  it('does not break the streak before today is done', () => {
    const days: Days = { [shift(today, -1)]: full(), [shift(today, -2)]: full() };
    expect(streakInfo(days, today).current).toBe(2);
    expect(streakInfo(days, today).zone).toBe(false);
  });
  it('opens the Penalty Zone after one missed day', () => {
    const days: Days = { [shift(today, -2)]: full(), [shift(today, -3)]: full() };
    const s = streakInfo(days, today);
    expect(s.current).toBe(0);
    expect(s.zone).toBe(true);
    expect(s.atStake).toBe(2);
  });
  it('keeps the streak when the penalty is paid', () => {
    const days: Days = {
      [today]: full('E', { pen: PENALTY_REPS }),
      [shift(today, -2)]: full(),
      [shift(today, -3)]: full(),
    };
    expect(streakInfo(days, today).current).toBe(3);
    expect(questDone(days[today])).toBe(true);
  });
  it('resets after two missed days', () => {
    const days: Days = { [today]: full('E', { pen: PENALTY_REPS }), [shift(today, -3)]: full() };
    expect(streakInfo(days, today).current).toBe(1);
  });
  it('tracks the best streak', () => {
    const days: Days = {};
    for (let i = 10; i < 15; i++) days[shift(today, -i)] = full();
    days[today] = full();
    const s = streakInfo(days, today);
    expect(s.best).toBe(5);
    expect(totalXp(days)).toBe(60 * 6);
  });
});

import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useReducer, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text } from 'react-native';
import {
  EXERCISES,
  ROUTINES,
  deriveLevels,
  deriveWeighIns,
  nextRoutineId,
  type Adjustment,
  type DomainEvent,
  type ProgressionId,
  type Rating,
  type RoutineId,
} from '../domain';
import { useAppData } from '../data/AppDataProvider';
import { adjustmentDecisionEvent } from '../data/commands';
import { cueFor } from '../session/cues';
import { describeAdjustment, ratingEvents, sessionFinishedEvent, sessionOutcome, type SessionOutcome } from '../session/finish';
import {
  currentStep,
  loadResumable,
  nextExercise,
  playerReducer,
  progressOf,
  ratableExercises,
  saveSnapshot,
  startPlayer,
  type PlayerState,
} from '../session/player';
import { useCues } from '../session/useCues';
import { StickFigure } from '../ui/StickFigure';
import { Body, Button, Card, Choice, Muted, Row, Screen, Title } from '../ui/components';
import { formatClock, formatTarget } from '../ui/format';
import { colors, font } from '../ui/theme';

const RATING_OPTIONS: { value: Rating; label: string }[] = [
  { value: 'tooEasy', label: 'Too easy' },
  { value: 'ok', label: 'OK' },
  { value: 'tooHard', label: 'Too hard' },
];

type Phase = 'playing' | 'stopped' | 'rating' | 'summary';

function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function SessionScreen() {
  const params = useLocalSearchParams<{ routine?: string; resume?: string }>();
  const { events, settings, today, kv, append } = useAppData();
  const [initial] = useState<PlayerState>(() => {
    const resumed = params.resume === '1' ? loadResumable(kv, today) : null;
    if (resumed) return resumed;
    const routineId: RoutineId = params.routine === 'short' ? 'short' : nextRoutineId(events);
    return startPlayer(routineId, deriveLevels(events), settings.session, today);
  });
  const [state, dispatch] = useReducer(playerReducer, initial);
  const [phase, setPhase] = useState<Phase>('playing');
  const [ratings, setRatings] = useState<Partial<Record<ProgressionId, Rating>>>({});
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [decided, setDecided] = useState<ProgressionId[]>([]);
  const cue = useCues(settings.session.cue);
  const previous = useRef(state);
  const finishing = useRef(false);
  const sessionRecorded = useRef(false);
  const preSession = useRef<{ events: DomainEvent[]; finished: DomainEvent } | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const decidedRef = useRef<Set<ProgressionId>>(new Set());

  useEffect(() => {
    saveSnapshot(kv, initial);
  }, [kv, initial]);

  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    if (before === state) return;
    cue(cueFor(before, state));
    if (before.index !== state.index || before.paused !== state.paused || before.routineId !== state.routineId) saveSnapshot(kv, state);
    if (state.finished && !before.finished) {
      setPhase('rating');
      if (!sessionRecorded.current) {
        sessionRecorded.current = true;
        const finished = sessionFinishedEvent(state, new Date());
        preSession.current = { events: eventsRef.current, finished };
        append([finished]);
      }
    }
  }, [state, cue, kv, append]);

  const timed = state.remaining !== null;
  useEffect(() => {
    if (phase !== 'playing' || state.finished || state.paused || !timed) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [phase, state.finished, state.paused, timed, state.index]);

  const stop = () => {
    dispatch({ type: 'pause' });
    setPhase('stopped');
  };

  const abandon = () => {
    saveSnapshot(kv, null);
    router.dismissTo('/');
  };

  const startShort = () => {
    dispatch({ type: 'replace', state: startPlayer('short', deriveLevels(events), settings.session, today) });
    setPhase('playing');
  };

  const finish = () => {
    if (finishing.current) return;
    finishing.current = true;
    const now = new Date();
    const recorded = preSession.current;
    const added = ratingEvents(state, ratings, now);
    if (recorded) setOutcome(sessionOutcome(recorded.events, [recorded.finished, ...added], settings, now));
    append(added);
    saveSnapshot(kv, null);
    setPhase('summary');
  };

  const decide = (adjustment: Adjustment, accepted: boolean) => {
    if (decidedRef.current.has(adjustment.progression)) return;
    decidedRef.current.add(adjustment.progression);
    append([adjustmentDecisionEvent(adjustment, accepted, new Date())]);
    setDecided((d) => (d.includes(adjustment.progression) ? d : [...d, adjustment.progression]));
  };

  const latest = useRef({ phase, finish, stop });
  latest.current = { phase, finish, stop };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const { phase: p, finish: f, stop: st } = latest.current;
      if (p === 'rating') { f(); return true; }
      if (p === 'playing') { st(); return true; }
      if (p === 'stopped') { dispatch({ type: 'resume' }); setPhase('playing'); return true; }
      return false;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => () => {
    if (latest.current.phase === 'rating') latest.current.finish();
  }, []);

  const routine = ROUTINES[state.routineId];

  if (phase === 'stopped') {
    return (
      <Screen fullScreen>
        <Title>Stop this Session?</Title>
        <Body>A stopped Session does not count toward your Streak.</Body>
        <Button label="Keep going" onPress={() => { dispatch({ type: 'resume' }); setPhase('playing'); }} />
        {state.routineId !== 'short' && <Button label="Do the Short Routine instead" variant="secondary" onPress={startShort} />}
        <Button label="Stop and go back" variant="danger" onPress={abandon} />
      </Screen>
    );
  }

  if (phase === 'rating') {
    return (
      <Screen fullScreen>
        <Title>How did it feel?</Title>
        <Muted>One tap per Exercise. Your Ratings tune the next Sessions.</Muted>
        {ratableExercises(state).map(({ progression, exerciseId }) => (
          <Card key={progression}>
            <Body>{EXERCISES[exerciseId].name}</Body>
            <Row>
              {RATING_OPTIONS.map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  selected={(ratings[progression] ?? 'ok') === option.value}
                  onPress={() => setRatings((r) => ({ ...r, [progression]: option.value }))}
                />
              ))}
            </Row>
          </Card>
        ))}
        <Button label="Finish Session" onPress={finish} />
      </Screen>
    );
  }

  if (phase === 'summary' && outcome) {
    const weighedToday = deriveWeighIns(events).some((w) => w.date === today);
    return (
      <Screen fullScreen>
        <Title>Session complete</Title>
        <Text style={styles.hero}>{outcome.streak}</Text>
        <Muted>day Streak</Muted>
        {outcome.newAchievements.length > 0 && (
          <Card>
            <Body>New Achievements</Body>
            {outcome.newAchievements.map((a) => <Body key={a.id}>🏆 {a.title}</Body>)}
          </Card>
        )}
        {outcome.adjustments
          .filter((a) => !decided.includes(a.progression))
          .map((adjustment) => (
            <Card key={adjustment.progression}>
              <Muted>Suggested Adjustment</Muted>
              <Body>{describeAdjustment(adjustment)}</Body>
              <Row>
                <Button label="Accept" onPress={() => decide(adjustment, true)} />
                <Button label="Not now" variant="secondary" onPress={() => decide(adjustment, false)} />
              </Row>
            </Card>
          ))}
        {settings.weighInPromptAfterSession && !weighedToday && (
          <Button label="Log today's weight" variant="secondary" onPress={() => router.push('/weigh-in')} />
        )}
        <Button label="Done" onPress={() => router.dismissTo('/')} />
      </Screen>
    );
  }

  const step = currentStep(state);
  if (!step) return null;
  const { exercise: exerciseNumber, total } = progressOf(state);
  const upNext = nextExercise(state);

  return (
    <Screen fullScreen>
      {settings.session.keepAwake && <KeepAwake />}
      <Muted>{routine.name} · Exercise {Math.max(1, exerciseNumber)} of {total}</Muted>
      <Row>
        <Button label={state.paused ? 'Resume' : 'Pause'} variant="secondary" onPress={() => dispatch({ type: state.paused ? 'resume' : 'pause' })} />
        <Button label="Stop" variant="secondary" onPress={stop} />
      </Row>

      {step.kind === 'warmup' && (
        <>
          <Muted>Warm-up</Muted>
          <Title>{step.name}</Title>
          <StickFigure illustrationKey={step.name} />
          {step.cues.map((c) => <Body key={c}>• {c}</Body>)}
          <Text style={styles.clock}>{formatClock(state.remaining ?? 0)}</Text>
          <Button label="Next" variant="secondary" onPress={() => dispatch({ type: 'done' })} />
        </>
      )}

      {step.kind === 'rest' && (
        <>
          <Title>Rest</Title>
          <Text style={styles.clock}>{formatClock(state.remaining ?? 0)}</Text>
          {upNext && (
            <>
              <Body>Up next: {EXERCISES[upNext.exerciseId].name} · {formatTarget(upNext.mode, upNext.target)}</Body>
              <StickFigure illustrationKey={upNext.exerciseId} size={110} />
            </>
          )}
          <Button label="Skip rest" variant="secondary" onPress={() => dispatch({ type: 'done' })} />
        </>
      )}

      {step.kind === 'exercise' && (
        <>
          <Muted>Round {step.round} of {routine.rounds}</Muted>
          <Title>{EXERCISES[step.exerciseId].name}</Title>
          <StickFigure illustrationKey={step.exerciseId} labels={step.mode === 'hold' ? ['Get set', 'Hold'] : undefined} />
          {EXERCISES[step.exerciseId].cues.map((c) => <Body key={c}>• {c}</Body>)}
          <Text style={styles.clock}>{step.mode === 'reps' ? `${step.target} reps` : formatClock(state.remaining ?? step.target)}</Text>
          <Button label={step.mode === 'reps' ? 'Done' : 'Done early'} onPress={() => dispatch({ type: 'done' })} />
          <Button label="Skip this Exercise" variant="secondary" onPress={() => dispatch({ type: 'skip' })} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clock: { color: colors.text, fontSize: font.clock, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  hero: { color: colors.accent, fontSize: font.hero, fontWeight: '800' },
});

import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';
import { Vibration } from 'react-native';
import type { SessionSettings } from '../domain';
import type { Cue } from './cues';

const VIBRATION: Record<Cue, number | number[]> = {
  countdown: 80,
  stepStart: 250,
  finished: [0, 300, 150, 300],
};

export function useCues(mode: SessionSettings['cue']): (cue: Cue | null) => void {
  const beep = useAudioPlayer(require('../../assets/sounds/beep.wav'));

  return useCallback(
    (cue: Cue | null) => {
      if (!cue) return;
      if (mode === 'beep' || mode === 'both') {
        void beep.seekTo(0);
        beep.play();
      }
      if (mode === 'vibrate' || mode === 'both') Vibration.vibrate(VIBRATION[cue]);
    },
    [beep, mode],
  );
}

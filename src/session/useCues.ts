import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';
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

  useEffect(() => {
    // Without this every beep takes transient audio focus and pauses the user's music.
    setAudioModeAsync({ interruptionMode: 'duckOthers' }).catch((error) => console.warn('Could not set audio mode', error));
  }, []);

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

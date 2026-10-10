// Generates assets/sounds/beep.wav: a 0.15 s, 880 Hz sine beep (16-bit mono PCM). Run: node scripts/make-beep.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const rate = 22050;
const frequency = 880;
const samples = Math.round(rate * 0.15);
const data = Buffer.alloc(samples * 2);
for (let i = 0; i < samples; i++) {
  const fade = Math.min(1, i / 200, (samples - i) / 200);
  data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * frequency * i) / rate) * 0.6 * fade * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

mkdirSync('assets/sounds', { recursive: true });
writeFileSync('assets/sounds/beep.wav', Buffer.concat([header, data]));

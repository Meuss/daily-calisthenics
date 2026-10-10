// Draws the app's icons in code and renders them to PNG. Run: pnpm icons
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const BACKGROUND = '#0B0F14';
const ACCENT = '#4ADE80';
const WHITE = '#FFFFFF';

// PUSH_UP_UP from src/illustrations/poses.ts, on its 120×100 canvas, plus a ground line.
const POSE = { head: [96, 62], neck: [88, 68], hip: [54, 80], elbow: [88, 80], hand: [88, 92], knee: [37, 86], foot: [20, 92] };
const FIGURE_CENTRE = [60, 75];
const FIGURE_WIDTH = 100;

const points = (...list) => list.map(([x, y]) => `${x},${y}`).join(' ');

/** The figure centred on a square canvas, `share` of its width (adaptive icons only show the middle ~61%). */
function figure(size, color, { share = 0.6, ground = true } = {}) {
  const scale = (size * share) / FIGURE_WIDTH;
  const tx = size / 2 - FIGURE_CENTRE[0] * scale;
  const ty = size / 2 - FIGURE_CENTRE[1] * scale;
  return `<g transform="translate(${tx} ${ty}) scale(${scale})" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    ${ground ? '<line x1="10" y1="96" x2="110" y2="96" stroke-width="3.5" opacity="0.45"/>' : ''}
    <polyline points="${points(POSE.neck, POSE.hip)}"/>
    <polyline points="${points(POSE.neck, POSE.elbow, POSE.hand)}"/>
    <polyline points="${points(POSE.hip, POSE.knee, POSE.foot)}"/>
    <circle cx="${POSE.head[0]}" cy="${POSE.head[1]}" r="7"/>
  </g>`;
}

function writePng(file, size, body, background) {
  const fill = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${fill}${body}</svg>`;
  writeFileSync(file, new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());
  console.log(`wrote ${file} (${size}×${size})`);
}

writePng('assets/icon.png', 1024, figure(1024, ACCENT, { share: 0.7 }), BACKGROUND);
writePng('assets/android-icon-foreground.png', 1024, figure(1024, ACCENT));
writePng('assets/android-icon-monochrome.png', 1024, figure(1024, WHITE));
writePng('assets/splash-icon.png', 1024, figure(1024, ACCENT, { share: 0.8 }));
writePng('assets/notification-icon.png', 96, figure(96, WHITE, { share: 0.85, ground: false }));

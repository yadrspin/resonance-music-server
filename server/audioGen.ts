import fs from 'fs';
import path from 'path';
import { MUSIC_DIR } from './config.js';

/**
 * Creates a valid PCM 16-bit stereo WAV buffer with melodic chords/tones.
 */
function generateWavBuffer(durationSeconds: number, chords: number[][]): Buffer {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  const chordDurationSamples = Math.floor(totalSamples / chords.length);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(Math.floor(i / chordDurationSamples), chords.length - 1);
    const activeChord = chords[chordIndex];

    // Envelope (fade in/out per chord)
    const chordProgress = (i % chordDurationSamples) / chordDurationSamples;
    const envelope = Math.sin(Math.PI * Math.min(chordProgress * 4, 1)) * 
                     Math.min(1, (1 - chordProgress) * 5 + 0.2);

    let leftSample = 0;
    let rightSample = 0;

    for (let f = 0; f < activeChord.length; f++) {
      const freq = activeChord[f];
      // Bass / harmony harmonics
      const osc1 = Math.sin(2 * Math.PI * freq * t);
      const osc2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.25;
      const oscSub = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.35;
      const wave = (osc1 + osc2 + oscSub) / (activeChord.length * 1.3);

      // Stereo panning
      const pan = f % 2 === 0 ? 0.35 : -0.35;
      leftSample += wave * (0.5 - pan * 0.5);
      rightSample += wave * (0.5 + pan * 0.5);
    }

    // Apply envelope and gentle master volume
    leftSample = Math.max(-1, Math.min(1, leftSample * envelope * 0.7));
    rightSample = Math.max(-1, Math.min(1, rightSample * envelope * 0.7));

    buffer.writeInt16LE(Math.floor(leftSample * 32767), offset);
    buffer.writeInt16LE(Math.floor(rightSample * 32767), offset + 2);
    offset += 4;
  }

  return buffer;
}

/**
 * Creates an attractive SVG cover art file.
 */
function createCoverSvg(title: string, subtitle: string, gradientColors: [string, string]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradientColors[0]}" />
      <stop offset="100%" stop-color="${gradientColors[1]}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.7" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)" />
  <rect width="600" height="600" fill="url(#glow)" />
  <circle cx="300" cy="240" r="140" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.3" stroke-dasharray="10 8" />
  <circle cx="300" cy="240" r="110" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4" />
  <circle cx="300" cy="240" r="40" fill="#ffffff" opacity="0.15" />
  <polygon points="290,225 320,240 290,255" fill="#ffffff" opacity="0.9" />
  <text x="300" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${title}</text>
  <text x="300" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="#cbd5e1" text-anchor="middle" letter-spacing="3">${subtitle.toUpperCase()}</text>
  <text x="300" y="550" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle" letter-spacing="4">RESONANCE HI-FI AUDIO ARCHIVE</text>
</svg>`;
}

export function seedSampleLibraryIfNeeded() {
  // Only seed demo files if using the default internal library
  if (process.env.MUSIC_DIR) {
    return;
  }

  if (!fs.existsSync(MUSIC_DIR)) {
    try {
      fs.mkdirSync(MUSIC_DIR, { recursive: true });
    } catch {
      return;
    }
  }

  try {
    const existingFiles = fs.readdirSync(MUSIC_DIR);
    if (existingFiles.length > 0) {
      return; // Already initialized
    }
  } catch {
    return;
  }

  console.log('[Seed] Generating initial native directory music archive...');

  const sampleLibrary = [
    {
      dir: 'Electronic/Synthwave',
      cover: { title: 'Neon Horizon', subtitle: 'Outrun Drive', colors: ['#6366f1', '#ec4899'] as [string, string] },
      tracks: [
        {
          name: '01 - Nightride Cruise.wav',
          duration: 16,
          chords: [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66], [164.81, 196, 246.94]], // Am - F - G - Em
        },
        {
          name: '02 - Sunset Boulevard.wav',
          duration: 18,
          chords: [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]], // C - Am - F - G
        },
        {
          name: '03 - Cyberpunk Expressway.wav',
          duration: 15,
          chords: [[146.83, 174.61, 220], [130.81, 164.81, 196], [116.54, 146.83, 174.61], [130.81, 164.81, 196]], // Dm - C - Bb - C
        }
      ]
    },
    {
      dir: 'Lo-Fi Beats/Chill Sessions',
      cover: { title: 'Coffee & Rain', subtitle: 'Lofi Study Beats', colors: ['#ca8a04', '#0f766e'] as [string, string] },
      tracks: [
        {
          name: '01 - Sunday Morning Coffee.wav',
          duration: 20,
          chords: [[174.61, 220, 261.63, 329.63], [164.81, 196, 246.94, 293.66], [146.83, 174.61, 220, 261.63], [130.81, 164.81, 196, 246.94]], // Fmaj7 - Em7 - Dm7 - Cmaj7
        },
        {
          name: '02 - Vinyl Raindrops.wav',
          duration: 16,
          chords: [[220, 261.63, 329.63, 392], [146.83, 174.61, 220, 261.63], [164.81, 196, 246.94, 329.63], [174.61, 220, 261.63, 329.63]],
        }
      ]
    },
    {
      dir: 'Ambient/Meditation & Space',
      cover: { title: 'Deep Cosmos', subtitle: 'Stellar Frequency', colors: ['#0f172a', '#3b82f6'] as [string, string] },
      tracks: [
        {
          name: '01 - Celestial Drift.wav',
          duration: 22,
          chords: [[110, 164.81, 220, 277.18], [146.83, 220, 293.66, 369.99], [98, 146.83, 196, 246.94], [110, 164.81, 220, 277.18]], // A drone
        },
        {
          name: '02 - Forest Canopy Whisper.wav',
          duration: 18,
          chords: [[130.81, 196, 261.63, 329.63], [174.61, 261.63, 349.23, 440], [146.83, 220, 293.66, 349.23], [196, 246.94, 293.66, 392]],
        }
      ]
    },
    {
      dir: 'Jazz & Soul/Acoustic Trio',
      cover: { title: 'Midnight Blue', subtitle: 'Late Night Session', colors: ['#1e1b4b', '#9333ea'] as [string, string] },
      tracks: [
        {
          name: '01 - Velvet Smoke.wav',
          duration: 17,
          chords: [[146.83, 174.61, 220, 261.63], [196, 246.94, 293.66, 349.23], [130.81, 164.81, 196, 246.94], [220, 277.18, 329.63, 392]], // ii-V-I-VI in C
        },
        {
          name: '02 - Blue Note Promenade.wav',
          duration: 19,
          chords: [[220, 261.63, 329.63, 392], [146.83, 174.61, 220, 261.63], [196, 246.94, 293.66, 349.23], [261.63, 329.63, 392, 493.88]],
        }
      ]
    },
    {
      dir: 'Rock & Indie/Acoustic',
      cover: { title: 'Desert Highway', subtitle: 'Frontier Guitars', colors: ['#7c2d12', '#ea580c'] as [string, string] },
      tracks: [
        {
          name: '01 - Open Horizon.wav',
          duration: 16,
          chords: [[196, 246.94, 293.66], [146.83, 220, 293.66], [164.81, 196, 246.94], [261.63, 329.63, 392]], // G - D - Em - C
        }
      ]
    }
  ];

  for (const group of sampleLibrary) {
    const fullDir = path.join(MUSIC_DIR, group.dir);
    fs.mkdirSync(fullDir, { recursive: true });

    // Create cover art image
    const coverSvg = createCoverSvg(group.cover.title, group.cover.subtitle, group.cover.colors);
    fs.writeFileSync(path.join(fullDir, 'cover.svg'), coverSvg, 'utf-8');

    // Create tracks
    for (const track of group.tracks) {
      const wavBuffer = generateWavBuffer(track.duration, track.chords);
      fs.writeFileSync(path.join(fullDir, track.name), wavBuffer);
    }
  }

  console.log('[Seed] Sample library successfully initialized with 5 folders and 10 tracks!');
}

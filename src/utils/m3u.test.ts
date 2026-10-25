import test from 'node:test';
import assert from 'node:assert/strict';
import { parseM3U, serializeM3U8 } from './m3u.js';
import { Track } from '../types/music.js';

test('m3u - serializes tracks into Extended M3U8 format', () => {
  const sampleTracks: Track[] = [
    {
      id: '1',
      filename: 'Nightride.mp3',
      path: 'Electronic/Synthwave/Nightride.mp3',
      directory: 'Electronic/Synthwave',
      title: 'Nightride FM',
      artist: 'Kavinsky Wave',
      album: 'Outrun Drive',
      duration: 185.4,
      format: 'mp3',
      size: 4500000,
    },
    {
      id: '2',
      filename: 'Rain.flac',
      path: 'Ambient/Rain.flac',
      directory: 'Ambient',
      title: 'Rainforest Chill',
      artist: 'Nature Sounds',
      album: 'Earth Tones',
      duration: 320,
      format: 'flac',
      size: 18000000,
    },
  ];

  const m3uContent = serializeM3U8('Chill Vibes', sampleTracks);
  assert.ok(m3uContent.includes('#EXTM3U'));
  assert.ok(m3uContent.includes('#PLAYLIST:Chill Vibes'));
  assert.ok(m3uContent.includes('#EXTINF:185,Kavinsky Wave - Nightride FM'));
  assert.ok(m3uContent.includes('Electronic/Synthwave/Nightride.mp3'));
  assert.ok(m3uContent.includes('#EXTINF:320,Nature Sounds - Rainforest Chill'));
  assert.ok(m3uContent.includes('Ambient/Rain.flac'));
});

test('m3u - parses standard and extended M3U strings', () => {
  const rawM3U = `#EXTM3U
#PLAYLIST:Workout Session
#EXTINF:210,Daft Sound - Aerodynamic
Electronic/French Touch/aerodynamic.mp3
#EXTINF:155,Just Title Without Artist
Rock/guitar_solo.wav
Simple/Path/Track.ogg
`;

  const parsed = parseM3U(rawM3U);
  assert.equal(parsed.playlistName, 'Workout Session');
  assert.equal(parsed.entries.length, 3);

  assert.equal(parsed.entries[0].duration, 210);
  assert.equal(parsed.entries[0].artist, 'Daft Sound');
  assert.equal(parsed.entries[0].title, 'Aerodynamic');
  assert.equal(parsed.entries[0].path, 'Electronic/French Touch/aerodynamic.mp3');

  assert.equal(parsed.entries[1].duration, 155);
  assert.equal(parsed.entries[1].title, 'Just Title Without Artist');
  assert.equal(parsed.entries[1].artist, undefined);
  assert.equal(parsed.entries[1].path, 'Rock/guitar_solo.wav');

  assert.equal(parsed.entries[2].path, 'Simple/Path/Track.ogg');
  assert.equal(parsed.entries[2].duration, undefined);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeRelativePath, isPathInsideRoot } from './pathSafety.js';

test('pathSafety - sanitizeRelativePath cleans standard valid paths', () => {
  assert.equal(sanitizeRelativePath('Electronic/Synthwave/track.mp3'), 'Electronic/Synthwave/track.mp3');
  assert.equal(sanitizeRelativePath('Jazz/Miles Davis'), 'Jazz/Miles Davis');
  assert.equal(sanitizeRelativePath('/Music/Rock/'), 'Music/Rock');
});

test('pathSafety - sanitizeRelativePath blocks directory traversal attempts', () => {
  assert.equal(sanitizeRelativePath('../../etc/passwd'), '');
  assert.equal(sanitizeRelativePath('../secret.flac'), '');
  assert.equal(sanitizeRelativePath('Rock/../../secret.flac'), '');
  assert.equal(sanitizeRelativePath('Rock/Sub/../Track.mp3'), 'Rock/Track.mp3');
});

test('pathSafety - sanitizeRelativePath handles null bytes and Windows backslashes', () => {
  assert.equal(sanitizeRelativePath('Ambient\\Rain.ogg'), 'Ambient/Rain.ogg');
  assert.equal(sanitizeRelativePath('Electronic\0/Track.mp3'), 'Electronic/Track.mp3');
});

test('pathSafety - isPathInsideRoot checks boundary containment', () => {
  const root = '/var/music';
  assert.equal(isPathInsideRoot(root, '/var/music/Rock/track.mp3'), true);
  assert.equal(isPathInsideRoot(root, '/var/music'), true);
  assert.equal(isPathInsideRoot(root, '/var/music_other/track.mp3'), false);
  assert.equal(isPathInsideRoot(root, '/etc/passwd'), false);
});

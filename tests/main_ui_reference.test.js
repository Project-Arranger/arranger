import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(root, path), 'utf8');

const mainView = read('src/components/MainComposerView.jsx');
const transport = read('src/components/TransportBar.jsx');
const perc = read('src/components/PercMatrix.jsx');
const percNotes = read('src/data/percNotes.js');
const tokens = read('src/styles/tokens.css');

assert.match(tokens, /--surface-dim:\s*#dad9e2/i);
assert.match(tokens, /--primary:\s*#3555b7/i);
assert.match(tokens, /--play-state:\s*#4ADE80/i);
assert.match(tokens, /--accent-percussion-kick:\s*#A5B4FC/i);

assert.match(transport, /Aria DAW/);
assert.match(transport, /Project Alpha/);
assert.match(transport, /POSITION/);
assert.match(transport, /SIG/);
assert.match(transport, /Export/);

assert.match(mainView, /timeline-ruler/);
assert.equal((mainView.match(/ruler-bar/g) || []).length, 1);
assert.match(mainView, /Array\.from\(\{ length: totalBars \}/);
assert.match(mainView, /arrangement-section/);

assert.match(perc, /DRUM SEQUENCER/);
assert.match(perc, /为本小节生成基础律动/);
assert.match(perc, /全局生成基础律动/);
assert.match(percNotes, /PERC_COLUMNS = 16/);
assert.match(percNotes, /kick/);
assert.match(percNotes, /snare/);
assert.match(percNotes, /hihat/);
assert.doesNotMatch(percNotes, /clap/);
assert.doesNotMatch(percNotes, /tom/);

console.log('main UI reference contract passed');

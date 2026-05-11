import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(root, path), 'utf8');

const mainView = read('src/components/MainComposerView.jsx');
const contextArea = read('src/components/ContextArea.jsx');
const mainCss = read('src/components/MainComposerView.css');
const tokens = read('src/styles/tokens.css');
const transport = read('src/components/TransportBar.jsx');
const perc = read('src/components/PercMatrix.jsx');
const percNotes = read('src/data/percNotes.js');

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
assert.match(mainView, /track-source-list/);
assert.match(mainView, /track-add-editor-btn/);
assert.match(mainView, /track-remove-editor-btn/);
assert.match(mainView, /removeEditorTrack/);
assert.match(mainView, /editor-track-lanes/);
assert.match(mainView, /editor-track-empty-state/);
assert.match(mainView, /editor-track-prebar/);
assert.match(mainView, /editor-track-bar-grid/);
assert.match(mainView, /split-resize-handle/);
assert.match(mainView, /arrangementHeight/);
assert.match(mainView, /source-add-track-row/);
assert.match(contextArea, /activeEditorTrackEntry/);
assert.match(contextArea, /empty-editor-state/);
assert.match(tokens, /--track-sidebar-width:\s*clamp\(214px,\s*17vw,\s*280px\)/);
assert.match(tokens, /--editor-prebar-width:\s*clamp\(136px,\s*9vw,\s*144px\)/);
assert.match(tokens, /--grid-min-width:\s*clamp\(880px,\s*72vw,\s*1040px\)/);
assert.match(mainCss, /\.editor-track-grid-surface \.track-row-beat/);
assert.match(mainCss, /\.editor-track-grid-surface \.track-row-step/);
assert.match(mainCss, /editor-track-grid-surface-filled/);
assert.match(mainCss, /editor-track-grid-surface-perc/);

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

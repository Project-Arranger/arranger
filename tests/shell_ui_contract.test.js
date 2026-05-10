import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFile(path) {
  assert(existsSync(join(root, path)), `Expected ${path} to exist`);
}

function assertIncludes(path, text) {
  const source = read(path);
  assert(source.includes(text), `Expected ${path} to include ${text}`);
}

assertFile('src/styles/tokens.css');
assertIncludes('src/index.css', "@import './styles/tokens.css';");
assertIncludes('src/styles/tokens.css', '--color-bg-app');
assertIncludes('src/styles/tokens.css', '--tutorial-panel-width');
assertIncludes('src/styles/tokens.css', '--touch-target-min');

assertFile('src/components/TutorialOverlay.jsx');
assertFile('src/components/TutorialOverlay.css');
assertIncludes('src/components/TutorialOverlay.jsx', 'export default function TutorialOverlay');
assertIncludes('src/components/TutorialOverlay.jsx', 'onNext');
assertIncludes('src/components/TutorialOverlay.jsx', 'onSkip');
assertIncludes('src/components/TutorialOverlay.jsx', 'onRestart');

assertIncludes('src/components/MainComposerView.jsx', "import TutorialOverlay from './TutorialOverlay';");
assertIncludes('src/components/MainComposerView.jsx', '<TutorialOverlay');
assertIncludes('src/components/MainComposerView.jsx', 'data-tutorial-target="track-overview"');
assertIncludes('src/components/TransportBar.jsx', 'data-tutorial-target="transport-play"');

console.log('shell ui contract passed');

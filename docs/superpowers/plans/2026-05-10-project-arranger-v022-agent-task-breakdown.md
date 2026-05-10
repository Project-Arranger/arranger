# Project Arranger v0.22 Agent Task Breakdown

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for parallel execution or `superpowers:executing-plans` for inline execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break `docs/PROJECT_ARCHITECTURE_AGENT_PLAN.md` into agent-ready, low-conflict implementation tasks for Project Arranger v0.22.

**Architecture:** Main Integrator owns shared contracts, store boundaries, merge order, and final flow. Feature agents work in separate ownership zones after Phase 1 creates stable interfaces for commands, tutorial state, matrix access, audio APIs, and persistence.

**Tech Stack:** Vite, React, Zustand, Tone.js, Framer Motion, CSS, optional TypeScript only for newly isolated contract files if the integrator chooses to enable it.

---

## Current Code Map

- `src/store/useMusicStore.js`: central Zustand store; currently mixes transport, matrix, context UI, chord, bass, percussion, lead, JSON import/export, and hardware placeholder responsibilities.
- `src/audio/AudioEngine.js`: Tone.js engine; owns playback, seek, previews, volume, offline WAV export, and sampler fallback behavior.
- `src/components/MainComposerView.jsx`: app shell; currently owns drag state, track overview clicks, delete zone, `ChordTrack`, `TrackRow`, and `ContextArea`.
- `src/components/TransportBar.jsx`: top bar; owns playback commands, BPM, key/scale selectors, volume side effects through `AudioEngine`, and WAV export.
- `src/components/ContextArea.jsx`: bottom editor switcher for chord, bass, percussion, and lead.
- `src/components/ChordEditor.jsx`: current drag-first chord editor; should be replaced as the v0.22 primary chord workflow.
- `src/components/ChordTrack.jsx`: current drop target and chord block renderer; should keep matrix rendering but accept command-driven writes.
- `src/components/PercMatrix.jsx`: current percussion editor; uses 8 visible eighth-note columns while writing to 16-step matrix positions.
- `src/data/chords.js`, `src/data/percNotes.js`, `src/data/bassNotes.js`, `src/data/leadNotes.js`: existing music data and grid helpers.
- `package.json`: available verification commands are `npm run lint` and `npm run build`; no test runner is configured yet.

## Integration Rules

- Main Integrator is not a delegated agent. It stays in the main session and reviews every agent handoff.
- UI and Tutorial work must follow `docs/V022_UI_DECISIONS.md`.
- No feature agent should rewrite `src/store/useMusicStore.js` directly after Phase 1, except through its assigned slice file.
- New command-driven work should route through `src/input/commandDispatcher.js`; React components should call commands instead of calling hardware-specific logic.
- Audio side effects should be invoked by command handlers or dedicated UI callbacks, not inside pure tutorial validators.
- The old drag chord path can stay temporarily behind the new chord workflow, but v0.22 acceptance uses the command/button flow as the primary path.
- Every agent handoff must include changed files, verification run, known risk, and manual test notes.

## Dependency Graph

1. Phase 0 decisions can happen before coding and unblock final interaction copy.
2. Phase 1 shared contracts must land before Agents 2-6 begin feature work.
3. Agents 1, 2, 3, 4, 5, and 6 can run in parallel after Phase 1 if they stay inside their ownership zones.
4. Phase 3 integration starts after Agent 2 tutorial contracts, Agent 5 input dispatcher, and at least one playable Perc/Chord path exist.
5. Agent 7 QA starts lightweight during Phase 1, then expands after Phase 3 integration.

---

## Phase 0: Product Rule Lock

### Task P0-1: Lock MVP Rule Defaults

**Owner:** Main Integrator

**Files:**
- Modify: `docs/PROJECT_ARCHITECTURE_AGENT_PLAN.md`
- Create: `docs/V022_PRODUCT_RULES.md`
- Create: `docs/V022_UI_DECISIONS.md`

- [ ] Confirm v0.22 defaults in `docs/V022_PRODUCT_RULES.md`: 8 chord logic keys, percussion stored as 16 steps with 8 educational eighth positions, Lead included, Bass auto-root only, Export as placeholder unless existing WAV export remains stable.
- [ ] Confirm UI defaults in `docs/V022_UI_DECISIONS.md`: real UI overlay tutorial, fixed right-side panel, panel width within 1/4 screen, light mask with glowing target highlight, non-target clicks allowed with reminder, manual next-step progression after completion, and configurable tutorial copy.
- [ ] Add a short "v0.22 locked defaults" section near Phase 0 in `docs/PROJECT_ARCHITECTURE_AGENT_PLAN.md`.
- [ ] Verify no task below depends on unresolved Phase 0 questions.
- [ ] Run `npm run lint`.
- [ ] Commit: `docs: lock v022 product rules`.

**Acceptance:** Feature agents can implement without asking how many chord keys, whether Bass is taught, or whether Export is in scope.

---

## Phase 1: Shared Architecture Scaffold

### Task MI-1: Shared Music Constants

**Owner:** Main Integrator

**Files:**
- Create: `src/domain/musicConstants.js`
- Modify: `src/store/useMusicStore.js`
- Modify: `src/data/bassNotes.js`

- [ ] Create `src/domain/musicConstants.js` exporting `TOTAL_BARS`, `STEPS_PER_BAR`, `BEATS_PER_BAR`, `CHORD_SPAN`, `TRACK_IDS`, `PERC_INSTRUMENT_IDS`, `ROOT_KEY`, `SCALE`, and `DEFAULT_BPM`.
- [ ] Replace duplicated constants in `src/store/useMusicStore.js` with imports from `src/domain/musicConstants.js`.
- [ ] Keep the existing named exports from `src/store/useMusicStore.js` for compatibility with current components.
- [ ] Check whether `src/data/bassNotes.js` owns `eighthToStep`; keep that helper there or re-export it from `src/domain/musicConstants.js` so existing imports remain valid.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit: `refactor: centralize music constants`.

**Acceptance:** Existing UI builds with constants imported from one source, and current components do not need behavior changes.

### Task MI-2: Store Slice Boundary

**Owner:** Main Integrator

**Files:**
- Create: `src/store/createInitialMatrix.js`
- Create: `src/store/slices/transportSlice.js`
- Create: `src/store/slices/matrixSlice.js`
- Create: `src/store/slices/contextSlice.js`
- Modify: `src/store/useMusicStore.js`

- [ ] Move `createEmptyMatrix` into `src/store/createInitialMatrix.js`.
- [ ] Move transport state/actions into `src/store/slices/transportSlice.js`: `bpm`, `isPlaying`, `rootKey`, `scale`, `seekBar`, `seekBeat`, `currentBar`, `currentStep`, `dragProgress`, `play`, `pause`, `stop`, `setBpm`, `setRootKey`, `setScale`, `setSeekBar`, `setSeekPosition`, `setPosition`, `setDragProgress`.
- [ ] Move matrix primitives into `src/store/slices/matrixSlice.js`: `matrix`, `setCell`, `clearStep`, `clearTrack`, `clearMatrix`.
- [ ] Move bottom-panel state into `src/store/slices/contextSlice.js`: `activeContextTrack`, `selectedBar`, `selectedChordBlock`, `setActiveContextTrack`, `setSelectedBar`, `setSelectedChordBlock`.
- [ ] Compose slices in `src/store/useMusicStore.js` with the same public selector names used by current components.
- [ ] Keep chord, bass, percussion, lead, import/export, and hardware placeholder actions in `useMusicStore.js` until feature agents move them to their own files.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit: `refactor: split core music store slices`.

**Acceptance:** Existing app still runs through the same imports while future agents can add domain slices without repeatedly editing one large store file.

### Task MI-3: AppCommand Contract

**Owner:** Main Integrator

**Files:**
- Create: `src/input/appCommands.js`
- Create: `src/input/commandTargets.js`
- Create: `src/input/commandGuards.js`
- Modify: `src/store/useMusicStore.js`

- [ ] Create `APP_COMMAND_TYPES` values for every command listed in `docs/PROJECT_ARCHITECTURE_AGENT_PLAN.md`.
- [ ] Create JSDoc typedefs for `TransportCommand`, `TutorialCommand`, `PercCommand`, `ChordCommand`, `LeadCommand`, and `AppCommand`.
- [ ] Create `isValidAppCommand(command)` in `src/input/commandGuards.js` with explicit type and payload checks for bar, step, instrument, option index, and note.
- [ ] Create `COMMAND_TARGETS` in `src/input/commandTargets.js` to group commands by `transport`, `tutorial`, `perc`, `chord`, and `lead`.
- [ ] Replace `onHardwareMessage` placeholder in `src/store/useMusicStore.js` with a note pointing to the future dispatcher, without wiring behavior yet.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit: `feat: define app command contract`.

**Acceptance:** Agents can import command names and validation without inventing new strings.

### Task MI-4: Tutorial Contract Scaffold

**Owner:** Main Integrator

**Files:**
- Create: `src/tutorial/tutorialTypes.js`
- Create: `src/tutorial/tutorialStepIds.js`
- Create: `src/tutorial/tutorialSteps.js`

- [ ] Define JSDoc typedefs for `TutorialStep`, `TutorialTarget`, `TutorialCompletion`, and `TutorialPlayback` in `src/tutorial/tutorialTypes.js`.
- [ ] Define stable IDs in `src/tutorial/tutorialStepIds.js` for intro, UI overview, percussion tasks 1-4, chord template, chord color, passing chord, tension release, lead performance, and completion.
- [ ] Add a first draft `TUTORIAL_STEPS` array in `src/tutorial/tutorialSteps.js` using the fields from the architecture plan.
- [ ] Make each step include `id`, `track`, `prompt`, `completion`, and only include `target` and `playback` where they are needed.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit: `feat: add tutorial step contract`.

**Acceptance:** Tutorial Engine agent can implement state and validators against real step IDs instead of prose.

### Task MI-5: Integration Branch and Handoff Rules

**Owner:** Main Integrator

**Files:**
- Create: `docs/AGENT_HANDOFF_TEMPLATE.md`
- Create: `docs/INTEGRATION_LOG.md`

- [ ] Create a handoff template with sections: owner, task IDs, changed files, verification commands, manual checks, known risks, follow-up tasks.
- [ ] Create an integration log with one entry per merge window and checkboxes for lint, build, tutorial smoke, audio smoke, and kiosk smoke.
- [ ] Define branch naming in the log: `codex/v022-shell`, `codex/v022-tutorial`, `codex/v022-perc`, `codex/v022-chord`, `codex/v022-input`, `codex/v022-audio-persistence`, `codex/v022-qa`.
- [ ] Commit: `docs: add agent handoff process`.

**Acceptance:** Every parallel agent has the same handoff shape and the integrator has a merge checklist.

---

## Phase 2: Parallel Feature Agents

### Agent 1 Task A1-1: Design Tokens

**Owner:** Agent 1 - Design System + Shell UI

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/index.css`
- Modify: `src/components/MainComposerView.css`
- Modify: `src/components/TransportBar.css`
- Modify: `src/components/TrackRow.css`
- Modify: `src/components/ContextArea.css`

- [ ] Move reusable colors, spacing, radii, shadows, z-indexes, track dimensions, and touch target sizes into CSS custom properties in `src/styles/tokens.css`.
- [ ] Import `src/styles/tokens.css` from `src/index.css`.
- [ ] Replace duplicated hard-coded values in the listed component CSS files with token references.
- [ ] Preserve the current dark studio look while improving kiosk touch target consistency.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Handoff with screenshots or manual viewport notes for desktop and kiosk-width landscape.

**Acceptance:** Visual style remains recognizable, and later UI work can reuse token names instead of adding one-off values.

### Agent 1 Task A1-2: App Shell and Tutorial Slots

**Owner:** Agent 1 - Design System + Shell UI

**Files:**
- Modify: `src/components/MainComposerView.jsx`
- Modify: `src/components/MainComposerView.css`
- Create: `src/components/TutorialOverlay.jsx`
- Create: `src/components/TutorialOverlay.css`

- [ ] Add a stable shell layout for top bar, track overview, left labels, bottom context, and tutorial overlay mount.
- [ ] Add `TutorialOverlay` as a presentational component that accepts `step`, `targetRect`, `onNext`, `onSkip`, and `onRestart`.
- [ ] Follow `docs/V022_UI_DECISIONS.md`: fixed right-side panel, width within 1/4 screen, light mask, glowing target highlight, and no copied interactive UI inside the tutorial panel.
- [ ] Do not implement tutorial state or validators in this task.
- [ ] Keep current drag state logic working while making room for the new chord composer.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Handoff manual notes confirming no text overlap at 1280x720 and 1920x1080.

**Acceptance:** Tutorial Engine agent can connect state to an overlay without changing shell structure.

### Agent 1 Task A1-3: Track Row Kiosk Polish

**Owner:** Agent 1 - Design System + Shell UI

**Files:**
- Modify: `src/components/TrackRow.jsx`
- Modify: `src/components/TrackRow.css`
- Modify: `src/components/ChordTrack.jsx`
- Modify: `src/components/ChordTrack.css`

- [ ] Standardize track label, selection, playhead, seek highlight, volume, and clear controls across Chord/Bass/Perc/Lead rows.
- [ ] Ensure track clear controls are large enough for touch and do not steal ordinary row selection clicks.
- [ ] Preserve current matrix data rendering.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Shell UI can support tutorial highlighting and hardware-driven commands without layout shifts.

### Agent 2 Task A2-1: Tutorial Store Slice

**Owner:** Agent 2 - Tutorial Engine

**Files:**
- Create: `src/store/slices/tutorialSlice.js`
- Modify: `src/store/useMusicStore.js`
- Modify: `src/tutorial/tutorialSteps.js`

- [ ] Add tutorial state: `currentTutorialStepId`, `completedStepIds`, `isTutorialActive`, `tutorialHighlightTarget`, and `lastCompletedTaskAt`.
- [ ] Add tutorial actions: `startTutorial`, `goToTutorialStep`, `completeTutorialStep`, `nextTutorialStep`, `setTutorialHighlightTarget`, and `resetTutorial`.
- [ ] Compose `tutorialSlice` in `src/store/useMusicStore.js`.
- [ ] Ensure the default current step is the intro step from `tutorialStepIds.js`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Components can read tutorial state through `useMusicStore` without knowing how steps are stored.

### Agent 2 Task A2-2: Completion Evaluators

**Owner:** Agent 2 - Tutorial Engine

**Files:**
- Create: `src/tutorial/completionEvaluators.js`
- Create: `src/tutorial/tutorialSelectors.js`
- Modify: `src/store/slices/tutorialSlice.js`

- [ ] Implement `getCurrentTutorialStep(state)`.
- [ ] Implement `isTutorialStepComplete(step, state)` for `manual`, `cell-count`, `chord-choice`, and `lead-play`.
- [ ] For `cell-count`, count active matrix cells under the step target track and optional bar/instrument filters.
- [ ] For `chord-choice`, verify selected or confirmed chord option state supplied later by Agent 4; return false when chord workflow state is absent.
- [ ] For `lead-play`, verify at least one recent lead note event or lead matrix entry in the target range.
- [ ] Wire `completeTutorialStep` to guard against completing a step whose evaluator returns false, except manual steps.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Task completion logic is pure, testable, and not tied to UI components.

### Agent 2 Task A2-3: Tutorial Overlay Integration

**Owner:** Agent 2 - Tutorial Engine

**Files:**
- Modify: `src/components/TutorialOverlay.jsx`
- Modify: `src/components/TutorialOverlay.css`
- Modify: `src/components/MainComposerView.jsx`

- [ ] Connect `TutorialOverlay` to the current step through selectors.
- [ ] Resolve DOM target rectangles from step targets using stable `data-tutorial-target` attributes.
- [ ] Add next/complete behavior through tutorial store actions.
- [ ] Keep completed operation steps waiting for the user to click "Next"; do not auto-advance after completion.
- [ ] Allow non-target clicks, but surface a reminder in the right-side tutorial panel.
- [ ] Keep overlay usable when a target element is missing by showing a non-blocking prompt at the bottom.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** A user can advance manual intro steps and see target highlights for track-related steps.

### Agent 3 Task A3-1: Percussion Data and Store Actions

**Owner:** Agent 3 - Percussion Workflow

**Files:**
- Modify: `src/data/percNotes.js`
- Create: `src/store/slices/percussionSlice.js`
- Modify: `src/store/useMusicStore.js`

- [ ] Limit v0.22 teaching instruments to `kick`, `snare`, and `hihat`, while keeping existing `tom` and `clap` data available only if current UI still needs them outside tutorial mode.
- [ ] Move `togglePercNote` and `autoFillPercGroove` into `percussionSlice`.
- [ ] Add `setPercStep({ bar, step, instrument, enabled })` for command-driven writes.
- [ ] Add `countPercHits({ bar, instrument })` selector/action helper for tutorial evaluators.
- [ ] Preserve existing `togglePercNote(barIndex, eighthIndex, instrumentId)` compatibility for current `PercMatrix`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Percussion can be controlled by both current UI and future `perc.toggle` commands.

### Agent 3 Task A3-2: 16-Step Percussion Matrix

**Owner:** Agent 3 - Percussion Workflow

**Files:**
- Modify: `src/components/PercMatrix.jsx`
- Modify: `src/components/PercMatrix.css`

- [ ] Render the underlying 16 steps while visually grouping pairs into 8 educational eighth positions.
- [ ] Keep large touch targets for kick, snare, and hihat.
- [ ] Add drag-across toggling for touch/mouse so users can paint a rhythm.
- [ ] Trigger `audioEngine.playPercPreview(instrument)` when a hit is enabled.
- [ ] Mark cells with `data-tutorial-target` values for tutorial highlighting.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Percussion UI teaches 8 easy positions while storing precise 16-step data.

### Agent 3 Task A3-3: Percussion Tutorial Tasks

**Owner:** Agent 3 - Percussion Workflow

**Files:**
- Modify: `src/tutorial/tutorialSteps.js`
- Modify: `src/tutorial/completionEvaluators.js`
- Modify: `src/components/PercMatrix.jsx`

- [ ] Define four percussion tasks: add kick pulse, add snare backbeat, add hihat motion, use or confirm basic groove.
- [ ] Add task-specific targets for instrument rows and bar positions.
- [ ] Ensure each successful cell change can request tutorial re-evaluation without importing tutorial UI into `PercMatrix`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** The tutorial can detect all four percussion task completions from matrix state.

### Agent 4 Task A4-1: Chord Workflow State

**Owner:** Agent 4 - Chord Composer

**Files:**
- Create: `src/chords/chordWorkflow.js`
- Create: `src/store/slices/chordSlice.js`
- Modify: `src/store/useMusicStore.js`

- [ ] Move `setChordBlock`, `removeChordBlock`, `replaceChordBlock`, and `applyOrganizeTransition` into `chordSlice`.
- [ ] Preserve existing public action names used by `ChordTrack` and `ChordVariationDrawer`.
- [ ] Add chord workflow state: `selectedChordTemplateId`, `selectedChordOptionIndex`, `confirmedChordChoices`, and `chordWorkflowStage`.
- [ ] Add command-friendly actions: `selectChordTemplate`, `selectChordOption`, `confirmChordOption`, `applyChordWorkflowChoice`.
- [ ] Define 8 logical chord key slots in `src/chords/chordWorkflow.js` using existing `CHORD_LIBRARY`, `CHORD_VARIATIONS`, and `ORGANIZE_TRANSITIONS`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** The new Chord Composer can write chords without using custom drag events.

### Agent 4 Task A4-2: Button-First Chord Composer

**Owner:** Agent 4 - Chord Composer

**Files:**
- Create: `src/components/ChordComposer.jsx`
- Create: `src/components/ChordComposer.css`
- Modify: `src/components/ContextArea.jsx`

- [ ] Replace `ChordEditor` as the default chord context content with `ChordComposer`.
- [ ] Implement template selection for the Doo-wop progression using the existing C-Am-F-G data.
- [ ] Implement 8 visible chord option buttons that map to logical chord keys and call chord slice actions.
- [ ] Add touch-equivalent confirm controls for color variation, passing chord, and tension release stages.
- [ ] Preview every selection with `audioEngine.playChordPreview(notes)`.
- [ ] Keep `ChordEditor` importable for temporary fallback until integration removes or hides it.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** A user can complete the primary chord flow without dragging.

### Agent 4 Task A4-3: Command-Driven Chord Track

**Owner:** Agent 4 - Chord Composer

**Files:**
- Modify: `src/components/ChordTrack.jsx`
- Modify: `src/components/ChordTrack.css`
- Modify: `src/chords/chordWorkflow.js`

- [ ] Ensure `ChordTrack` renders base, variation, passing, and tension-release chord cells from matrix state.
- [ ] Add clear visual distinction for passing/tension cells without relying on drag state.
- [ ] Keep existing drag move/delete behavior functional until the integrator explicitly removes it.
- [ ] Mark chord slots with `data-tutorial-target` values.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Chord track reflects command writes and remains stable during the transition away from drag-first UX.

### Agent 5 Task A5-1: Command Dispatcher

**Owner:** Agent 5 - Input + Hardware Adapter

**Files:**
- Create: `src/input/commandDispatcher.js`
- Create: `src/input/useCommandDispatcher.js`
- Modify: `src/App.jsx`

- [ ] Implement `dispatchAppCommand(command, deps)` with explicit handlers for transport, tutorial, percussion, chord, and lead command groups.
- [ ] Validate commands with `isValidAppCommand` before side effects.
- [ ] Route transport commands to `audioEngine` and store actions.
- [ ] Route percussion/chord/lead commands to store actions and preview APIs where appropriate.
- [ ] Expose a React hook `useCommandDispatcher()` that binds current store and audio dependencies.
- [ ] Make the dispatcher available at app root through a lightweight context or hook pattern that components can import.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Keyboard, touch, and hardware adapters can share one command path.

### Agent 5 Task A5-2: Keyboard and Touch Command Mapping

**Owner:** Agent 5 - Input + Hardware Adapter

**Files:**
- Create: `src/input/keyboardMap.js`
- Create: `src/input/useKeyboardCommands.js`
- Create: `src/input/touchCommands.js`
- Modify: `src/components/TransportBar.jsx`
- Modify: `src/components/ChordComposer.jsx`
- Modify: `src/components/PercMatrix.jsx`

- [ ] Map Space to `transport.togglePlay`, Escape to `transport.stop`, Arrow keys to seek, Enter to `tutorial.next`, and number keys 1-8 to `chord.selectOption`.
- [ ] Add focused-input guards so BPM fields and selects do not trigger global keyboard commands.
- [ ] Convert touch-specific button handlers in the listed components to dispatch `AppCommand` values where the command exists.
- [ ] Keep direct audio export logic out of the command dispatcher unless Export becomes part of v0.22 MVP.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** The same action can be triggered from UI touch and keyboard without duplicate business logic.

### Agent 5 Task A5-3: Hardware WebSocket and Mock Panel

**Owner:** Agent 5 - Input + Hardware Adapter

**Files:**
- Create: `src/hardware/hardwareEvents.js`
- Create: `src/hardware/hardwareSocket.js`
- Create: `src/hardware/useHardwareInput.js`
- Create: `src/components/HardwareMockPanel.jsx`
- Create: `src/components/HardwareMockPanel.css`
- Modify: `src/components/MainComposerView.jsx`

- [ ] Implement the `HardwareInputEvent` shape from the architecture plan in JSDoc.
- [ ] Create a WebSocket client that connects only when a hardware URL is configured, retries with backoff, and reports disconnected status without blocking touch UI.
- [ ] Map hardware button IDs to `AppCommand` values through a table in `hardwareEvents.js`.
- [ ] Add a dev-only mock panel that emits the same mapped commands for manual testing.
- [ ] Mount the mock panel only when `import.meta.env.DEV` is true.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Hardware absence never breaks browser use, and mock buttons exercise the same command dispatcher as real hardware.

### Agent 6 Task A6-1: Audio Preview API Expansion

**Owner:** Agent 6 - Audio + Persistence

**Files:**
- Modify: `src/audio/AudioEngine.js`
- Create: `src/audio/audioStatus.js`

- [ ] Add audio status states: `idle`, `starting`, `ready`, `sample-fallback`, and `error`.
- [ ] Expose `getAudioStatus()` and a callback subscription or store update path for UI status display.
- [ ] Add `playChordArpeggioPreview(notes)` using Tone scheduling after initialization.
- [ ] Add `playBars({ startBar, endBar })` or equivalent task playback API that can play selected tutorial bars without changing matrix data.
- [ ] Add `leadNoteOn(note)` and `leadNoteOff(note)` for real-time lead performance.
- [ ] Preserve existing `playChordPreview`, `playBassPreview`, `playPercPreview`, `playLeadPreview`, playback, seek, volume, and export behavior.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Tutorial and chord workflows have audio APIs without duplicating Tone.js setup.

### Agent 6 Task A6-2: Project Persistence

**Owner:** Agent 6 - Audio + Persistence

**Files:**
- Create: `src/storage/projectStorage.js`
- Create: `src/store/slices/projectSlice.js`
- Modify: `src/store/useMusicStore.js`
- Modify: `src/App.jsx`

- [ ] Implement `SavedProject` version 1 with `matrix`, `tutorialStepId`, `bpm`, `rootKey`, `scale`, `volumes`, and `updatedAt`.
- [ ] Use localStorage for v0.22 unless IndexedDB is needed for larger payloads; matrix JSON is small enough for localStorage.
- [ ] Add `saveProjectSnapshot(state)`, `loadProjectSnapshot()`, and `clearProjectSnapshot()`.
- [ ] Add project store actions: `saveProject`, `restoreProject`, `markProjectDirty`, and `setAutoSaveEnabled`.
- [ ] Auto-restore on app mount before the first tutorial overlay is shown.
- [ ] Auto-save after matrix, tutorial step, BPM, key, scale, or volume changes with a short debounce.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Refreshing the page restores arrangement data and tutorial position.

### Agent 6 Task A6-3: Export Scope Cleanup

**Owner:** Agent 6 - Audio + Persistence

**Files:**
- Modify: `src/components/TransportBar.jsx`
- Modify: `src/audio/AudioEngine.js`
- Modify: `docs/V022_PRODUCT_RULES.md`

- [ ] If Phase 0 keeps Export as placeholder, replace the top-bar WAV command with a disabled or "later" state and document why.
- [ ] If Phase 0 keeps existing WAV export, add a simple status message and failure recovery around `audioEngine.exportWav()`.
- [ ] Keep the behavior consistent with `docs/V022_PRODUCT_RULES.md`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Export behavior matches the locked MVP scope and does not surprise QA.

---

## Phase 3: Main Integration

### Task INT-1: Connect Tutorial to Feature Workflows

**Owner:** Main Integrator

**Files:**
- Modify: `src/components/MainComposerView.jsx`
- Modify: `src/tutorial/tutorialSteps.js`
- Modify: `src/tutorial/completionEvaluators.js`
- Modify: `src/input/commandDispatcher.js`
- Modify: `src/audio/AudioEngine.js`

- [ ] Verify tutorial step IDs match Perc, Chord, and Lead feature states.
- [ ] Ensure `tutorial.next` and `tutorial.completeTask` commands advance the same store state as overlay controls.
- [ ] Trigger task playback after successful percussion and chord tasks using Agent 6 playback API.
- [ ] Confirm missing target elements degrade gracefully.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Complete a manual intro-to-percussion smoke path in the browser.
- [ ] Commit: `feat: connect tutorial workflow`.

**Acceptance:** Tutorial state, UI overlay, command dispatcher, and audio task playback work as one path.

### Task INT-2: Replace Chord Drag as Primary Path

**Owner:** Main Integrator

**Files:**
- Modify: `src/components/ContextArea.jsx`
- Modify: `src/components/ChordEditor.jsx`
- Modify: `src/components/ChordTrack.jsx`
- Modify: `src/utils/dragGhost.js`

- [ ] Make `ChordComposer` the only default chord editor in v0.22.
- [ ] Hide legacy drag editor behind a dev-only fallback or remove it if no agent depends on it.
- [ ] Keep existing matrix data compatible with old saved projects.
- [ ] Remove unused drag code only after lint confirms no import uses it.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit: `feat: make chord composer primary`.

**Acceptance:** The documented v0.22 chord workflow is button/command-first.

### Task INT-3: Lead Performance Path

**Owner:** Main Integrator, with Agent 6 support if needed

**Files:**
- Modify: `src/components/LeadMatrix.jsx`
- Modify: `src/input/keyboardMap.js`
- Modify: `src/input/commandDispatcher.js`
- Modify: `src/tutorial/tutorialSteps.js`
- Modify: `src/tutorial/completionEvaluators.js`

- [ ] Add a simple lead performance mode that sends `lead.noteOn` and `lead.noteOff` commands.
- [ ] Keep current step-matrix editing if it exists, but make real-time note play the tutorial path.
- [ ] Record enough lead activity for `lead-play` completion.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit: `feat: add lead performance tutorial path`.

**Acceptance:** The final tutorial step lets a beginner play notes live and finish the teaching loop.

### Task INT-4: Persistence and Startup Flow

**Owner:** Main Integrator

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/store/useMusicStore.js`
- Modify: `src/storage/projectStorage.js`
- Modify: `src/components/TutorialOverlay.jsx`

- [ ] Verify auto-restore happens once on mount.
- [ ] Verify tutorial overlay starts from restored `tutorialStepId`.
- [ ] Verify corrupted saved data is ignored and does not crash render.
- [ ] Add a visible reset option if a user wants to restart the tutorial.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit: `feat: restore saved project on startup`.

**Acceptance:** Refresh recovery works and startup does not race with audio initialization.

---

## Phase 4: QA and Kiosk Ready

### Agent 7 Task A7-1: Test Harness Decision

**Owner:** Agent 7 - QA / Verification

**Files:**
- Modify: `package.json`
- Modify: `eslint.config.js`
- Create: `tests/README.md`

- [ ] Decide whether to add Vitest for unit tests and Playwright for E2E.
- [ ] If dependencies are approved and installed, add scripts: `test`, `test:unit`, and `test:e2e`.
- [ ] If dependencies are not available, document manual test commands and keep QA in checklist form until dependencies can be added.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** The repository has an explicit test strategy instead of an implied one.

### Agent 7 Task A7-2: Unit Coverage

**Owner:** Agent 7 - QA / Verification

**Files:**
- Create: `tests/tutorial/completionEvaluators.test.js`
- Create: `tests/input/commandGuards.test.js`
- Create: `tests/storage/projectStorage.test.js`
- Create: `tests/store/percussionSlice.test.js`
- Create: `tests/store/chordSlice.test.js`

- [ ] Test tutorial step transitions and completion checks.
- [ ] Test valid and invalid `AppCommand` payloads.
- [ ] Test saved project serialization, restore, and corrupted data fallback.
- [ ] Test percussion toggles and groove writes.
- [ ] Test chord template, option selection, confirmation, and matrix writes.
- [ ] Run the configured unit test command.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** Core logic has regression coverage independent of browser audio.

### Agent 7 Task A7-3: E2E Teaching Path

**Owner:** Agent 7 - QA / Verification

**Files:**
- Create: `tests/e2e/tutorial-flow.spec.js`
- Create: `tests/e2e/hardware-mock.spec.js`
- Create: `playwright.config.js` if Playwright is added.

- [ ] Cover the path from intro through percussion tasks, chord template, chord color, passing chord, tension release, lead performance, and refresh recovery.
- [ ] Mock audio unlock where browser policy would block unattended playback.
- [ ] Verify mock hardware buttons dispatch commands and do not require a real WebSocket.
- [ ] Run the configured E2E command.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:** The v0.22 teaching loop can be verified after each integration merge.

### Agent 7 Task A7-4: Kiosk Checklist

**Owner:** Agent 7 - QA / Verification

**Files:**
- Create: `docs/QA_CHECKLIST.md`
- Modify: `docs/INTEGRATION_LOG.md`

- [ ] Add checklist sections for static build, no CDN dependencies, landscape layout, touch target size, page refresh recovery, audio unlock, sample fallback, mock hardware, WebSocket disconnect, and performance.
- [ ] Include exact commands: `npm run lint`, `npm run build`, `npm run preview`.
- [ ] Include manual viewport checks for 1280x720 and 1920x1080.
- [ ] Link completed checklist entries from `docs/INTEGRATION_LOG.md`.
- [ ] Commit: `docs: add kiosk qa checklist`.

**Acceptance:** QA can sign off kiosk readiness without relying on memory.

---

## Suggested Parallel Dispatch

- **Round 1:** Main Integrator completes P0 and Phase 1 tasks.
- **Round 2:** Dispatch Agents 1-6 in parallel with the ownership boundaries above.
- **Round 3:** Main Integrator merges Agent 2 + Agent 5 first, then Agent 3 and Agent 4, then Agent 6, because tutorial and command contracts affect the most surfaces.
- **Round 4:** Dispatch Agent 7 after the first integrated tutorial path exists, then keep QA running on every merge window.

## Verification Baseline

- Always run: `npm run lint`
- Always run before handoff: `npm run build`
- Run after adding tests: configured unit/E2E commands from Agent 7
- Manual smoke after integration: start dev server, unlock audio with a click, play/pause, add percussion, select chord template, play lead note, refresh page, verify restore.

## Open Risks for Main Integrator

- `useMusicStore.js` is the main conflict hotspot until Phase 1 lands.
- `ChordTrack.jsx` and `MainComposerView.jsx` still depend on custom drag events; replacing the chord primary path should be staged rather than removed in one pass.
- Tone.js calls require user gestures, so automated tests need audio mocking or explicit smoke-only coverage.
- Existing `exportWav()` is substantial and should not be casually refactored during tutorial work.
- CSS is currently component-local; token migration should be visual-only and must avoid full redesign.

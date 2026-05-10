# Project Arranger v0.22 Integration Log

Main Integrator owns this file. Add one entry per merge window before combining feature-agent work.

## Branches

- Foundation: `codex/v022-foundation`
- Shell UI: `codex/v022-shell`
- Tutorial Engine: `codex/v022-tutorial`
- Percussion Workflow: `codex/v022-perc`
- Chord Composer: `codex/v022-chord`
- Input Adapter: `codex/v022-input`
- Audio + Persistence: `codex/v022-audio-persistence`
- QA / Verification: `codex/v022-qa`

## Merge Window Template

### YYYY-MM-DD: <merge window name>

- Source branches:
- Main Integrator:
- Summary:

Checklist:

- [ ] Handoff template received from every merged agent.
- [ ] Changed files reviewed for ownership conflicts.
- [ ] `npm run lint` passed.
- [ ] `npm run build` passed.
- [ ] Tutorial smoke passed.
- [ ] Audio smoke passed.
- [ ] Input command smoke passed.
- [ ] Persistence smoke passed, if touched.
- [ ] Kiosk viewport smoke passed.

Notes:

- 

## 2026-05-11: Foundation

- Source branches: `codex/v022-foundation`
- Main Integrator: Codex
- Summary: Lock product rules and create shared Phase 1 contracts before parallel feature work.

Checklist:

- [ ] Handoff template received from every merged agent.
- [ ] Changed files reviewed for ownership conflicts.
- [ ] `npm run lint` passed.
- [ ] `npm run build` passed.
- [ ] Tutorial smoke passed.
- [ ] Audio smoke passed.
- [ ] Input command smoke passed.
- [ ] Persistence smoke passed, if touched.
- [ ] Kiosk viewport smoke passed.

Notes:

- Foundation branch is not a feature-agent merge; full tutorial/audio/kiosk smoke starts after Phase 2 integration.

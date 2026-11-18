# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2026-11-18

### Added

- Portfolio certification rollout: real README (the old one was a stub left by
  the self-overwrite bug, see ISSUE_LOG.md), CONTRIBUTING.md with PR-flow
  discipline, this CHANGELOG, NOTICE attribution. Signed-deploy survey: no
  deploy target. License verified: MIT, Copyright 2026 Nrupal Akolkar.

### Fixed

- Release pipeline, and the assetless v1.0.1 release — root cause recorded:
  the v1.0.1 release run (GitHub Actions run 42252034320, 2026-11-06) failed
  at the packaging step of the Linux leg; the Windows and macOS legs were
  cancelled by matrix fail-fast and the release job was skipped, so the
  v1.0.1 GitHub release published with **no assets attached**, and no v1.0.1
  artifacts exist. The workflow was repaired later the same day (the phantom
  build step that failed the run was removed, and build-provenance
  attestation was added), but it was never re-run. This release is the first
  cut on the repaired pipeline: the platform artifacts (Linux AppImage,
  Windows portable zip, macOS tar.gz) are built, provenance-attested and
  attached by the pipeline itself.
- Dependency install (`npm ci`) failed on a dead upstream download:
  `onnxruntime-node` (via `@huggingface/transformers`) fetches its CUDA/GPU
  binary during install, and Microsoft no longer publishes that asset for
  v1.21.0 (HTTP 404), which aborted installation entirely — CI's first
  failure when this release was cut. The repo now carries an `.npmrc`
  setting the vendor-documented `onnxruntime-node-install-cuda=skip`
  switch: ONNX Runtime installs in CPU form, which is what CI, the
  release pipeline and local runs use.
- Release packaging steps repaired after the first v1.0.2 tag cut failed
  (run 44362945349, 2026-11-18; no release was published from that cut and
  the tag was re-cut on the repaired tree). The Linux step copied sources
  into a directory it never created (`cp: target ... No such file or
  directory`); it now creates `usr/lib/agent-project-builder` first. The
  same step's output move (`mv *.AppImage ...`) would also have matched
  the linuxdeploy tool's own AppImage; it now moves the generated file by
  name, and linuxdeploy runs with `APPIMAGE_EXTRACT_AND_RUN=1`, the
  documented mode for CI runners without FUSE. `src/index.js` gained its
  `#!/usr/bin/env node` shebang — the Linux and macOS packages install it
  as a directly executed file, which cannot run without one.

## [1.0.1] - 2026-11-06

### Notes

- Tagged 2026-11-06. The GitHub release carries no assets: its release
  pipeline run failed before the attach step (root cause and cure recorded
  under [1.0.2] above). No changelog entry was written at the time; this
  entry was reconstructed from the tag and release records on 2026-11-18.

## [1.0.0] - 2026-10-05

### Added

- Multi-agent project generation: CLI (`node src/index.js "<request>"`),
  interactive mode, and web GUI (`npm run server`) on `http://localhost:3000`.
- LLM backends: OpenAI API, LM Studio (local), Ollama (local), direct local
  GGUF via `node-llama-cpp` (`LlmEngine`, `ModelManager`, `ModelSelector`).
- `FileManager`/`DirectoryManager`: generated projects written to `generated/`
  (output-dir isolation), dependency install, test run, linter.
- `GitManager`: commits generated projects. Agent registry, prompt engine,
  config manager, structured logger.
- Architecture and usage docs (`docs/ARCHITECTURE.md`, `docs/USAGE.md`),
  issue log (`ISSUE_LOG.md`), security policy (`SECURITY.md`).
- CI: Ubuntu/Windows/macOS × Node 18/20 (`npm ci` → `npm test` → CLI help →
  server smoke test).

# FrameBench Analyzer — Claude Guidelines

## Project

Tauri v2 desktop app (Windows) for comparing NVIDIA GPU driver performance via frame-time CSV data. React + TypeScript frontend, Rust backend. Includes a separate landing page (`landing-page/`) deployed to GitHub Pages.

Key files:
- `src-tauri/src/lib.rs` — app setup, system tray, GPU polling loop
- `src-tauri/src/commands.rs` — all Tauri commands exposed to frontend
- `src-tauri/tauri.conf.json` — Tauri configuration
- `src/App.tsx` — main React component, file upload + analysis orchestration
- `src/lib/` — CSV parsing, analysis engine, report generation
- `landing-page/src/` — marketing landing page (React + Vite, separate app)
- `.github/workflows/release.yml` — release CI: builds, signs, publishes GitHub Release on `v*` tags
- `.github/workflows/main.yml` — CI: lint + typecheck + Vite build on every push/PR

---

## Dev vs Release: Critical Differences

Tauri dev mode (`npm run tauri:dev`) and release builds (`npm run tauri:build`) behave differently in ways that can hide bugs during development:

| Aspect | Dev | Release |
|--------|-----|---------|
| Frontend source | Vite dev server on `:5173` | Static files bundled from `dist/` |
| Devtools | Auto-opened | Not available |
| Logging plugin | Enabled | Disabled (`#[cfg(debug_assertions)]`) |
| Rust panics | May be swallowed silently | Crash the process immediately |
| Icon loading | Lenient | Strict — `None` if not configured |

**Always do a release test before considering a feature complete.** Dev working ≠ release working.

### The unwrap() trap (how we crashed on launch)

`app.default_window_icon()` returns `Option<&Image>`. In release builds it returns `None` because `"icon"` is **not a valid field** in `app.windows[0]` in Tauri v2's JSON schema — the schema validator silently removes it if added. Calling `.unwrap()` on a `None` panics the process before the window opens.

**Fix:** Use `tauri::include_image!("icons/icon.ico")` in `lib.rs` — it embeds the icon bytes at compile time and cannot fail at runtime:
```rust
// CORRECT — compile-time embed, always works:
.icon(tauri::include_image!("icons/icon.ico"))

// WRONG — panics in release when default_window_icon() returns None:
.icon(app.default_window_icon().unwrap().clone())
```

**Do NOT** try to add `"icon"` to the window config in `tauri.conf.json` — the Tauri schema rejects it.

**Rule:** Never use `.unwrap()` or `.expect()` in the Tauri `setup()` closure on anything that can be `None` or `Err` in a release build. Use `?` to propagate errors, or `if let Some(...)` to handle optionals gracefully.

---

## Rust Guidelines

- Use `?` inside `setup()` instead of `.unwrap()` — the closure returns `Result<(), Box<dyn Error>>`
- Use `.unwrap_or(default)` or `.unwrap_or_default()` for non-fatal fallbacks
- `.unwrap()` is acceptable only on `Mutex::lock()` (poisoned mutex = programming error) and compile-time constants (`env!()`)
- Any `.expect("message")` must explain a condition that truly cannot happen at runtime
- `spawn_blocking` is correct for `nvidia-smi` calls — don't move them to plain `async`

---

## Tauri Configuration Rules

- Do NOT add `"icon"` to `app.windows[0]` — it is not in the Tauri v2 schema and will be removed by the validator. The tray icon is set via `tauri::include_image!` in Rust (see above).
- `webviewInstallMode` **must be `"embedBootstrapper"`** — do NOT use `"downloadBootstrapper"` or `"skip"`. See Windows Release Requirements below.
- Always add new Tauri plugins to both `Cargo.toml` **and** `capabilities/default.json` — missing permissions silently fail in release.
- CSP is currently `null` (disabled). Keep it that way unless adding web content from external origins.

---

## Frontend Guidelines

**Always reference `docs/designsystem.md` before making any frontend changes.** It is the source of truth for colors, typography, component patterns, icons, charts, animations, and layout. Do not invent new styles — use the tokens and patterns defined there.

- Gate all Tauri-specific code behind the `isTauri` check:
  ```typescript
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  ```
- Use dynamic `import('@tauri-apps/api/core')` for Tauri API calls — never top-level import in components that also render in browser/PWA mode
- Tauri invoke calls should always have a `.catch()` or be inside try/catch — they throw if the command errors
- No Supabase or external cloud dependencies — the app is fully local/offline

---

## Pre-ship Checklist

Before any `tauri build`, verify:

1. `npm run typecheck` — zero errors
2. `npm run build` — Vite build succeeds, no console errors
3. `tauri build` — Rust compiles cleanly, no warnings about unused `Result`
4. **Launch the `.exe` from `src-tauri/target/release/`** — confirm it opens without crashing
5. System tray icon appears in the Windows notification area
6. CSV upload works for both Dataset A and B
7. GPU widget shows live data (or gracefully shows "unavailable" if no NVIDIA GPU)
8. Report download works via the native Save As dialog

---

## Adding New Tauri Commands

1. Define the function in `src-tauri/src/commands.rs` with `#[tauri::command]`
2. Register it in the `.invoke_handler(tauri::generate_handler![...])` list in `lib.rs`
3. Add required permissions to `src-tauri/capabilities/default.json`
4. Call from frontend via `invoke('command_name', { arg })` behind the `isTauri` guard

## Adding New Tauri Plugins

1. Add to `src-tauri/Cargo.toml` under `[dependencies]`
2. Initialize with `.plugin(tauri_plugin_xxx::init())` in `lib.rs`
3. Add the plugin's permission identifier to `capabilities/default.json`
4. Test in **release mode** — plugin initialization failures are silent in dev

---

## What Not to Add

- No cloud/database dependencies (Supabase, Firebase, etc.) — this is a local desktop tool
- No service workers in the Tauri build path (already gated in `src/main.tsx`)
- No hardcoded localhost URLs in frontend code — they break in release where there is no dev server
- **No external CDN font imports** (`@import url('https://fonts.googleapis.com/...')`) — WebView2 blocks rendering until the CDN responds; on machines with firewalls or no internet this causes "not responding". Always self-host fonts via `@fontsource/<font-name>` and import the weight CSS files in `src/main.tsx`.
- **No external URLs in `index.html` meta tags** — they fire network requests on every launch and expose scaffolding tool origins (bolt.new, etc.)

---

## Windows Release Requirements

- Static CRT linking is configured in `src-tauri/.cargo/config.toml` — do not remove it. Without it, the release binary requires `vcruntime140.dll` to be installed on the target machine, which may be absent on clean Windows installs.
- `webviewInstallMode` must be `"embedBootstrapper"` — do NOT use `"downloadBootstrapper"` or `"skip"`. `embedBootstrapper` bundles the small WebView2 bootstrapper (~1.7 MB) inside the NSIS setup.exe and installs it at setup time (not at app launch). `downloadBootstrapper` causes "not responding" because it downloads at app launch time, blocking the UI thread. `skip` leaves users with no WebView2 and a blank window if they're on an older Windows 10 without Edge.

---

## Auto-Update System

The app uses `tauri-plugin-updater` to check for updates on launch and show a non-blocking banner.

**How it works:**
1. On startup, the app calls `check()` from `@tauri-apps/plugin-updater` (behind the `isTauri` guard)
2. It checks `.../releases/latest/download/latest.json` on GitHub for a newer version
3. If found, a green banner appears: "Update vX.Y.Z available [Update] [Later]"
4. Clicking "Update" calls `update.downloadAndInstall()` — the NSIS installer handles the process lifecycle

**Key files:**
- `src-tauri/tauri.conf.json` — `plugins.updater` section with `pubkey` and `endpoints`
- `src-tauri/capabilities/default.json` — must include `"updater:default"`
- `src-tauri/src/lib.rs` — `.plugin(tauri_plugin_updater::Builder::new().build())`
- `src/App.tsx` — `useEffect` on mount checks for updates, `updateInfo` state drives the banner

**Signing:** The private key is stored as GitHub secret `TAURI_SIGNING_PRIVATE_KEY`. The public key is in `tauri.conf.json` as `plugins.updater.pubkey`. Never hardcode or commit the private key.

---

## Release Workflow

Releasing a new version is fully automated via `.github/workflows/release.yml`. It triggers on any `v*` tag push.

**What the workflow does:**
1. Builds the Tauri app (`npm run tauri:build`) with signing env vars
2. Generates `latest.json` (PowerShell) — the update manifest the running app checks
3. Copies the versioned NSIS installer to a **fixed filename** `FrameBench-Analyzer-Setup.exe`
4. Creates a draft GitHub Release with all artifacts: `FrameBench-Analyzer-Setup.exe`, `.nsis.zip`, `.nsis.zip.sig`, `latest.json`

**Fixed download filename — do not change:** The installer is always uploaded as `FrameBench-Analyzer-Setup.exe`. The landing page download buttons hardlink to:
`https://github.com/Vinodh-Shekhar/FrameBench-Analyzer/releases/latest/download/FrameBench-Analyzer-Setup.exe`
If you rename this file in the workflow, you must update all landing page download hrefs to match.

---

## Versioning Rules

- **Never hardcode the version string in UI.** The footer and any other UI version display must read it dynamically via `invoke('get_app_info')` (returns `{ version: string }`), stored in React state. The command reads `CARGO_PKG_VERSION` at compile time, which Tauri syncs from `tauri.conf.json`.
- **When bumping a version for release**, update the version field in **all three**: `src-tauri/tauri.conf.json`, `package.json`, and `src-tauri/Cargo.toml` — they must always match.
- **The correct release flow:**
  1. Update `version` in `src-tauri/tauri.conf.json`, `package.json`, and `src-tauri/Cargo.toml`
  2. Commit the version bump
  3. `git tag vX.Y.Z && git push origin main vX.Y.Z`
  4. GitHub Actions builds, signs, and creates a draft release — go to GitHub Releases and publish the draft
  5. Running app instances will detect the update on next launch

---

## Landing Page Rules

The landing page (`landing-page/`) is a separate Vite + React app deployed to GitHub Pages.

- All external links (GitHub, releases) must use `target="_blank" rel="noopener noreferrer"` — use the `Button` component's `target` and `rel` props
- Internal links to the analyzer web app must use **relative paths** (`analyzer/`) not absolute (`/analyzer/`) — absolute paths break on GitHub Pages which serves from a base path
- Do NOT add placeholder `href="#"` links — only link to pages/resources that actually exist
- Footer columns only contain: Resources (Release Notes → GitHub releases, README), Community (GitHub, Issues), Legal (License)

---

## Git Commit Rules

- **Do NOT add `Co-Authored-By: Claude` or any AI attribution** to commit messages. Keep commits clean with just the change description.

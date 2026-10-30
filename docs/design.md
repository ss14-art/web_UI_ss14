# WebUI design system

## DOOM arcade: approved themed exception

### GBA / FireRed

`FireRedArcade` reuses the existing powered cabinet BUI, with a fixed 752x590
content surface and local EmulatorJS 4.2.3/mGBA in `public/arcade/firered`.
Build Vite before packaging: public files become Resources/dist and are copied
into the client resource archive by the existing resource packaging pipeline.
The player's launcher obtains that archive; CEF requests the ROM/core through
http://webui.local/dist/arcade/firered, not a developer's Windows path.
The server only authorizes opening/closing the BUI. CPU, audio and game state are
client-local, independent for each player, with no score/reward messages or netplay.
Cartridge SRAM is persisted in the client's UserData under `/ArcadeSaves/`, not on
the server and not in IndexedDB/localStorage. The parent Svelte page loads the save
through `firered-save-load` before allowing the iframe to boot EmulatorJS. The iframe
uses `gameManager.getSaveFile()` to snapshot current SRAM every 60 seconds and sends
it to the parent with same-origin `postMessage`; the parent stores it through the
NovaBridge `firered-save-write` request. The in-page Close action in the cabinet footer
asks for an immediate flush and waits up to five seconds for an acknowledgement.
The native window X/process termination cannot await JavaScript, so the last completed
minute checkpoint is the recovery point in those cases. Writes use unique temporary
files renamed to immutable generations; the three newest complete saves are retained,
and load falls back to an older valid generation. Payloads are limited to 1 MiB.
This is per-client-install storage: it survives game/window/client restarts, but does
not roam between computers or accounts. No BIOS download, CDN runtime dependency,
SharedArrayBuffer or engine changes are required. Use `invoke` for native requests;
`window.fs` and native transport through `emit` do not exist here. Native CEF testing
and a packaged-client restart/resume smoke test remain necessary before deployment.

### Fixed cabinet geometry

All arcade windows disable user resizing, but remain movable by their native header.
Preferred content sizes in logical UI units: DOOM 840x700, Asteroids 840x660,
Flappy Bird 400x650, Pac-Man 520x720, Prince of Persia 840x640, Snake/Invaders 800x660.
Native chrome is measured separately. On a smaller viewport the content is uniformly
scaled down to fit with a 16-unit edge allowance; UI scale is not applied twice.
The DOOM canvas is absolutely contained in its screen so its intrinsic buffer cannot
expand the grid or crop the HUD. Letterboxing is preferable to clipped gameplay.

Nu, pogodi! uses a 936x607 content surface (or uniform downscale), not an arbitrary
1000x700 rectangle. Its iframe opens immediately, with no themed bezel, start overlay
or web footer during gameplay. The original Game A/B buttons remain part of the game;
the native close button remains available. The original handheld art is contain-fit.
Assets are local; no remote font is required. See the provenance warning in the pack README.

### Six classic cabinets

The `arcade` entry renders a host-selected game, never a user-supplied URL.
Asteroids uses a white vector/starfield theme; Flappy Bird uses sky/pipe colours;
Pac-Man uses blue maze borders and yellow accents; Prince of Persia uses an arched
gold/burgundy frame; Snake uses an olive LCD palette; Space Invaders uses black/green.
Each has a separate entity and circuit board, inheriting the existing cabinet's
power, wiring and BUI lifetime. The native window and deferred bridge dispatch are
shared with DOOM. Existing DOOM IDs and behaviour remain compatible.

Game files live in `public/arcade`, copied by Vite to generated `Resources/dist`.
Each legacy game runs in an iframe to isolate its globals from Svelte. This is
not a security boundary against malicious same-origin code: the shipped scripts
are trusted content. CSP disallows external resource loading; CEF only permits
the selected game's exact index URL and the shell URL for navigation. Native
bridge actions stay allowlisted. No score or reward crosses to the server.
An adapter normalizes CEF virtual keys, releases held keys on blur and reports
page load/errors to the shell. Destroying the frame stops game audio and timers.
Space Invaders additionally exposes its existing Play click as Enter.

Pac-Man's Modernizr, jQuery and both audio formats are local. No CDN is required.
Keep the source notices and `public/arcade/README.md` provenance caveats; do not
represent the supplied pack as license-cleared for public distribution.
Browser smoke checks: `scripts/verify-classic-arcades.js` uses a mock bridge and
checks all seven local pages, game surfaces at preferred/reduced sizes, keyboard start
and network errors. `scripts/verify-doom-layout.js` loads the real local WASM and
checks canvas containment at three viewport sizes through the same preview server.
Native CEF power/range closure, input and reopen remain a separate manual gate.

The arcade uses classic DOOM-inspired metal rather than shared GlassUI:
graphite, warm ivory text, square bevelled buttons, oxide-red actions and amber
keyboard focus. Decoration is original CSS without imported fonts or artwork.
The typographic DOOM mark appears only before gameplay, not as a second title
bar. Native window chrome stays game-owned. No filters obscure the game canvas.
The localized footer wraps at small sizes. Font Awesome, 40px targets and reduced
motion remain supported. This theme does not change WASM, bridge or keyboard-only input.

This is the design contract for WebUI interfaces embedded in the Arcane SS14 client. The native client remains the source of truth for behaviour, permissions, state, and localization; the web page renders that state and requests actions.

## Principles

- **Native chrome, web content.** `DefaultWindow` owns title bar, close button, placement, and input lifetime. WebUI begins below that chrome and never redraws it.
- **State first.** C# sends an ordered, fully-resolved view model. Svelte does not infer permissions, visibility, unread state, or disabled reasons.
- **SS220-inspired panels.** Cool blue-grey surfaces, flat action rows, restrained blue hover and focus, and thin group dividers follow the compact SS220 TGUI language.
- **Recognizable actions.** Each interactive command has a Font Awesome Free icon and localized text.
- **Keyboard parity.** Visual order, Tab order, and screen-reader order must agree; keyboard focus is always visible.

## BandaStation reference: what is and is not reused

`D:\ss14gays\BandaStation\tgui` has been examined as a design and interaction reference.

The compact menu uses `packages/tgui/styles/themes/ss220.scss` as its colour reference (blue hue around 202 degrees, dark blue-grey base, pale text). The separate `tgui-escape-menu/styles/main.scss` contributes unboxed action hierarchy and grouping, not its full-screen pixel-art presentation. This implementation is independently authored; no stylesheet or asset is copied.

| Reference pattern | Arcane WebUI interpretation |
| --- | --- |
| Reducer plus initial/incremental state updates | Native state snapshot plus explicit NovaBridge updates; no stale frontend policy. |
| Separate overlay/content/pages/resource strip | Separate shell, action groups, and reusable controls; Escape Menu stays one page initially. |
| Scale-aware layout | Flex/grid, `clamp`, min/max dimensions, and scrolling only inside the list. |
| Explicit hover, disabled, notification states | Define each state, with a non-colour cue for notification/pending state. |

Do **not** copy BandaStation React/TypeScript/Sass, pixel fonts, `escape-menu-icons40x40` sprite sheets, sound assets, or compiled assets. Its full-screen pixel-art overlay, text strokes, and raster icon system are deliberately excluded from Arcane's GlassUI.

## Shared tokens

Define these values in a shared stylesheet once a second WebUI interface needs them. Until then, Escape Menu may own them in `escape-menu.css` with the same meaning.

```css
:root {
  --ui-surface: #1b2932;
  --ui-surface-raised: rgb(255 255 255 / 6%);
  --ui-surface-hover: rgb(255 255 255 / 10%);
  --ui-surface-pressed: rgb(255 255 255 / 14%);
  --ui-border: rgb(255 255 255 / 12%);
  --ui-divider: rgb(255 255 255 / 14%);
  --ui-text: #e6e6e9;
  --ui-text-muted: #a8a8ae;
  --ui-focus: #8db6ff;
  --ui-positive: #67c876;
  --ui-danger: #d94a4a;
  --ui-danger-hover: #ef5a5a;
  --ui-radius: 10px;
  --ui-space-1: 4px;
  --ui-space-2: 8px;
  --ui-space-3: 12px;
  --ui-space-4: 16px;
  --ui-transition: 120ms ease;
}
```

- The native header and browser surface share the blue-grey palette. The browser body is transparent; the panel supplies its own readable surface. CSS backdrop blur cannot blur the game scene behind the CEF texture, so do not promise that effect.
- Default typography is a system UI stack. Do not set global uppercase, pixel rendering, text stroke, terminal scanlines, or terminal-green accent.
- Motion changes opacity, colour, or a small transform for 120–180 ms. Disable it for `prefers-reduced-motion: reduce`.

## Components

### ActionButton

The canonical command is a semantic `<button type="button">`:

```text
┌──────────────────────────────────────────────────────────┐
│ [Font Awesome icon]  Localized action label  [badge/state] │
└──────────────────────────────────────────────────────────┘
```

- Min height: 40 px; horizontal padding: 12 px; icon column: 24 px; icon/label gap: 12 px; type size: 16 px.
- The label is the accessible name. Set the decorative icon to `aria-hidden="true"`; an icon alone can never name an action.
- Default rows are transparent and unboxed. Hover/focus add a muted blue surface; pressed deepens it without a layout shift. Only the whole native panel has an outer border.
- `:focus-visible` is a 2 px `--ui-focus` outline with offset. Never remove focus outline.
- A disabled meaningful action stays visible and keyboard-focusable with `aria-disabled`, is 55–65% opaque, dispatches nothing, and exposes a localized textual reason in tooltip/accessible name.
- Pending dispatch prevents duplicate clicks, reports busy in text/ARIA, and restores state after native response/error.
- Danger actions are reserved for the final group. The colour intensifies on hover; confirmation remains native unless an action already uses it.

### MenuGroup, StatusBadge, and overflow

- `MenuGroup` is an ordered set of non-shrinking rows. A 1 px divider plus 7 px padding and 7 px margin separates non-empty groups.
- `StatusBadge` always includes text. The changelog uses localized `New`, pending action uses localized `Opening…`; ordinary unread state never blinks.
- Tooltips add context but never contain the only label. They work with focus as well as hover and do not steal focus.
- Labels wrap to two lines. After that, the action list—not its shell—may scroll.

## Escape Menu

### Shell

The game title bar (currently `Game Menu`) and its close control remain native. No `<h1>` title bar, close glyph, full-screen overlay, or page background is drawn in the browser.

- Target outer width: 372 logical units, clamped to the viewport. Outer height is visible rows × 40 + dividers × 15 + 50 (header, shell padding, borders and fractional-scale rounding), clamped to viewport height minus 48.
- `menu-shell` fills client height with 8 px padding. Native content margins are 1 px on the sides/bottom and zero below the header.
- `action-list` is a vertical flex column, grows to available height, and owns `overflow-y: auto`.
- C# supplies groups in order. Hidden optional rows must not leave blank dividers.
- On short heights keep 40 px targets and 16 px text; scroll the list instead of shrinking groups or hiding actions. Robust supplies logical dimensions; CEF supplies device scaling. Do not apply a second CSS scale.
- Each entry point gets its own CSS output (`cssCodeSplit: true`). Escape Menu does not import the terminal theme's `base.css` or `variables.css`.

### Contract and lifecycle

Arcane must work with the externally distributed Robust engine; do not rely on a modified engine binary. The native Escape Menu replaces its WebViewControl and bridge before reopening a closed window. A fresh control receives an initial layout resize instead of reopening a retained control with a 1x1 CEF texture and unchanged logical size. On UI-scale notification the old browser is hidden immediately, its bridge is detached, and the controller replaces it on the next frame (outside the scale-notification traversal). Local page state and scroll position reset; authoritative menu state is fetched again. This is a content-side mitigation, not an engine texture fix. Verify repeated same-size opening and scale changes in the actual distributed client before considering the crash resolved.

Native host states are `Closed`, `Loading`, `Ready`, and `Failed`. Browser creation is lazy, after the window enters the UI tree. `escape-menu-get-state` is allowed during loading; the Svelte page acknowledges rendered state with `escape-menu-ready`. Only `Ready` accepts `escape-menu-action`. Each recreated browser owns a fresh bridge/queue; disposed bridges cannot dispatch replies and old callbacks cannot act on a replacement window.

The controller schedules menu updates through `ITaskManager.RunOnMainThread`. UIController.FrameUpdate runs **after** Robust layout, so it must not directly create browser/native child windows or resize controls: doing so can draw unarranged TabContainers. The queued update checks window identity and open state before applying work, and runs before the next UI layout.

If browser construction fails or readiness takes ten seconds, the host removes the browser and shows a native fallback. It uses the same state and action whitelist, including optional/disabled buttons, group spacing and the changelog badge text. This emergency UI uses native text buttons (no raster substitute icons), not another implementation of game behavior. Its Retry button creates a new browser. Loading/fallback/retry/error messages come from FTL; before the state arrives the web page renders no English bootstrap messages. Native window close remains available during loading/failure.

Browser regression: start Vite preview on `127.0.0.1:5174`, open a playwright-cli session, then run `playwright-cli run-code --filename WebUI/scripts/verify-escape-menu.js` from the Arcane root. This covers layout, keyboard wrapping, disabled dispatch, error recovery, live badge and Unicode chunked push using a mock native transport. It does not replace in-game CEF regression.

```ts
type EscapeMenuTone = 'normal' | 'danger';

interface EscapeMenuAction {
  id: string;              // stable native command, never based on label
  label: string;           // native-localized
  icon: string;            // allowlisted Font Awesome name
  visible: boolean;
  enabled: boolean;
  tooltip?: string;        // native-localized disabled reason
  tone: EscapeMenuTone;
  badge?: 'new';
}

interface EscapeMenuGroup {
  id: 'top' | 'information' | 'configuration' | 'session';
  separatorBefore: boolean;
  actions: EscapeMenuAction[];
}

interface EscapeMenuState {
  title: string;          // native-localized navigation label, not an in-page header
  newLabel: string;
  pendingLabel: string;
  errorLabel: string;
  retryLabel: string;
  groups: EscapeMenuGroup[];
}
```

1. `novaBridge` invokes `page-ready` after the DOM is available.
2. The page subscribes to `escape-menu-state` before invoking `escape-menu-get-state`.
3. It renders the returned state and invokes `escape-menu-ready`; local state is limited to transient loading, error, and pending-action presentation.
4. An enabled button invokes `escape-menu-action` with `{ action: id }`.
5. C# validates the ID, executes the established native action, responds with `{ success: true, closeMenu: boolean }`, and pushes updated state when required. For child windows the frontend receives success before invoking `escape-menu-close`; failures keep the menu usable. Disconnect and Quit terminate the session/process directly.
6. Escape from the WebUI invokes `escape-menu-close`; the native title-bar close button directly closes the window. C# returns focus to the game.

The actual `src/lib/novaBridge.ts` uses same-origin `fetch` at `http://webui.local/__bridge__/…`. Older documentation that mentions a hidden `ev://` iframe is obsolete; do not implement that transport.
Its `emit()` currently dispatches a local browser event only. Native commands use `invoke()`.

### Actions

IDs and labels are stable/native-localized; Font Awesome names below are the preferred Free icons.

| Group | ID | Icon | Native behaviour/condition |
| --- | --- | --- | --- |
| top | `patron-perks` | `crown` | Optional first action, visible only when the existing account capability allows it. |
| top | `changelog` | `scroll` | Opens existing changelog. Badge mirrors `ChangelogManager.NewChangelogEntries`; only this action marks it read. |
| top | `source-code` | `code-branch` | Visible only with configured source URL; opens configured commit/master link. |
| top | `call-vote` | `check-to-slot` | Opens existing Vote Call UI. `IVoteManager.CanCallVote` supplies enabled state/reason. |
| information | `rules` | `scale-balanced` | Opens existing rules/info window and closes Escape Menu. |
| information | `guidebook` | `book-open` | Toggles existing guidebook; preserves existing close semantics. |
| information | `wiki` | `globe` | Visible only with configured wiki URL; opens it externally. |
| information | `feedback` | `comment-dots` | Opens existing feedback UI and closes Escape Menu. |
| information | `bug-report` | `bug` | Visible only with configured bug URL; opens it externally. |
| information | `admin-remarks` | `clipboard-list` | Invokes established Admin Remarks flow; disabled with native localized reason when notes are unavailable. |
| configuration | `options` | `gear` | Opens Options and closes Escape Menu. |
| configuration | `character` | `user-pen` | Opens the character editor flow and closes Escape Menu. |
| session | `disconnect` | `plug-circle-xmark` | Executes established disconnect and closes Escape Menu; `danger`. |
| session | `quit` | `right-from-bracket` | Executes established quit and closes Escape Menu; `danger`. |

Import Font Awesome Free in one `fontAwesome.ts` allowlist. Do not dynamically import arbitrary bridge-provided icons, inject SVG strings from host data, or replace a missing icon with emoji, PNG, or sprites. A bundled Nerd Font may be used only when a control also has a text/accessibility label.

### File shape

```text
src/interfaces/escape-menu/
├── App.svelte                 # lifecycle, host state, dispatch
├── escape-menu.css            # local tokens and shell/layout
├── escapeMenuTypes.ts         # DTOs and ID/tone unions
├── fontAwesome.ts             # icon allowlist
└── components/
    ├── ActionButton.svelte
    ├── MenuGroup.svelte
    └── StatusBadge.svelte
```

Use `onMount` cleanup for bridge subscriptions. Catch failed invokes, clear pending state, retain focus, and show a localized non-blocking error. Never render host text through `{@html}`.

## Acceptance criteria

- No duplicated browser title bar or close glyph.
- Every current native action, optional action, visibility rule, separator, and close semantic remains reachable in logical order.
- The changelog badge appears at startup, updates live while menu is open, and is consumed only after changelog opens.
- Every row has Font Awesome Free icon plus localized label; no PNG/sprite/emoji interactive icon exists.
- Focus starts at the first enabled row; Tab/Shift+Tab work predictably; Escape closes through C# and returns focus to the game.
- Normal and minimum height preserve 40 px rows and readable text; only the list scrolls. Tab/Shift+Tab wrap within the menu. Failed requests expose a retry control.
- Production build is exercised through `http://webui.local`, then CEF load, bridge error, live push, and every native action are manually verified.

## Lobby (Arcane)

Entry: `/dist/src/interfaces/lobby/index.html`. Unlike a windowed interface, the lobby
is a full-screen presentation owned by `Content.Arcane.Client/Lobby/LobbyWebUiController`.
It must not change the in-round chat or HUD. No engine modifications are required.

### Composition and ownership

- The artwork fills the left scene with `object-fit: cover`. The round card is anchored
  to the scene's **top-right corner**, immediately before the right column.
- The bottom-left character card, utility links and right column share the same glass
  surface, border, radius and focus treatment. Logo uses the local 256px asset at 64–80px.
- The right column is entirely Svelte: server information, AHelp/Call vote/Options/Leave,
  channel selector, message history, filters and composer. It contains no visible native widgets.
- The original hidden `ChatBox` remains the game-owned chat adapter. Sending goes through
  `ChatUIController.SendMessage`, with the same prefix handling and server authority.
  Filters use its existing filter popup state. Native notification handling remains attached.
- Existing child windows, character editor and active vote popups remain native. Only the
  character sprite is composited into the left card; CSS reports its rectangle. Reparenting
  deletes the old preview entity, so the owning controller reloads it and restores its
  original size/scale when the web presentation ends.
- Hide UI removes the panels and expands the scene. The existing native recovery button
  remains available independently of the browser. Failure/timeout restores the native lobby.

### Bridge contract

All calls use `novaBridge.invoke`; `emit` is a local browser event, not a native call.
Payloads are flat strings/integers. C# validates each event's field count and allowed values.

| Request | Data | Native responsibility |
| --- | --- | --- |
| `page-ready` | Initial size or `{}` | Acknowledge bridge availability. |
| `lobby-get-state` | `{}` | Return versioned, localized state. |
| `lobby-ready` | `{}` | Activate the web presentation and attach the sprite/vote overlays. |
| `lobby-action` | `action` | Recompute availability and run an existing whitelisted callback. |
| `lobby-set-ui-visible` | `visible: 0/1` | Hide/restore presentation and native recovery button. |
| `lobby-layout` | Integer `x/y/width/height` | Validate against viewport and 160px preview bounds; place sprite. |
| `lobby-chat-send` | `text`, `channel` | Validate selectable channel/length; send via existing chat controller. |
| `lobby-chat-channel` | `channel` | Select only an available channel. |
| `lobby-chat-filter` | `channel`, `active: 0/1` | Update existing channel filter. |
| `lobby-chat-draft` | `text` | Retain draft across hide/editor/browser recreation and native fallback. |
| `lobby-chat-older` | `{}` | Expand the initial 200-message history window by 200. |
| `native-key` | Physical `code`, modifier bitmask | Relay shortcuts through configured game bindings, not command strings. |

Push events: `lobby-state` contains increasing `revision` and `version: 1`;
`lobby-chat-focus` focuses the browser composer for the game's normal chat shortcut.
State is compared at most four times per second; unchanged snapshots are not transmitted.
Large responses use the existing chunked transport. Navigation or scale change destroys
the old surface; a new page establishes its own ready handshake. Initial scale inheritance
must not trigger an endless recreation loop.

Chat uses text spans with an allowlist of color/bold/italic markup. Never use `{@html}`
for chat, server information, FTL output, names or licenses. Unsupported game-specific
markup is not converted into HTML controls. Scroll stays at the bottom only when already
there; users can read older messages, load more and return to the latest message.
Tab/Shift+Tab in the composer cycle channels; Up/Down recall submitted messages.
Messages and labels, including Cyrillic, use UTF-8 base64 transport. Path traversal checks
apply to the URL path, not percent-encoded query data.

### Keyboard boundary

CEF owns text editing, IME and normal HTML focus navigation. Backquote and F1–F24 are
forwarded even from text fields; letter/number shortcuts are forwarded outside editors.
`native-key` is processed on the UI thread, releases browser focus, then calls the public
input manager's key down/up pipeline. It preserves configured bindings and lets a newly
opened native window keep focus. A stale request cannot steal focus from that window.
This relay is shared with Escape Menu. No raw engine hook, reflection or engine patch is used.

The CEF host currently supplies SDL scancodes in the Windows native-scancode field.
Consequently DOM `KeyboardEvent.code` is not trustworthy here: e.g. SDL F1 (58) can
be interpreted as Windows CapsLock. The frontend normalizes from `keyCode`, backed
by the host's explicit `WindowsKeyCode` mapping, before dispatching `native-key`.
Unknown virtual keys are ignored, not reinterpreted through the mismatched scancode.
Regression checks must use conflicting `code`/`keyCode` pairs, not only ideal browser events.

Lobby channel selection uses an in-page GlassUI listbox, never a native HTML `select`
popup: the off-screen CEF popup surface does not reliably share the main surface's
placement/painting. Channel changes wait for acknowledgement and a fresh versioned
state before enabling send; the outgoing message must not use a stale 250ms snapshot.

### Media and administration

Artwork belongs to `Resources/Textures/_Arcane/LobbyScreens`, not the WebUI repository.
Supported host MIME types: WebP, PNG, JPG/JPEG and GIF. A `lobbyBackground` prototype can
provide `poster`, `license`, `focusX`, `focusY`; static posters support reduced motion and
native fallback. The host exposes only exact registered asset URLs under `/assets/lobby/`.
Credits use prototype localization. License documents supplied with assets are kept verbatim;
the GIF's Arcane-only, non-transferable permission is **not** a license for downstream reuse.

Server commands require `AdminFlags.Fun` (or the server console), validate pool membership,
support completion, and audit old/new selections:

```text
lobbybackground list
lobbybackground set ArcaneRat
lobbybackground random
lobbybackground reset
lobbymusic list
lobbymusic set <exact-track-path-returned-by-list>
lobbymusic random
lobbymusic reset
```

Music uses the configured `CCVars.LobbyMusicCollection`, never arbitrary paths. New revisions
restart the chosen track for lobby clients, retain the selection for late arrivals and muted
clients, and do not start music in gameplay. Reset restores the randomized playlist. Background
reset selects from the ordinary prototype pool. Selections are runtime-only, not persisted.

### Verification and handoff

Build both Arcane assemblies after changing lobby code; building `Content.Trauma.Client`
alone does not rebuild the separate Arcane module:

```powershell
dotnet build Content.Arcane.Client/Content.Arcane.Client.csproj --no-restore -c Debug
dotnet build Content.Arcane.Server/Content.Arcane.Server.csproj --no-restore -c Debug
dotnet build Content.Trauma.Client/Content.Trauma.Client.csproj --no-restore -c Debug
```

Client build runs `npm ci` and production build. Both Escape Menu and Lobby HTML outputs
must exist in `Resources/dist`; generated output is not versioned. Client/server network
contracts changed, so run matching rebuilt binaries.

Manual CEF gate: preview before/after editor, hide/restore, resize/UI scale, normal and
Russian keyboard layouts, backquote/F-keys, chat focus/send/filter/history, server-info
collapse, native child windows, reconnect, all five image extensions, animated GIF and
admin media commands with two lobby clients plus an in-round client. A successful build
does not certify those runtime interactions.

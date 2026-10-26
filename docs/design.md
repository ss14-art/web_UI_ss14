# WebUI design system

This is the design contract for WebUI interfaces embedded in the Arcane SS14 client. The native client remains the source of truth for behaviour, permissions, state, and localization; the web page renders that state and requests actions.

## Principles

- **Native chrome, web content.** `DefaultWindow` owns title bar, close button, placement, and input lifetime. WebUI begins below that chrome and never redraws it.
- **State first.** C# sends an ordered, fully-resolved view model. Svelte does not infer permissions, visibility, unread state, or disabled reasons.
- **Quiet GlassUI.** Dark translucent layers, fine borders, clear text hierarchy, and purposeful whitespace take priority over decoration.
- **Recognizable actions.** Each interactive command has a Font Awesome Free icon and localized text.
- **Keyboard parity.** Visual order, Tab order, and screen-reader order must agree; keyboard focus is always visible.

## BandaStation reference: what is and is not reused

`D:\ss14gays\BandaStation\tgui` has been examined as a design and interaction reference.

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
  --ui-surface: rgb(18 20 24 / 82%);
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

- A surface combines `--ui-surface`, a 1 px `--ui-border`, and an opaque readable fallback. Use `backdrop-filter: blur(10px)` only after confirming CEF performance.
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

- Min height: 44 px; horizontal padding: 12 px; icon column: 24 px; icon/label gap: 12 px.
- The label is the accessible name. Set the decorative icon to `aria-hidden="true"`; an icon alone can never name an action.
- Default has a raised glass surface. Hover/focus brighten the surface and border; pressed uses `--ui-surface-pressed` with no layout shift.
- `:focus-visible` is a 2 px `--ui-focus` outline with offset. Never remove focus outline.
- A disabled meaningful action stays visible, is 55–65% opaque, dispatches nothing, and exposes a localized textual reason in tooltip/`aria-describedby`.
- Pending dispatch prevents duplicate clicks, reports busy in text/ARIA, and restores state after native response/error.
- Danger actions are reserved for the final group. The colour intensifies on hover; confirmation remains native unless an action already uses it.

### MenuGroup, StatusBadge, and overflow

- `MenuGroup` is an ordered set of rows. The initial Escape Menu uses no heading. A 1 px divider with 12 px vertical space appears between non-empty groups only.
- `StatusBadge` always includes text. The changelog uses localized `New`, pending action uses localized `Opening…`; ordinary unread state never blinks.
- Tooltips add context but never contain the only label. They work with focus as well as hover and do not steal focus.
- Labels wrap to two lines. After that, the action list—not its shell—may scroll.

## Escape Menu

### Shell

The game title bar (currently `Game Menu`) and its close control remain native. No `<h1>` title bar, close glyph, full-screen overlay, or page background is drawn in the browser.

- Target browser client width: 360–420 px; client height: 500–620 px. Native code decides the final outer size including chrome.
- `menu-shell` fills client height with 12 px padding and the glass surface.
- `action-list` is a vertical flex column, grows to available height, and owns `overflow-y: auto`.
- C# supplies groups in order. Hidden optional rows must not leave blank dividers.
- On short heights keep 44 px targets and 14 px minimum text; scroll the list instead of reducing/hiding actions.

### Contract and lifecycle

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
  groups: EscapeMenuGroup[];
}
```

1. `novaBridge` invokes `page-ready` after the DOM is available.
2. The page subscribes to `escape-menu-state` before invoking `escape-menu-get-state`.
3. It renders the returned state; the only allowed local state is transient `pendingActionId`.
4. An enabled button invokes `escape-menu-action` with `{ action: id }`.
5. C# validates the ID, executes the established native action, responds success/error, and pushes updated state when required.
6. Escape/native close invokes `escape-menu-close`; C# closes the window and returns focus to the game.

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
- Normal and minimum height preserve 44 px rows and readable text; only the list scrolls.
- Production build is exercised through `http://webui.local`, then CEF load, bridge error, live push, and every native action are manually verified.

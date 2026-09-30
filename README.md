# pyRevit Extension Builder

A tool to create your pyRevit extension with no knowledge of programming.

React + TypeScript single-page app, built with Vite, linted and formatted with
Biome, tested with Vitest, managed with pnpm.

```sh
pnpm install
pnpm dev          # local dev server
pnpm lint         # biome check
pnpm typecheck    # tsc
pnpm test         # vitest unit + component tests
pnpm test:e2e     # playwright, every spec at six screen sizes
pnpm build        # production build into dist/
```

`pnpm exec playwright install chromium` once before the first e2e run.

`.mcp.json` registers three Playwright MCP servers for Claude Code (and any other
MCP client) so an agent can drive the app at a fixed size: `playwright-desktop`
(1920x1080), `playwright-laptop` (1280x800) and `playwright-mobile` (iPhone 15).
Each runs headless in an isolated profile, from the version pinned in
`package.json`.

## Deploying

`main` holds the source. Every push to `main` runs
`.github/workflows/deploy.yml`, which lints, type-checks, tests and builds, then
force-pushes the contents of `dist/` as a single commit to the **`build`**
branch. GitHub Pages serves the `build` branch root, and `public/CNAME` is copied
into every build, so the custom domain stays attached.

Vite fingerprints every asset filename (`index-<hash>.js`), so a fresh
`index.html` can never be paired with a stale CSS or JS file from the Pages cache
— the manual `?v=` token the static version needed is gone.

## Your work is kept

The ribbon you are building is saved to `localStorage` on every change, so a
reload does not lose it. **RESET** in the header discards it and returns to a
single empty tab, panel and command. This is separate from SAVE/LOAD LAYOUT,
which is the explicit file you keep.

The draft is written from a single store subscription
(`src/state/persistence.ts`), so no action can forget to persist.

## The folder preview

The generated tree sits in a collapsible panel **beside** the ribbon, not below
it: the ribbon takes ~80% of the width and the preview ~20%, and the two columns
are `align-items: flex-start` so expanding a deep tree does not stretch the
toolbar. It is a native `<details>`, so it toggles and is keyboard accessible
without any JavaScript, and it starts collapsed — the ribbon is what you work in
and the tree is a reference. Whether it is open is remembered separately from the
draft (`pyrevit-extension-builder:prefs:v1`), because it is a view preference
rather than part of the extension. The summary shows the folder and file counts,
so the state is visible without expanding it. The tree scrolls inside its own
panel rather than growing the page.

## The ribbon

The canvas is laid out the way Revit's ribbon is: tabs along the top, panels
side by side with a vertical rule between them, and each panel's name along the
bottom. Item sizing follows the same rules:

| | size | label |
| --- | --- | --- |
| single command | fills the panel height, 48px icon | below the icon |
| stack of 2 or 3 | column of rows, top-aligned, 16px icon (one third) | beside the icon |
| pulldown / split | full-height large button, 48px icon | below the icon, with a chevron |

A stack is top-aligned rather than centred, so its first row's icon lands on the
same line as a full-height command's icon. The one-third
relationship is a single custom property on `.button`, so the two numbers cannot
drift apart. The ribbon's height is sized to its tallest item rather than fixed,
so there is no dead space under a stack's last row or a group's chevron.

A group shows no chevron overlapping its title: the chevron is a rotated CSS
border, sized to its own content, and anchored to the header's padded bottom
edge, so it sits under the label whether that label is one line or wraps to two.
It is a border, not a text glyph, because a literal `▼` was re-encoded into
mojibake on the way to disk.

Add affordances are inline, not floating. A stack's `+` is the last row of the
column, exactly where the next command will appear, sized like a real row, and
it is always visible: a hover-revealed one cannot be found, and it is the only
way to reach a stack's minimum of two. The tab strip's `+` sits at the
right-hand end instead, because it is a control for the whole strip rather than
part of the tab list. Both are keyboard reachable.

The tab strip is the *top of the ribbon*, so it lives inside the ribbon column
and stops where the ribbon stops — as a sibling of the folder preview it ran the
full width and read as belonging to the tree. It is grey chrome while the panel
area below is near-white, and the active tab is pulled up over the strip's rule
so it reads as dropping into the panels; there is no underline marking the
selection, because the interrupted rule already does that. The strip's top
corners are square: rounding them clipped its own background and let the darker
app background show through as a grey wedge at the top left.

Delete is a small red cross in the top-right of the thing it removes. It
appears on hover, and its tooltip names the command and its bundle type.

## Dragging

Everything on the ribbon can be dragged with [dnd-kit](https://dndkit.com):
commands, pulldowns and split buttons by the item itself, stacks by the dotted
grip above them (every pixel of a stack is one of its rows, so it needs its own
handle). Where you let go decides what happens:

- on the left or right half of an item, the bundle lands before or after it,
  shown as a blue bar; in a stack or an open group list the halves are top and
  bottom;
- on the middle half of a stack or a group, it goes inside, shown as an outline;
- on the empty part of a panel, or an open group list, it goes at the end.

The target turns red when the drop is illegal (a stack in a stack, a fourth row,
a duplicate name, a group inside its own command), and letting go there explains
why in a dialog and changes nothing. The rules are the same ones the modal uses
(`src/domain/rules.ts`), so the two paths cannot disagree. Movement has to pass
6px before a drag starts, so click (open a group), click-to-rename and
double-click (edit) still work on the same item. The keyboard works too: focus an
item, press Space, move with the arrow keys, press Space again.

## Dialogs

There is no `window.alert` or `window.confirm` anywhere. Every message and
question goes through `showAlert` / `showConfirm` (`src/state/dialogs.ts`),
rendered by one `DialogHost` above the bundle modal. Escape cancels the dialog
before it reaches the modal underneath. The e2e suite fails any test in which a
native dialog appears.

## Why the type table exists

`src/domain/bundleTypes.ts` is the single source of truth for every bundle type. Each row
carries the folder postfix, the files it emits, its nesting whitelist and its
`bundle.yaml` keys. Everything else — the modal picker, the folder tree, the
renderer, drag-and-drop rules, validation — reads from it.

This is deliberate. pyRevit identifies a bundle purely by the folder suffix, and
a suffix it does not recognise is **silently skipped**: the folder is simply
absent from the ribbon with no error anywhere
(`dev/pyRevitLoader/pyRevitExtensionParser/ExtensionParser.cs:1032-1035`).
Scattering that list across template, renderer and export code is how a type
ends up half-implemented, so there is now exactly one place it can go wrong,
and `src/domain/domain.test.ts` asserts it against pyRevit's own parser enum.

Supported types, all 13 element postfixes pyRevit understands:

| Builder type | Folder suffix | Notes |
| --- | --- | --- |
| Push Button | `.pushbutton` | `script.py` |
| Toggle | `.smartbutton` | a toggle *is* a smartbutton with `on.png` / `off.png`; there is no `.togglebutton` in pyRevit |
| Panel Button | `.panelbutton` | context is forced to `zero-doc` |
| URL Button | `.urlbutton` | needs `hyperlink:` |
| Content Button | `.content` | needs a `content.rfa` you add yourself |
| Pulldown | `.pulldown` | group |
| Split Button | `.splitbutton` | group |
| Split Push Button | `.splitpushbutton` | group |
| Combo Box | `.combobox` | items come from `members:`, not child folders |
| No Button | `.nobutton` | script with no ribbon button |
| Stack | `.stack` | 2–3 commands; fewer than 2 is skipped by pyRevit |
| Link Button | `.linkbutton` | needs `assembly:` + `command_class:` |
| Invoke Button | `.invokebutton` | needs `assembly:` + `command_class:` |

Nesting is enforced where you build it, not at export time: a pulldown only
offers leaf commands, a stack refuses a nested stack, and dropping something
illegal is rejected with the reason.

## The Advanced section

`context`, `hyperlink`, `assembly`, `command_class`, `availability_class`,
`members` and the dark-theme icon are behind a disclosure, because most
extensions do not need them. Two of them are load-bearing when present:

- **`context`** — without it pyRevit generates no availability class at all, so
  the button is enabled unconditionally.
- **`assembly` / `command_class`** — `.linkbutton` and `.invokebutton` bind
  straight to a compiled .NET class. Without them the button is created and does
  nothing.

## Before you download

The builder refuses to produce an archive that pyRevit would not load, and says
why: illegal nesting, an under-filled stack, a missing required key, two names
that sanitise to the same folder, a content button with no `.rfa`.

## Checks

`pnpm test` covers what `verify.js` used to: the postfix table against pyRevit's
parser enum, the sanitiser, YAML quoting, every bundle type's files, nesting
rules, the validator and the v1→v2 layout migration. It also covers the store
(add, move, reorder, delete, type change), the drop resolver and the dialogs.

`pnpm test:e2e` drives the built site in Chromium at 1920x1080, 1400x1050,
1280x800, 1024x768, 768x1024 and 390x844. Every test fails on a page error, a
console error, a failed request or a native dialog. Across all sizes it checks:

- **layout**: no sideways page scroll, header actions inside the viewport and
  apart, ribbon and folder preview not overlapping, tab strip flush with the
  ribbon, items inside their panel, a stack's first row level with a
  full-height command's icon;
- **modal**: every bundle type fits the screen with Advanced open and closed,
  with no scrollbar from 1024x768 up; validation errors appear in app dialogs;
- **ribbon**: tabs, panels, rename, delete guards, stack confirm, draft restore
  and RESET;
- **drag and drop**: reorder in a panel and in a stack, into and out of a stack,
  into a pulldown and back out of its open list, across panels, illegal and
  over-full drops refused with a reason, click and double-click still working;
- **export**: the ZIP holds only folder suffixes pyRevit knows, real PNG icons,
  no `__init__.py` / `entrypoint.py` / `.pyrevit`; broken extensions are refused
  with a list; save and load of a layout file round-trips.

CI runs both suites before publishing, and uploads the Playwright report when a
test fails.

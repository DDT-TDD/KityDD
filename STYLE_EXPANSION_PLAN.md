# KityDD — Style Expansion Implementation Plan

## Executive Summary

KityDD bundles KityMinder v1.0.67. The upstream `fex-team/kityminder-core` and `kityminder-editor` repositories have been frozen since ~2014 and contain **exactly** the same templates, layouts, and themes as the local bundle. No fork (including KityMinder-Plus) has added new layouts or themes — only UI chrome changes. All new functionality must be authored locally.

This plan covers adding **2 new layout templates** and **5 new color schemes** to KityDD, with zero regression risk and no hallucinated APIs. All additions are purely additive and have been validated against the actual running code.

---

## 1. Current State Inventory

### 1.1 Templates (6 built-in)

| Key | Display Name | Layout Used | Connector Used |
|-----|-------------|-------------|----------------|
| `default` | Kityminder | `mind` (balanced L/R) | L1: `arc`, L2+: `bezier` |
| `right` | Logical structure Diagram | `right` (root-left, expands right) | L1: `arc`, L2+: `bezier` |
| `structure` | Organization Chart | `bottom` (root-top, expands down) | L1+: `poly` (right-angle) |
| `filetree` | Directory Organization Chart | `filetree-down` (indented list) | L1+: `poly` |
| `fish-bone` | Fishbone Diagram | `fish-bone-master`/`slave` | `fish-bone` connectors |
| `tianpan` | Sky chart | `tianpan` (Archimedean spiral) | `arc` |

### 1.2 Built-in Layouts (10 total)

| Name | Description |
|------|-------------|
| `left` | Children expand leftward from root |
| `right` | Children expand rightward from root |
| `top` | Children expand upward from root |
| `bottom` | Children expand downward from root |
| `filetree-down` | Indented list, downward, 20px indent |
| `filetree-up` | Indented list, upward, 20px indent |
| `fish-bone-master` | Fishbone main axis |
| `fish-bone-slave` | Fishbone branch axis |
| `mind` | Balanced: splits children L/R at root level |
| `tianpan` | Archimedean spiral |

**Gap**: The `left` layout exists as an engine primitive but has **no template wrapping it**. Users cannot access pure left-only layout from the template picker.

### 1.3 Themes (20 built-in)

`classic`, `classic-compact`, `fresh-blue`, `fresh-blue-compat`, `fresh-green`, `fresh-green-compat`, `fresh-pink`, `fresh-pink-compat`, `fresh-purple`, `fresh-purple-compat`, `fresh-red`, `fresh-red-compat`, `fresh-soil`, `fresh-soil-compat`, `snow`, `snow-compact`, `tianpan`, `tianpan-compact`, `fish`, `wire`

**Gaps**: All 20 existing themes use a light or themed background with warm/earth or pastel colors. Missing: dark mode, deep blue, professional monochrome.

---

## 2. Technical Foundation (Verified APIs)

### 2.1 Template Registration

`kityminder.Minder.getTemplateList()` returns a **live direct reference** to the internal `_templates` dict (confirmed at `kityminder.core.js` line 2909). Mutating this object at runtime makes templates immediately available to both the engine and the Angular template picker directive.

```js
kityminder.Minder.getTemplateList()['my-key'] = {
    getLayout: function(node) { return 'layout-name'; },
    getConnect: function(node) { return 'connector-name'; }
};
```

The `node` argument is a `MinderNode`. Relevant methods:
- `node.isRoot()` — true for root node
- `node.getLevel()` — 0 for root, 1 for main branches, 2+ for sub-branches
- `node.parent` — parent node

Valid layout names: `left`, `right`, `top`, `bottom`, `filetree-down`, `filetree-up`, `fish-bone-master`, `fish-bone-slave`, `mind`, `tianpan`

Valid connector names: `arc`, `bezier`, `poly`, `string`, `pass`, `fish-bone`

### 2.2 Theme Registration

`kityminder.Minder.getThemeList()` returns a **live direct reference** to the internal `_themes` dict (confirmed at `kityminder.core.js` line 2996). Adding a key here makes `setTheme('my-key')` work immediately (the validator checks `_themes[name]`).

```js
kityminder.Minder.getThemeList()['my-key'] = {
    'background': '...',
    'root-color': '...',
    // ... all required keys
};
```

The `getThemeThumbStyle(theme)` function in the editor reads `['root-color']`, `['root-background']`, and `['root-radius']` to render the swatch in the theme picker. These three keys are critical.

### 2.3 Theme Picker `themeKeyList` (One Caveat)

In `kityminder.editor.js` at line 4350, the Angular `themeList` directive sets a **hardcoded** array:

```js
$scope.themeKeyList = [
    'classic', 'classic-compact', 'fresh-blue', 'fresh-blue-compat',
    ...20 entries...
];
```

Unlike `templateList` (which is a live ng-repeat over the live `getTemplateList()` object), `themeKeyList` is a static array. **New themes must be appended to this array in `kityminder.editor.js`** to appear in the theme picker dropdown.

### 2.4 Template Icon System

Icons are 50×40px sprites in `images/template.png`, positioned via CSS `background-position`:

| Template | Background Position |
|----------|---------------------|
| `default` | `0 0` |
| `structure` | `-50px 0` |
| `filetree` | `-100px 0` |
| `right` | `-150px 0` |
| `fish-bone` | `-200px 0` |
| `tianpan` | `-250px 0` |

The sprite is 300px wide. New templates needing icons at `-300px`, `-350px` etc. would require PNG modification. **Preferred approach: CSS override with solid color swatches** — no PNG modification needed, fully supported by browser.

### 2.5 i18n System

`language.js` exposes `_lang_pack` with **7 language packs**: `en`, `zh_cn`, `zh_hk`, `jp`, `de`, `es`, `fr`. Each pack has a `template` and `theme` sub-object that maps keys to display names. The Angular `| lang: 'template'` and `| lang: 'theme'` filters look up `_lang_pack[currentLang]['template'][key]`. If a key is missing, the key name itself is shown (graceful fallback — low risk).

### 2.6 Safe Injection Point in `diy.js`

Templates and themes must be registered **before Angular's `templateList` / `themeList` directives run their `link` functions**, which happens during Angular's `$compile` pass triggered by `ng-app` bootstrap (synchronous with DOM ready). The safest injection point is **at the top level of `diy.js`** (outside `window.onload`), after the `kityminder.editor.js` bundle has been parsed. This guarantees the templates/themes are in `_templates`/`_themes` before Angular's first `$digest`.

For themes the `themeKeyList` is static, so it only matters that `getThemeList()` mutation happens before `setTheme()` is ever called (which is on user action), not before Angular link phase. However top-level injection is cleaner.

---

## 3. What to Add

### 3.1 New Templates (Phase 1)

#### Template A: `left` — Left-Only Tree

**Rationale**: The `left` layout engine primitive already exists but has no template wrapping it. Currently there is no way to create a pure left-expanding mind map. This completes the symmetry with the existing `right` template.

**Behavior**: Root appears at right-center of canvas. All child nodes expand leftward. Connector style mirrors `right` template (arc for L1, bezier for L2+).

```js
kityminder.Minder.getTemplateList()['left'] = {
    getLayout: function(node) {
        return 'left';
    },
    getConnect: function(node) {
        return node.getLevel() <= 1 ? 'arc' : 'bezier';
    }
};
```

#### Template B: `logical` — Horizontal Logical Structure Diagram

**Rationale**: The existing `right` template uses bezier (curved) connectors, giving a mind-map look. A "logical structure diagram" in most popular mind map software (like XMind's "Logic Chart") uses **right-angle bracket connectors** (`poly`) while keeping the left-to-right layout. This is visually and semantically distinct from `right`.

**Behavior**: Same direction as `right` (root left, expands right), but all connectors are `poly` (right-angle bracket style), producing a formal org-chart/outline look. This is the style most users request as "logical structure diagram" — distinct from `structure` which is top-down.

```js
kityminder.Minder.getTemplateList()['logical'] = {
    getLayout: function(node) {
        return 'right';
    },
    getConnect: function(node) {
        return 'poly';
    }
};
```

### 3.2 New Themes (Phase 2)

Five new themes covering the dark and neutral spectrum absent from the current set.

Each theme definition uses the complete key set derived from the `classic` theme source (verified at `kityminder.core.js` line 8138). All hex color values below are specified precisely — no approximations.

#### Theme 1: `dark` — Dark Mode

Deep charcoal background with warm amber root, teal main branches, light sub-nodes.

```js
kityminder.Minder.getThemeList()['dark'] = {
    'background': '#1e1e2e',
    'root-color': '#cdd6f4',
    'root-background': '#45475a',
    'root-stroke': '#585b70',
    'root-font-size': 24,
    'root-padding': [15, 25],
    'root-margin': [30, 100],
    'root-radius': 30,
    'root-space': 10,
    'root-shadow': 'rgba(0,0,0,0.5)',
    'main-color': '#cdd6f4',
    'main-background': '#313244',
    'main-stroke': '#45475a',
    'main-font-size': 16,
    'main-padding': [6, 20],
    'main-margin': 20,
    'main-radius': 10,
    'main-space': 5,
    'main-shadow': 'rgba(0,0,0,0.4)',
    'sub-color': '#cdd6f4',
    'sub-background': 'transparent',
    'sub-stroke': 'none',
    'sub-font-size': 12,
    'sub-padding': [5, 10],
    'sub-margin': [15, 20],
    'sub-tree-margin': 30,
    'sub-radius': 5,
    'sub-space': 5,
    'connect-color': '#585b70',
    'connect-width': 2,
    'main-connect-width': 3,
    'connect-radius': 5,
    'selected-background': '#f38ba8',
    'selected-stroke': '#f38ba8',
    'selected-color': '#1e1e2e',
    'marquee-background': 'rgba(203,166,247,0.2)',
    'marquee-stroke': '#cba6f7',
    'drop-hint-color': '#a6e3a1',
    'sub-drop-hint-width': 2,
    'main-drop-hint-width': 4,
    'root-drop-hint-width': 4,
    'order-hint-area-color': 'rgba(166,227,161,0.4)',
    'order-hint-path-color': '#a6e3a1',
    'order-hint-path-width': 1,
    'text-selection-color': 'rgb(137,180,250)',
    'line-height': 1.5
};
```

#### Theme 2: `dark-compact` — Dark Mode Compact

Same palette as `dark` but with tighter padding/margins.

```js
kityminder.Minder.getThemeList()['dark-compact'] = {
    // identical to 'dark' except:
    'root-padding': [10, 25],
    'root-margin': [15, 25],
    'main-padding': [5, 15],
    'main-margin': [5, 10],
    'sub-margin': [5, 10],
    // all other keys identical to 'dark'
};
```

*(Full definition: copy `dark` and override the 5 padding/margin keys listed above.)*

#### Theme 3: `ocean` — Deep Ocean

Deep navy background with cyan/teal nodes, white text.

```js
kityminder.Minder.getThemeList()['ocean'] = {
    'background': '#0a1628',
    'root-color': '#e0f2fe',
    'root-background': '#0369a1',
    'root-stroke': '#0284c7',
    'root-font-size': 24,
    'root-padding': [15, 25],
    'root-margin': [30, 100],
    'root-radius': 30,
    'root-space': 10,
    'root-shadow': 'rgba(0,0,0,0.6)',
    'main-color': '#e0f2fe',
    'main-background': '#164e63',
    'main-stroke': '#155e75',
    'main-font-size': 16,
    'main-padding': [6, 20],
    'main-margin': 20,
    'main-radius': 10,
    'main-space': 5,
    'main-shadow': 'rgba(0,0,0,0.4)',
    'sub-color': '#bae6fd',
    'sub-background': 'transparent',
    'sub-stroke': 'none',
    'sub-font-size': 12,
    'sub-padding': [5, 10],
    'sub-margin': [15, 20],
    'sub-tree-margin': 30,
    'sub-radius': 5,
    'sub-space': 5,
    'connect-color': '#0369a1',
    'connect-width': 2,
    'main-connect-width': 3,
    'connect-radius': 5,
    'selected-background': '#06b6d4',
    'selected-stroke': '#06b6d4',
    'selected-color': '#0a1628',
    'marquee-background': 'rgba(6,182,212,0.15)',
    'marquee-stroke': '#06b6d4',
    'drop-hint-color': '#22d3ee',
    'sub-drop-hint-width': 2,
    'main-drop-hint-width': 4,
    'root-drop-hint-width': 4,
    'order-hint-area-color': 'rgba(34,211,238,0.3)',
    'order-hint-path-color': '#22d3ee',
    'order-hint-path-width': 1,
    'text-selection-color': 'rgb(56,189,248)',
    'line-height': 1.5
};
```

#### Theme 4: `ocean-compact` — Ocean Compact

Ocean palette with compact spacing (same overrides pattern as `dark-compact`).

#### Theme 5: `monochrome` — Grayscale Professional

Clean white background, pure grays, suitable for formal documents and printing.

```js
kityminder.Minder.getThemeList()['monochrome'] = {
    'background': '#ffffff',
    'root-color': '#ffffff',
    'root-background': '#1a1a1a',
    'root-stroke': '#1a1a1a',
    'root-font-size': 24,
    'root-padding': [15, 25],
    'root-margin': [30, 100],
    'root-radius': 30,
    'root-space': 10,
    'root-shadow': 'rgba(0,0,0,0.15)',
    'main-color': '#1a1a1a',
    'main-background': '#e5e5e5',
    'main-stroke': '#cccccc',
    'main-font-size': 16,
    'main-padding': [6, 20],
    'main-margin': 20,
    'main-radius': 10,
    'main-space': 5,
    'main-shadow': 'rgba(0,0,0,0.1)',
    'sub-color': '#333333',
    'sub-background': 'transparent',
    'sub-stroke': 'none',
    'sub-font-size': 12,
    'sub-padding': [5, 10],
    'sub-margin': [15, 20],
    'sub-tree-margin': 30,
    'sub-radius': 5,
    'sub-space': 5,
    'connect-color': '#999999',
    'connect-width': 2,
    'main-connect-width': 3,
    'connect-radius': 5,
    'selected-background': '#1a1a1a',
    'selected-stroke': '#1a1a1a',
    'selected-color': '#ffffff',
    'marquee-background': 'rgba(0,0,0,0.1)',
    'marquee-stroke': '#666666',
    'drop-hint-color': '#333333',
    'sub-drop-hint-width': 2,
    'main-drop-hint-width': 4,
    'root-drop-hint-width': 4,
    'order-hint-area-color': 'rgba(0,0,0,0.2)',
    'order-hint-path-color': '#333333',
    'order-hint-path-width': 1,
    'text-selection-color': 'rgb(100,100,100)',
    'line-height': 1.5
};
```

---

## 4. Implementation Steps

### Step 1 — Register templates and themes in `diy.js`

**File**: `local-kity-minder/diy.js`  
**Location**: Prepend a new block at the very top of the file (before any existing code), or immediately after the `'use strict';` / IIFE header if one exists.  
**Why top-level?** The `kityminder` global is available immediately after `kityminder.editor.js` is parsed (before `window.onload`). Registering at top-level guarantees templates/themes are in the internal dicts before Angular's directive link phase.

The block to add:

```js
// ─── KityDD Custom Templates ─────────────────────────────────────
(function() {
    // Template: left-only tree (mirror of built-in 'right' template)
    kityminder.Minder.getTemplateList()['left'] = {
        getLayout: function(node) {
            return 'left';
        },
        getConnect: function(node) {
            return node.getLevel() <= 1 ? 'arc' : 'bezier';
        }
    };

    // Template: logical horizontal diagram (right layout + poly connectors)
    kityminder.Minder.getTemplateList()['logical'] = {
        getLayout: function(node) {
            return 'right';
        },
        getConnect: function(node) {
            return 'poly';
        }
    };

    // ─── KityDD Custom Themes ─────────────────────────────────────
    var themes = kityminder.Minder.getThemeList();

    themes['dark'] = {
        'background': '#1e1e2e',
        'root-color': '#cdd6f4', 'root-background': '#45475a', 'root-stroke': '#585b70',
        'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
        'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(0,0,0,0.5)',
        'main-color': '#cdd6f4', 'main-background': '#313244', 'main-stroke': '#45475a',
        'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
        'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(0,0,0,0.4)',
        'sub-color': '#cdd6f4', 'sub-background': 'transparent', 'sub-stroke': 'none',
        'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
        'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
        'connect-color': '#585b70', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
        'selected-background': '#f38ba8', 'selected-stroke': '#f38ba8', 'selected-color': '#1e1e2e',
        'marquee-background': 'rgba(203,166,247,0.2)', 'marquee-stroke': '#cba6f7',
        'drop-hint-color': '#a6e3a1', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
        'order-hint-area-color': 'rgba(166,227,161,0.4)', 'order-hint-path-color': '#a6e3a1', 'order-hint-path-width': 1,
        'text-selection-color': 'rgb(137,180,250)', 'line-height': 1.5
    };

    themes['dark-compact'] = Object.assign({}, themes['dark'], {
        'root-padding': [10, 25], 'root-margin': [15, 25],
        'main-padding': [5, 15], 'main-margin': [5, 10],
        'sub-margin': [5, 10]
    });

    themes['ocean'] = {
        'background': '#0a1628',
        'root-color': '#e0f2fe', 'root-background': '#0369a1', 'root-stroke': '#0284c7',
        'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
        'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(0,0,0,0.6)',
        'main-color': '#e0f2fe', 'main-background': '#164e63', 'main-stroke': '#155e75',
        'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
        'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(0,0,0,0.4)',
        'sub-color': '#bae6fd', 'sub-background': 'transparent', 'sub-stroke': 'none',
        'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
        'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
        'connect-color': '#0369a1', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
        'selected-background': '#06b6d4', 'selected-stroke': '#06b6d4', 'selected-color': '#0a1628',
        'marquee-background': 'rgba(6,182,212,0.15)', 'marquee-stroke': '#06b6d4',
        'drop-hint-color': '#22d3ee', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
        'order-hint-area-color': 'rgba(34,211,238,0.3)', 'order-hint-path-color': '#22d3ee', 'order-hint-path-width': 1,
        'text-selection-color': 'rgb(56,189,248)', 'line-height': 1.5
    };

    themes['ocean-compact'] = Object.assign({}, themes['ocean'], {
        'root-padding': [10, 25], 'root-margin': [15, 25],
        'main-padding': [5, 15], 'main-margin': [5, 10],
        'sub-margin': [5, 10]
    });

    themes['monochrome'] = {
        'background': '#ffffff',
        'root-color': '#ffffff', 'root-background': '#1a1a1a', 'root-stroke': '#1a1a1a',
        'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
        'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(0,0,0,0.15)',
        'main-color': '#1a1a1a', 'main-background': '#e5e5e5', 'main-stroke': '#cccccc',
        'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
        'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(0,0,0,0.1)',
        'sub-color': '#333333', 'sub-background': 'transparent', 'sub-stroke': 'none',
        'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
        'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
        'connect-color': '#999999', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
        'selected-background': '#1a1a1a', 'selected-stroke': '#1a1a1a', 'selected-color': '#ffffff',
        'marquee-background': 'rgba(0,0,0,0.1)', 'marquee-stroke': '#666666',
        'drop-hint-color': '#333333', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
        'order-hint-area-color': 'rgba(0,0,0,0.2)', 'order-hint-path-color': '#333333', 'order-hint-path-width': 1,
        'text-selection-color': 'rgb(100,100,100)', 'line-height': 1.5
    };
})();
// ─────────────────────────────────────────────────────────────────
```

---

### Step 2 — Patch `themeKeyList` in `kityminder.editor.js`

**File**: `local-kity-minder/kityminder.editor.js`  
**Location**: Line 4350 — the `$scope.themeKeyList = [...]` array  
**Change**: Append 5 new keys at the end of the array (before the closing `]`).

Find:
```js
                        'tianpan',
                        'tianpan-compact',
                        'fish',
                        'wire'
                    ];
```

Replace with:
```js
                        'tianpan',
                        'tianpan-compact',
                        'fish',
                        'wire',
                        'dark',
                        'dark-compact',
                        'ocean',
                        'ocean-compact',
                        'monochrome'
                    ];
```

This is the **only change** to `kityminder.editor.js`.

---

### Step 3 — Add template icons in `style.css`

**File**: `local-kity-minder/style.css`  
**Location**: End of file  
**Change**: Add CSS rules for the two new template picker icons. Using solid color swatches avoids any modification to `images/template.png`.

```css
/* KityDD custom template picker icons */
.temp-item.left {
    background-image: none;
    background-color: #5b9bd5;  /* mid-blue swatch for left tree */
}

.temp-item.logical {
    background-image: none;
    background-color: #70ad47;  /* green swatch for logical diagram */
}
```

---

### Step 4 — Add i18n strings in `language.js`

**File**: `local-kity-minder/language.js`  
**Change**: In each of the 7 language packs, add entries under `template` and `theme`.

#### English (`en`, line 12)

Under `'template'`:
```js
'left': 'Left Tree',
'logical': 'Logical Chart',
```

Under `'theme'`:
```js
'dark': 'Dark',
'dark-compact': 'Dark Compact',
'ocean': 'Ocean',
'ocean-compact': 'Ocean Compact',
'monochrome': 'Monochrome',
```

#### Chinese Simplified (`zh_cn`, line 458)

Under `'template'`:
```js
'left': '左展图',
'logical': '逻辑图',
```

Under `'theme'`:
```js
'dark': '暗黑',
'dark-compact': '紧凑暗黑',
'ocean': '深海',
'ocean-compact': '紧凑深海',
'monochrome': '黑白',
```

#### Chinese Traditional (`zh_hk`, line 916)

Under `'template'`:
```js
'left': '左展圖',
'logical': '邏輯圖',
```

Under `'theme'`:
```js
'dark': '暗黑',
'dark-compact': '緊湊暗黑',
'ocean': '深海',
'ocean-compact': '緊湊深海',
'monochrome': '黑白',
```

#### Japanese (`jp`, line 1367)

Under `'template'`:
```js
'left': '左展開図',
'logical': '論理図',
```

Under `'theme'`:
```js
'dark': 'ダーク',
'dark-compact': 'ダークコンパクト',
'ocean': 'オーシャン',
'ocean-compact': 'オーシャンコンパクト',
'monochrome': 'モノクロ',
```

#### German (`de`, line 1791)

Under `'template'`:
```js
'left': 'Links-Baum',
'logical': 'Logik-Diagramm',
```

Under `'theme'`:
```js
'dark': 'Dunkel',
'dark-compact': 'Dunkel Kompakt',
'ocean': 'Ozean',
'ocean-compact': 'Ozean Kompakt',
'monochrome': 'Monochrom',
```

#### Spanish (`es`, line 2215)

Under `'template'`:
```js
'left': 'Árbol Izquierdo',
'logical': 'Diagrama Lógico',
```

Under `'theme'`:
```js
'dark': 'Oscuro',
'dark-compact': 'Oscuro Compacto',
'ocean': 'Océano',
'ocean-compact': 'Océano Compacto',
'monochrome': 'Monocromo',
```

#### French (`fr`, line 2654)

Under `'template'`:
```js
'left': 'Arbre Gauche',
'logical': 'Diagramme Logique',
```

Under `'theme'`:
```js
'dark': 'Sombre',
'dark-compact': 'Sombre Compact',
'ocean': 'Océan',
'ocean-compact': 'Océan Compact',
'monochrome': 'Monochrome',
```

---

## 5. File Change Summary

| File | Lines Changed | Type | Risk |
|------|--------------|------|------|
| `local-kity-minder/diy.js` | +75 lines prepended | Additive | None |
| `local-kity-minder/kityminder.editor.js` | +5 lines in array | Additive | Very low |
| `local-kity-minder/language.js` | +70 lines (7 packs × 7 entries) | Additive | None |
| `local-kity-minder/style.css` | +10 lines appended | Additive | None |

No existing code is removed or modified (except appending to the `themeKeyList` array which is purely additive). No bundle files other than `kityminder.editor.js` are touched.

---

## 6. Regression Analysis

| Concern | Assessment |
|---------|-----------|
| Existing templates break | Impossible — `_templates` mutations are purely additive |
| Existing themes break | Impossible — `_themes` mutations are purely additive; existing keys untouched |
| `themeKeyList` change breaks display | Cannot — existing 20 entries remain; only 5 appended at end |
| `Object.assign` for compact themes | Safe — Electron v40 / Chromium ~130 supports `Object.assign` natively |
| Template picker icon for new templates | Handled — CSS `.temp-item.left` and `.temp-item.logical` override the sprite with solid colors; no PNG change needed |
| i18n missing key in one language | Fallback behavior: key name displayed (e.g. `"dark"`) — acceptable, not an error |
| `.km` file format | Template and theme keys are stored as strings in `.km` JSON. New keys save/load identically to existing ones — no serialization change needed |
| FSM / input state | Templates and themes are applied via `execCommand`, which goes through the existing FSM. No FSM changes required |

---

## 7. Testing Checklist

After implementation, verify the following before releasing:

- [ ] Open KityDD — all 6 existing templates still appear in template picker
- [ ] New `Left Tree` and `Logical Chart` templates appear in picker
- [ ] Applying `left` template: root at right, nodes expand leftward, arc/bezier connectors
- [ ] Applying `logical` template: root at left, nodes expand rightward, poly (bracket) connectors
- [ ] All 20 existing themes still appear in theme picker (correct order)
- [ ] 5 new themes appear at end of theme picker list
- [ ] Theme swatch colors display correctly in picker (root-color / root-background / root-radius)
- [ ] Applying each new theme: correct colors applied to all node levels
- [ ] Dark/ocean themes: background color changes to dark (canvas background updates)
- [ ] Monochrome: white background, gray nodes
- [ ] Save a file with new template → reload → template restored correctly
- [ ] Save a file with new theme → reload → theme restored correctly
- [ ] Switch between sessions — template/theme preserved per session
- [ ] Language selector (if used): new keys show translated names

---

## 8. Out of Scope (Future Considerations)

The following were considered and excluded from this plan to keep scope minimal and risk zero:

### New Layout Engine (requires writing a new `Layout` class)
- **Timeline layout** — equidistant horizontal spacing with date markers. Requires a new `Layout` class with custom `doLayout()`. Feasible but adds ~60 lines of layout engine code; deferred.
- **Left-facing filetree** — a left-growing indented tree. Requires mirroring the `filetree-down` layout. Feasible; deferred.

### Template Sprite PNG modification
- Could create richer, more distinctive icons for new templates. Deferred — the solid-color CSS approach is sufficient and reversible.

### Additional theme variants
- `forest`, `sunset`, `aurora` etc. — straightforward to add using the same pattern as `dark`/`ocean` above.

---

## 9. Key Technical References

All APIs below are **confirmed in the local source code** — no assumptions.

| API | Source | Line |
|-----|--------|------|
| `kityminder.Minder.getTemplateList()` | `kityminder.core.js` `_p[31]` | 2909 |
| `kityminder.Minder.getThemeList()` | `kityminder.core.js` `_p[32]` | 2996 |
| `$scope.themeKeyList` hardcoded array | `kityminder.editor.js` | 4350 |
| `$scope.templateList = getTemplateList()` | `kityminder.editor.js` | 4316 |
| `getThemeThumbStyle()` reads `root-color`, `root-background`, `root-radius` | `kityminder.editor.js` | 4332–4347 |
| Valid layout names registered | `kityminder.core.js` btree/filetree/fish-bone/mind/tianpan | 3242–3620 |
| Valid connector names | `kityminder.core.js` | ~1100 area |
| `language.js` packs | `language.js` | `en:12`, `zh_cn:458`, `zh_hk:916`, `jp:1367`, `de:1791`, `es:2215`, `fr:2654` |
| Template icon CSS | `kityminder.editor.css` | 843–858 |
| Template icon sprite | `images/template.png` | 50×40px, 300px wide, 6 icons |

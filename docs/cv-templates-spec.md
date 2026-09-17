# CV Templates — Architecture Spec

## Current State

**Preview:** HTML rendered via `CvDocument.tsx` using Tailwind CSS. Single A4 card (794×1123px) centered with `max-width: 794px`. No scale tricks.

**Export:** PDF generated via `@react-pdf/renderer` in `CvPdfDocument.tsx`. Same Terracotta template structure, colors, fonts, and field rendering as the HTML version.

**Template:** Only Terracotta is implemented. The type `CVTemplateId = "terracotta"` is a single-value union — designed to be expanded later.

---

## Option C — Dual Render Pipeline

| Concern | Implementation |
|---|---|
| Preview | HTML/CSS via `CvDocument.tsx` — fast, interactive, contentEditable |
| Export | `@react-pdf/renderer` via `CvPdfDocument.tsx` — proper PDF with page breaks, fonts, print-safe layout |
| Consistency | Both render from the same `StructuredCVData` type and follow the same section order array |

The preview stays as HTML. Export generates a proper PDF. This avoids the scale/transform hacks of a pure-HTML print approach and gives full control over PDF layout.

---

## Section Ordering

### Storage

Section order is stored as an `string[]` array in `localStorage` under key `cv-section-order`. Each element is a section key (e.g. `"summary"`, `"experience"`, `"education"`, `"skills"`, `"languages"`, `"awards"`, `"projects"`). A special `"page-break"` marker indicates where the PDF page boundary falls.

### First Load — Auto-Balance

On first load (no order in localStorage), the auto-balance algorithm runs once:

1. Each section gets a **height score**: `itemCount × AVG_ITEM_HEIGHT` (no DOM measurement needed)
2. Greedy bin-packing: assign each section to whichever column is currently shorter
3. The resulting order is saved to localStorage

This produces a reasonable two-column layout immediately.

### Manual Override

After auto-balance, the user can drag sections to reorder. The new order is saved to localStorage on every change.

### Re-balance

A "Re-balance" button re-runs the algorithm, resetting the order to the optimal layout. The user can do this at any time.

---

## Auto-Balance Algorithm

```
INPUT:  sections[] with height scores
OUTPUT: ordered array of section keys

1. Calculate height score for each section
2. Initialize two columns: left = [], right = []
3. For each section (sorted by score descending):
   - Add to the column with the smaller total height
4. Interleave columns into a single array (left, right)
5. Save to localStorage
```

No DOM measurement. Pure content-length estimation. Fast and deterministic.

---

## Section Order Panel

A small drawer/sidebar in the preview page shows the reorderable list:

```
⠿ Summary
⠿ Experience
⠿ Education
⠿ Skills
⠿ Languages
─── Page break ───
⠿ Awards
⠿ Projects
```

- `⠿` = draggable handle
- **Page break** marker is also draggable — the user can move it anywhere or remove it entirely
- Removing the page break = single-page CV
- Adding the page break back = two-page CV

---

## Page Break Behavior

### In HTML Preview

Sections **above** the page break render on **page 1** (the first A4 card). Sections **below** render on **page 2** (a second A4 card below the first, with a gap between them — like Google Docs).

If there's no page break in the list, everything renders on one page.

### In PDF Export

`@react-pdf/renderer` receives the same ordered array. Where the `"page-break"` marker appears, it inserts a `<Page>` boundary — literally starting a new PDF page. Sections have `breakInside: "avoid"` so they never split mid-section.

---

## Column Balancing Per Page

The auto-balance algorithm runs on sections **within each page independently**:

- Page 1 sections → balanced into two columns
- Page 2 sections → balanced into two columns

The user can then drag to override within each page. The page-level balance is independent — re-balancing page 1 doesn't affect page 2.

---

## Template Expansion (Future)

When adding a new template:

1. Add the ID to `CVTemplateId` union in `cv-templates.ts`
2. Add metadata entry to `CV_TEMPLATES` array
3. Add HTML rendering in `CvDocument.tsx`
4. Add PDF rendering in `CvPdfDocument.tsx`
5. Both must render the same `StructuredCVData` fields in the same section order

### Terracotta Template — Field Coverage

| Field | HTML | PDF |
|---|---|---|
| name | Yes | Yes |
| title | Yes | Yes |
| summary | Yes | Yes |
| contact | Yes | Yes |
| experience | Yes | Yes |
| education | Yes | Yes |
| skills | Yes | Yes |
| languages | Yes | Yes |
| awards | No | No |
| publications | No | No |
| volunteer | No | No |
| projects | No | No |
| certifications | No | No |
| references | No | No |
| other | No | No |

Awards, publications, volunteer, projects, certifications, references, and other are defined in `StructuredCVData` but not rendered by Terracotta. Future templates may render them.

---

## Key Files

| File | Purpose |
|---|---|
| `frontend/src/lib/cv-templates.ts` | Types (`StructuredCVData`, `CVTemplateId`), template registry |
| `frontend/src/components/CvDocument.tsx` | HTML preview rendering |
| `frontend/src/components/CvPdfDocument.tsx` | PDF export rendering |
| `frontend/src/lib/pdf-fonts.ts` | Google Fonts registration for `@react-pdf/renderer` |
| `frontend/src/routes/_authenticated/cv-preview.tsx` | Preview page, export handler, section ordering UI |
| `frontend/src/styles.css` | `.cv-page` base styles (794×1123px) |

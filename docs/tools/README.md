# PDF form tools (canonical copies — use these, don't copy per-response)

All PDFKit/CoreGraphics, no dependencies. Coordinates: PDF points, origin bottom-left,
Letter = 612×792. Run with `swift <tool> ...`.

- `stamp-pdf.swift in.pdf out.pdf "page,x,y,size,text" ...` — pre-fill typed form fields
  as freeText annotations. ⚠️ Bounds are hardcoded 530pt wide: a stamp starting past
  x≈80 overflows the right page edge, and overflowing annotations can render DISPLACED
  or overlapping in other viewers even when coordinates look right (SF18 title/phone
  collision, 9/3/26). Keep stamps short and verify visually; never trust coordinates alone.
- `list-annots.swift in.pdf pageIndex` — list annotations with index/bounds/contents.
- `remove-annot.swift in.pdf out.pdf pageIndex idx [idx...]` — delete misplaced stamps
  by index (from list-annots) without touching anything else, incl. signatures.
- `flatten-pdf.swift in.pdf out.pdf` — bake all annotations (stamps + Preview
  signatures) into page content. ALWAYS flatten before packaging/merging; annotations
  can silently drop in merges and render differently across viewers.
- `render-page.swift in.pdf pageIndex out.png [scale]` — render a page via PDFKit (what
  Preview/most viewers show). Verify the FLATTENED file this way — poppler (pdftoppm)
  and PDFKit disagree about un-flattened annotations.

Signing loop (see memory `pdf-signing-workflow`): stamp → render+inspect → `open -a
Preview` for Joseph's saved signature → render+inspect signed → flatten → render+inspect
flattened → into `out/` with a backup of the signed original in `to-sign/`.

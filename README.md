# Atelier — Clothing Design Studio

A clothing design prototyping app that you can install. It works the same on desktop, tablet and phone. It's plain HTML/CSS/JavaScript with no build step and no dependencies.

## Features

- **Garment picker** with five steps: Category → Genre → Type → Cut → Material. It covers 4 categories, 21 genres, about 200 garment types and over 35,000 cut/material combinations. Every option shows a live drawing built from its settings, and long lists can be filtered.
- **2D designer** with front and back views (outer and inner side for shoes), garment colour, contrast/trim colour, and cut or material changes after the fact. It has layers (show/hide, lock, reorder), drag/resize/rotate with mouse or touch, snapping to the centre line, pinch/scroll zoom, undo/redo, autosave (IndexedDB) and export to PNG, SVG or JSON.
- **Five ways to add artwork**, each with its own rendered look:
  - **Thin stitch**: flat embroidery with fine thread lines.
  - **Thick stitch**: raised satin embroidery with a light bevel.
  - **Print-on**: a flat ink print.
  - **Patch**: a badge with a stitched border, in rounded, square, circle, oval, shield or die-cut shapes.
  - **Integrated stitch**: knitted into the fabric, built from a stitch grid with a limited yarn palette.
- **Web image search** inside the app, using Openverse and Wikimedia Commons. Both are free, need no API key and allow cross-origin image access. Credits and licences are kept with each image. You can also upload, drag and drop, paste, or add an image from a URL.
- **Pop-out image editor** (draggable, can be maximised):
  - Cropping with aspect-ratio presets.
  - Rotate 90°, free rotation, flips and transparent-edge trimming.
  - Vectorizing (colour reduction, edge tracing and smoothing), with SVG download.
  - 20 preset filters with an intensity slider.
  - Brush, eraser, paint bucket and eyedropper.
  - Select tools: rectangle, ellipse, lasso and magic wand, with new/add/subtract/intersect modes, select all, invert, delete, fill and crop-to-selection.
  - Full history panel.
- **Accessibility**:
  - Keyboard support throughout (arrow-key navigation, shortcuts, focus management, native modal dialogs).
  - Screen-reader announcements and labelled controls.
  - Touch targets of at least 44px, reduced-motion support, and light and dark themes.

## Run it

```bash
python3 -m http.server 8123
# open http://localhost:8123
```

Any static file host works, for example GitHub Pages: Settings → Pages → deploy from branch, root folder.

### Put it on an iPhone (no App Store)

1. Host the folder somewhere with HTTPS (GitHub Pages is free).
2. Open the URL in Safari, tap **Share → Add to Home Screen**.
3. It opens full-screen with its own icon, and the app itself works offline. Web image search still needs a connection.

## Project layout

```
index.html, manifest.webmanifest, sw.js   app shell, PWA manifest, offline cache
css/app.css                               design tokens, layout, all component styles
js/main.js                                hash router + theme
js/data/catalog.js, materials.js          taxonomy (types, cuts, materials)
js/garments/                              parametric garment drawings + fabric textures
js/views/home.js, wizard.js, designer.js  screens
js/components/                            addition methods, add-artwork flow, image search
js/editor/                                image editor, filters, selection tools, vectorizer
tests/                                    gallery.html (all garments), e2e.cjs (Playwright smoke test)
```

## Tests

```bash
python3 -m http.server 8123 &
node tests/e2e.cjs          # needs Playwright; screenshots go to tests/output/
# Garment gallery: http://localhost:8123/tests/gallery.html?cat=tops&view=both (mode=cuts shows every cut)
```

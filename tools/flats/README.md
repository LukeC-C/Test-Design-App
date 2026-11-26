# Garment flats generator

Source for the custom SVG drawings in `assets/garments/` (see `docs/garment-art-brief.md`).

    python3 tools/flats/build.py            # all categories
    python3 tools/flats/build.py shoes hats # some categories

Each module (`shoes.py`, `hats.py`, `tops.py`, `bottoms.py`) draws every garment key
from hand-tuned Bézier geometry and registers it in `assets/garments/manifest.json`.
`preview.html` shows the raw files; `tests/look.html?set=<category>&view=front|back`
shows them as the app renders them.
